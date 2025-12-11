import asyncio
import io
import logging
import os
import re
from contextlib import asynccontextmanager
from typing import Any

from fastapi import HTTPException, UploadFile, status
from minio import Minio
from minio.error import S3Error
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.database import AsyncSessionLocal
from ..models.document import Document
from ..rag.vector_store import delete_by_document_id

minio_client = Minio(
    "minio:9000",
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_SECURE,
)

BUCKET_NAME = settings.MINIO_BUCKET_NAME
FOLDER = "documents/"

if not minio_client.bucket_exists(BUCKET_NAME):
    minio_client.make_bucket(BUCKET_NAME)

logger = logging.getLogger(__name__)


class UploadTooLarge(Exception):
    pass


class InvalidFileType(Exception):
    pass


class UserNotFound(Exception):
    pass


ALLOWED_EXTS = {
    ".md",
    ".doc",
    ".docx",
    ".txt",
    ".pdf",
}


def upload_to_minio(content: bytes, filename: str) -> tuple[str, int, str]:
    size = len(content)
    max_bytes = int(settings.UPLOAD_MAX_MB) * 1024 * 1024
    if size > max_bytes:
        raise UploadTooLarge(f"uploaded file exceeds max size of {settings.UPLOAD_MAX_MB} MB")

    orig_name = os.path.basename(filename or "upload.bin")
    base_name, ext = os.path.splitext(orig_name)
    ext = ext.lower()

    if ext not in ALLOWED_EXTS:
        raise InvalidFileType(f"file type '{ext}' is not allowed")

    fmt = ext.lstrip(".")

    object_name = f"{FOLDER}{base_name}{ext}"
    try:
        index = 1
        while minio_client.stat_object(BUCKET_NAME, object_name):
            object_name = f"{FOLDER}{base_name} ({index}){ext}"
            index += 1
    except S3Error as e:
        if e.code != "NoSuchKey":
            raise e

    logger.info("upload start: %s to MinIO (Object Name: %s)", orig_name, object_name)

    try:
        minio_client.put_object(
            BUCKET_NAME,
            object_name,
            data=io.BytesIO(content),
            length=size,
            content_type="application/octet-stream",
        )
        uploaded_size = size
        logger.info("upload complete: %d bytes", uploaded_size)
        return object_name, uploaded_size, fmt
    except S3Error as exc:
        raise exc


async def generate_unique_title(db: AsyncSession, original_title: str) -> str:

    base, ext = os.path.splitext(original_title)

    stmt = select(Document).where(Document.title == original_title)
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is None:
        return original_title

    like_pattern = f"{base}%{ext}"
    stmt = select(Document.title).where(Document.title.like(like_pattern))
    result = await db.execute(stmt)
    similar_titles = [row[0] for row in result.fetchall()]

    max_num = 0
    pattern = re.compile(r"^" + re.escape(base) + r" \((\d+)\)" + re.escape(ext) + r"$")
    for sim_title in similar_titles:
        match = pattern.match(sim_title)
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num

    return f"{base} ({max_num + 1}){ext}"


async def create_document_record(
    db: AsyncSession,
    title: str,
    file_path: str | None = None,
    file_size: int | None = None,
    format: str | None = None,
    creator_id: int | None = None,
    department_id: int | None = None,
) -> int:
    current_title = await generate_unique_title(db, title)

    doc = Document(
        title=current_title,
        language="vi",
        status="REQUEST",
        version_no=1,
        file_path=file_path or "",
        file_size=file_size,
        format=format or "bin",
        creator_id=creator_id,
        department_id=department_id,
    )
    db.add(doc)
    await db.flush()

    return doc.id


@asynccontextmanager
async def async_session_scope():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def enqueue_single_document(
    file: UploadFile, creator_id: int | None = None, department_id: int | None = None
) -> dict:
    orig_name = file.filename or "upload.bin"
    _, ext = os.path.splitext(orig_name)

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    max_bytes = int(settings.UPLOAD_MAX_MB) * 1024 * 1024
    if size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {settings.UPLOAD_MAX_MB} MB",
        )

    chunk_size = 8 * 1024 * 1024
    content = bytearray()
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        content.extend(chunk)

    content = bytes(content)

    object_name = None
    doc_id = None

    try:
        object_name, size, fmt = await asyncio.to_thread(upload_to_minio, content, orig_name)
        logger.info("Uploaded file to MinIO with object name: %s", object_name)

        async with async_session_scope() as db:
            doc_id = await create_document_record(
                db,
                title=orig_name,
                file_path=object_name,
                file_size=size,
                format=fmt,
                creator_id=creator_id,
                department_id=department_id,
            )
        logger.info("Created document record in database with ID: %s", doc_id)

        return {"document_id": doc_id, "object_name": object_name}

    except Exception as exc:
        logger.exception("Failed to process document %s: %s", orig_name, exc)

        if object_name:
            try:
                await asyncio.to_thread(minio_client.remove_object, BUCKET_NAME, object_name)
                logger.info("Cleaned up MinIO file: %s", object_name)
            except Exception as cleanup_exc:
                logger.error("Failed to delete MinIO file %s: %s", object_name, cleanup_exc)

        if doc_id:
            async with async_session_scope() as db:
                try:
                    stmt = select(Document).where(Document.id == doc_id)
                    result = await db.execute(stmt)
                    doc = result.scalar_one_or_none()
                    if doc:
                        await db.delete(doc)
                        await db.commit()
                        logger.info("Deleted document record from database with ID: %s", doc_id)
                except Exception as db_cleanup_exc:
                    logger.error("Failed to delete document record %s: %s", doc_id, db_cleanup_exc)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process document."
        )


