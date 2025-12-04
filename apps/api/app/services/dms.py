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
from sqlalchemy.orm import selectinload

from ..core.config import settings
from ..core.database import AsyncSessionLocal
from ..models.document import Document
from ..models.document_version import DocumentVersion
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
) -> int:
    current_title = await generate_unique_title(db, title)

    doc = Document(
        title=current_title,
        language="vi",
        status="REQUEST",
    )
    db.add(doc)
    await db.flush()

    if file_path:
        dv = DocumentVersion(
            document_id=doc.id,
            version_no=1,
            file_path=file_path,
            file_size=file_size,
            format=format or "bin",
        )
        db.add(dv)
        await db.flush()

        doc.current_version_id = dv.id
        db.add(doc)

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


async def enqueue_single_document(file: UploadFile) -> dict:
    orig_name = file.filename or "upload.bin"
    _, ext = os.path.splitext(orig_name)

    # Validate file size before reading entire content
    file.file.seek(0, 2)  # Seek to end
    size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    max_bytes = int(settings.UPLOAD_MAX_MB) * 1024 * 1024
    if size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {settings.UPLOAD_MAX_MB} MB",
        )

    # Read file in chunks to avoid memory issues
    chunk_size = 8 * 1024 * 1024  # 8MB chunks
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
            )
        logger.info("Created document record in database with ID: %s", doc_id)

        # Do not process immediately here. Processing is handled by the periodic cron worker.
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


async def enqueue_multiple_documents(files: list[UploadFile]) -> list[dict]:
    results = []
    errors = []
    for file in files:
        try:
            r = await enqueue_single_document(file)
            results.append(r)
        except Exception as exc:
            errors.append({"filename": file.filename, "error": str(exc)})
    if errors:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"errors": errors})
    return results


async def create_metadata_document(data: dict[str, Any], db: AsyncSession) -> dict:
    # Ensure status is set by the system (REQUEST) and not taken from user input
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
        select(Document)
        .options(selectinload(Document.current_version))
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
            "current_version_id": d.current_version_id,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "current_file_size": d.current_version.file_size if d.current_version else None,
            "current_format": d.current_version.format if d.current_version else None,
        }
        for d in rows
    ]


async def get_document(doc_id: int, db: AsyncSession):
    stmt = select(Document).where(Document.id == doc_id)
    result = await db.execute(stmt)
    d = result.scalar_one_or_none()

    if not d:
        return None

    await db.refresh(d, ["versions", "current_version"])

    versions = [
        {
            "id": v.id,
            "version_no": v.version_no,
            "file_path": v.file_path,
            "file_size": v.file_size,
            "format": v.format,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in d.versions
    ]

    return {
        "id": d.id,
        "title": d.title,
        "category": d.category,
        "tags": d.tags,
        "language": d.language,
        "status": d.status,
        "current_version_id": d.current_version_id,
        "current_file_size": d.current_version.file_size if d.current_version else None,
        "current_format": d.current_version.format if d.current_version else None,
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
) -> dict[str, Any] | None:
    stmt = select(Document).options(selectinload(Document.versions)).where(Document.id == doc_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        return None

    object_name = None
    try:
        if file:
            content = await file.read()
            orig_name = file.filename or "upload.bin"
            _, ext = os.path.splitext(orig_name)

            object_name, size, fmt = await asyncio.to_thread(upload_to_minio, content, orig_name)
            logger.info("Uploaded new file to MinIO with object name: %s", object_name)

            # Save new file details and set status to REQUEST
            next_version = max((v.version_no for v in doc.versions), default=0) + 1

            dv = DocumentVersion(
                document_id=doc.id,
                version_no=next_version,
                file_path=object_name,
                file_size=size,
                format=fmt,
            )
            db.add(dv)
            await db.flush()

            doc.current_version_id = dv.id
            doc.status = "REQUEST"

        if title and title.strip():
            unique_title = await generate_unique_title(db, title)
            doc.title = unique_title

        if category and category.strip():
            doc.category = category

        if tags and tags.strip():
            doc.tags = tags

        if language and language.strip():
            doc.language = language

        db.add(doc)
        await db.commit()
        await db.refresh(doc, ["current_version"])

        return {
            "id": doc.id,
            "title": doc.title,
            "category": doc.category,
            "tags": doc.tags,
            "language": doc.language,
            "status": doc.status,
            "current_version_id": doc.current_version_id,
            "current_file_size": doc.current_version.file_size if doc.current_version else None,
            "current_format": doc.current_version.format if doc.current_version else None,
        }

    except Exception:
        logger.exception("Failed to update document %s", doc_id)

        if object_name:
            try:
                await asyncio.to_thread(minio_client.remove_object, BUCKET_NAME, object_name)
                logger.info("Cleaned up MinIO file after update failure: %s", object_name)
            except Exception as cleanup_exc:
                logger.error("Failed to delete MinIO file %s: %s", object_name, cleanup_exc)

        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update document."
        )


async def delete_document(doc_id: int, db: AsyncSession) -> bool:
    stmt = select(Document).options(selectinload(Document.versions)).where(Document.id == doc_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        logger.info("Document with ID %s does not exist.", doc_id)
        return False

    try:
        await asyncio.to_thread(delete_by_document_id, str(doc.id))
        logger.info("Deleted vector data for document ID %s.", doc_id)

        minio_delete_tasks = []
        for v in doc.versions:
            if v.file_path:
                task = asyncio.to_thread(minio_client.remove_object, BUCKET_NAME, v.file_path)
                minio_delete_tasks.append(task)

        if minio_delete_tasks:
            await asyncio.gather(*minio_delete_tasks)
            logger.info("Deleted MinIO files for document ID %s.", doc_id)

        await db.delete(doc)
        await db.commit()
        logger.info("Successfully deleted document record with ID %s.", doc_id)

        return True
    except Exception as exc:
        logger.exception("Failed to delete document %s: %s", doc_id, exc)
        try:
            await db.rollback()
        except Exception as rb_exc:
            logger.exception("Failed to rollback after delete failure for %s: %s", doc_id, rb_exc)

        return False


async def search_documents_by_name(name: str, db: AsyncSession) -> list[dict[str, Any]]:
    try:
        stmt = (
            select(Document)
            .options(selectinload(Document.current_version))
            .where(Document.title.ilike(f"%{name}%"))
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
                "current_version_id": d.current_version_id,
                "created_at": d.created_at.isoformat() if d.created_at else None,
                "current_file_size": d.current_version.file_size if d.current_version else None,
                "current_format": d.current_version.format if d.current_version else None,
            }
            for d in rows
        ]
    except Exception as exc:
        logger.exception("Error occurred while searching documents by name: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search documents by name.",
        ) from exc


async def filter_documents_by_format(format: str, db: AsyncSession) -> list[dict[str, Any]]:
    try:
        stmt = (
            select(Document)
            .options(selectinload(Document.current_version))
            .where(Document.current_version.has(format=format))
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
                "current_version_id": d.current_version_id,
                "created_at": d.created_at.isoformat() if d.created_at else None,
                "current_file_size": d.current_version.file_size if d.current_version else None,
                "current_format": d.current_version.format if d.current_version else None,
            }
            for d in rows
        ]
    except Exception as exc:
        logger.exception("Error occurred while filtering documents by format: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to filter documents by format.",
        ) from exc