async def enqueue_multiple_documents(
    files: list[UploadFile], creator_id: int | None = None, department_id: int | None = None
) -> list[dict]:
    results = []
    errors = []
    for file in files:
        try:
            r = await enqueue_single_document(file, creator_id, department_id)
            results.append(r)
        except Exception as exc:
            logger.error(f"Failed to process file {file.filename}: {str(exc)}")
            errors.append({"filename": file.filename, "error": str(exc)})
    if errors:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"errors": errors})
    return results


async def create_metadata_document(data: dict[str, Any], db: AsyncSession) -> dict:
    data.pop("status", None)
    data.setdefault("language", "vi")
    data["status"] = "REQUEST"
    doc = Document(**data)
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return {"id": doc.id, "title": doc.title}


async def list_documents(db: AsyncSession) -> list[dict[str, Any]]:
    stmt = (
        select(Document).where(Document.is_deleted.is_(False)).order_by(Document.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    return [
        {
            "id": d.id,
            "title": d.title,
            "category": d.category,
            "tags": d.tags,
            "language": d.language,
            "status": d.status,
            "version_no": d.version_no,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "current_file_size": d.file_size,
            "current_format": d.format,
        }
        for d in rows
    ]


async def get_document(doc_id: int, db: AsyncSession):
    stmt = select(Document).where(Document.id == doc_id, Document.is_deleted.is_(False))
    result = await db.execute(stmt)
    d = result.scalar_one_or_none()

    if not d:
        return None

    versions = [
        {
            "id": d.id,
            "version_no": d.version_no,
            "file_path": d.file_path,
            "file_size": d.file_size,
            "format": d.format,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
    ]

    return {
        "id": d.id,
        "title": d.title,
        "category": d.category,
        "tags": d.tags,
        "language": d.language,
        "status": d.status,
        "current_version_id": d.id,
        "current_file_size": d.file_size,
        "current_format": d.format,
        "versions": versions,
    }


async def update_document(
    doc_id: int,
    db: AsyncSession,
    file: UploadFile | None = None,
    title: str | None = None,
    category: str | None = None,
    tags: str | None = None,
    language: str | None = None,
    department_id: int | None = None,
    current_user_id: int | None = None,
) -> dict[str, Any] | None:
    stmt = select(Document).where(Document.id == doc_id, Document.is_deleted.is_(False))
    result = await db.execute(stmt)
    old_doc = result.scalar_one_or_none()

    if not old_doc:
        return None

    new_object_name = None
    new_doc_id = None

    try:
        if file:
            content = await file.read()
            orig_name = file.filename or title or old_doc.title
            _, ext = os.path.splitext(orig_name)

            new_object_name, size, fmt = await asyncio.to_thread(
                upload_to_minio, content, orig_name
            )
            logger.info("Uploaded new file to MinIO with object name: %s", new_object_name)

            try:
                await asyncio.to_thread(delete_by_document_id, str(old_doc.id))
                logger.info("Deleted vector data for old document ID %s", old_doc.id)
            except Exception as vec_exc:
                logger.warning("Failed to delete vector data for old document: %s", vec_exc)

            old_doc.is_deleted = True
            db.add(old_doc)
            await db.flush()
            logger.info("Soft deleted old document ID %s", old_doc.id)

            new_doc = Document(
                title=title.strip() if title and title.strip() else old_doc.title,
                language=language.strip() if language and language.strip() else old_doc.language,
                category=category.strip() if category and category.strip() else old_doc.category,
                tags=tags.strip() if tags and tags.strip() else old_doc.tags,
                status="REQUEST",
                version_no=old_doc.version_no + 1,
                file_path=new_object_name,
                file_size=size,
                format=fmt,
                creator_id=current_user_id or old_doc.creator_id,
                department_id=department_id if department_id is not None else old_doc.department_id,
            )
            db.add(new_doc)
            await db.commit()
            await db.refresh(new_doc)
            new_doc_id = new_doc.id
            logger.info(
                "Created new document ID %s with version %s", new_doc_id, new_doc.version_no
            )

            return {
                "id": new_doc.id,
                "title": new_doc.title,
                "category": new_doc.category,
                "tags": new_doc.tags,
                "language": new_doc.language,
                "status": new_doc.status,
                "version_no": new_doc.version_no,
                "current_file_size": new_doc.file_size,
                "current_format": new_doc.format,
            }

        # If only metadata update (no file)
        else:
            if title and title.strip():
                old_doc.title = title.strip()

            if category and category.strip():
                old_doc.category = category.strip()

            if tags and tags.strip():
                old_doc.tags = tags.strip()

            if language and language.strip():
                old_doc.language = language.strip()

            if department_id is not None:
                old_doc.department_id = department_id

            db.add(old_doc)
            await db.commit()
            await db.refresh(old_doc)

            return {
                "id": old_doc.id,
                "title": old_doc.title,
                "category": old_doc.category,
                "tags": old_doc.tags,
                "language": old_doc.language,
                "status": old_doc.status,
                "version_no": old_doc.version_no,
                "current_file_size": old_doc.file_size,
                "current_format": old_doc.format,
            }

    except Exception as exc:
        logger.exception("Failed to update document %s: %s", doc_id, exc)

        if new_object_name:
            try:
                await asyncio.to_thread(minio_client.remove_object, BUCKET_NAME, new_object_name)
                logger.info("Rolled back MinIO upload: %s", new_object_name)
            except Exception as cleanup_exc:
                logger.exception("Failed to rollback MinIO upload: %s", cleanup_exc)

        if new_doc_id:
            try:
                stmt = select(Document).where(Document.id == new_doc_id)
                result = await db.execute(stmt)
                new_doc = result.scalar_one_or_none()
                if new_doc:
                    await db.delete(new_doc)
                    logger.info("Rolled back new document creation: %s", new_doc_id)
            except Exception as db_cleanup_exc:
                logger.exception("Failed to rollback document creation: %s", db_cleanup_exc)

        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update document."
        )


async def delete_document(doc_id: int, db: AsyncSession) -> bool:
    stmt = select(Document).where(Document.id == doc_id, Document.is_deleted.is_(False))
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        logger.info("Document with ID %s does not exist.", doc_id)
        return False

    try:
        await asyncio.to_thread(delete_by_document_id, str(doc.id))
        logger.info("Deleted vector data for document ID %s.", doc_id)

        # Soft delete - only mark as deleted
        doc.is_deleted = True
        db.add(doc)
        await db.commit()
        logger.info("Successfully soft deleted document ID %s (kept in MinIO and DB).", doc_id)

        return True
    except Exception as exc:
        logger.exception("Failed to delete document %s: %s", doc_id, exc)
        try:
            await db.rollback()
        except Exception as rb_exc:
            logger.exception("Rollback failed: %s", rb_exc)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(exc)}",
        )


async def search_documents_by_name(name: str, db: AsyncSession) -> list[dict[str, Any]]:
    try:
        stmt = (
            select(Document)
            .where(Document.title.ilike(f"%{name}%"), Document.is_deleted.is_(False))
            .order_by(Document.created_at.desc())
        )
        result = await db.execute(stmt)
        rows = result.scalars().all()

        return [
            {
                "id": d.id,
                "title": d.title,
                "category": d.category,
                "tags": d.tags,
                "language": d.language,
                "status": d.status,
                "version_no": d.version_no,
                "created_at": d.created_at.isoformat() if d.created_at else None,
                "current_file_size": d.file_size,
                "current_format": d.format,
            }
            for d in rows
        ]
    except Exception as exc:
        logger.exception("Error occurred while searching documents by name: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search documents by name.",
        ) from exc


async def filter_documents_by_format(
    formats: str | list[str], db: AsyncSession
) -> list[dict[str, Any]]:
    try:
        # Convert single format string to list
        if isinstance(formats, str):
            format_list = [f.strip() for f in formats.split(",") if f.strip()]
        else:
            format_list = formats

        # Build query with IN clause for multiple formats
        stmt = (
            select(Document)
            .where(Document.format.in_(format_list), Document.is_deleted.is_(False))
            .order_by(Document.created_at.desc())
        )
        result = await db.execute(stmt)
        rows = result.scalars().all()

        return [
            {
                "id": d.id,
                "title": d.title,
                "category": d.category,
                "tags": d.tags,
                "language": d.language,
                "status": d.status,
                "version_no": d.version_no,
                "created_at": d.created_at.isoformat() if d.created_at else None,
                "current_file_size": d.file_size,
                "current_format": d.format,
            }
            for d in rows
        ]
    except Exception as exc:
        logger.exception("Error occurred while filtering documents by format: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to filter documents by format.",
        ) from exc
