import asyncio
import io
import logging
import os
import re
from contextlib import asynccontextmanager
from tempfile import NamedTemporaryFile
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
from ..rag.document_processor import DocumentProcessor
from ..rag.vector_store import delete_by_document_id, upsert_documents

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
        status="ACTIVE",
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
    content = await file.read()
    orig_name = file.filename or "upload.bin"
    _, ext = os.path.splitext(orig_name)

    object_name = None
    temp_path = None
    doc_id = None

    try:
        object_name, size, fmt = await asyncio.to_thread(upload_to_minio, content, orig_name)

        with NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(content)
            tmp.flush()
            temp_path = tmp.name

        processor = DocumentProcessor()
        split_docs = processor.process_document(temp_path, str(0), metadata={"title": orig_name})

        try:
            async with async_session_scope() as db:
                doc_id = await create_document_record(
                    db,
                    title=orig_name,
                    file_path=object_name,
                    file_size=size,
                    format=fmt,
                )

                for sd in split_docs:
                    if "document_id" in sd.metadata:
                        sd.metadata["document_id"] = str(doc_id)
                    else:
                        sd.metadata["source"] = str(doc_id)

                await asyncio.to_thread(upsert_documents, split_docs)

        except Exception:
            logger.exception("Failed to save document or index chunks for %s", orig_name)
            if object_name:
                try:
                    await asyncio.to_thread(minio_client.remove_object, BUCKET_NAME, object_name)
                    logger.info("Cleaned up MinIO file after DB/index failure: %s", object_name)
                except Exception as cleanup_exc:
                    logger.error(
                        "Failed to delete MinIO file %s after DB/index error: %s",
                        object_name,
                        cleanup_exc,
                    )
            raise

        return {"document_id": doc_id, "object_name": object_name}

    except Exception as exc:
        if object_name:
            try:
                await asyncio.to_thread(minio_client.remove_object, BUCKET_NAME, object_name)
                logger.info("Cleaned up orphaned MinIO file: %s", object_name)
            except Exception as cleanup_exc:
                logger.error(
                    "Failed to delete MinIO file %s after error: %s", object_name, cleanup_exc
                )
        raise exc
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                await asyncio.to_thread(os.remove, temp_path)
                logger.info("Temporary file deleted: %s", temp_path)
            except Exception as cleanup_exc:
                logger.error("Failed to delete temporary file %s: %s", temp_path, cleanup_exc)


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
    status: str | None = None,
) -> dict[str, Any] | None:
    stmt = select(Document).options(selectinload(Document.versions)).where(Document.id == doc_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        return None

    object_name = None
    temp_path = None
    new_version_info = None

    try:
        if file:
            content = await file.read()
            orig_name = file.filename or "upload.bin"
            _, ext = os.path.splitext(orig_name)

            object_name, size, fmt = await asyncio.to_thread(upload_to_minio, content, orig_name)

            with NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                tmp.write(content)
                tmp.flush()
                temp_path = tmp.name

            processor = DocumentProcessor()
            split_docs = processor.process_document(
                temp_path, str(doc_id), metadata={"title": orig_name}
            )

            await asyncio.to_thread(delete_by_document_id, str(doc_id))

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

            for sd in split_docs:
                if "document_id" in sd.metadata:
                    sd.metadata["document_id"] = str(doc_id)
                else:
                    sd.metadata["source"] = str(doc_id)

            await asyncio.to_thread(upsert_documents, split_docs)

            new_version_info = {
                "version_no": next_version,
                "file_path": object_name,
                "file_size": size,
                "format": fmt,
            }

            if not title or not title.strip():
                title = orig_name

        if title and title.strip():
            unique_title = await generate_unique_title(db, title)
            doc.title = unique_title

        if category and category.strip():
            doc.category = category

        if tags and tags.strip():
            doc.tags = tags

        if language and language.strip():
            doc.language = language

        if status and status.strip():
            doc.status = status

        db.add(doc)
        await db.commit()
        await db.refresh(doc, ["current_version"])

        result = {
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

        if new_version_info:
            result["new_version"] = new_version_info

        return result

    except Exception as exc:
        logger.exception("Failed to update document %s", doc_id)
        if object_name:
            try:
                await asyncio.to_thread(minio_client.remove_object, BUCKET_NAME, object_name)
                logger.info("Cleaned up MinIO file after update failure: %s", object_name)
            except Exception as cleanup_exc:
                logger.error("Failed to delete MinIO file %s: %s", object_name, cleanup_exc)
        await db.rollback()
        raise exc
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                await asyncio.to_thread(os.remove, temp_path)
            except Exception as cleanup_exc:
                logger.error("Failed to delete temporary file %s: %s", temp_path, cleanup_exc)


async def delete_document(doc_id: int, db: AsyncSession) -> bool:
    stmt = select(Document).options(selectinload(Document.versions)).where(Document.id == doc_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        return False

    try:
        await asyncio.to_thread(delete_by_document_id, str(doc.id))

        minio_delete_tasks = []
        for v in doc.versions:
            if v.file_path:
                task = asyncio.to_thread(minio_client.remove_object, BUCKET_NAME, v.file_path)
                minio_delete_tasks.append(task)

        if minio_delete_tasks:
            await asyncio.gather(*minio_delete_tasks)

        await db.delete(doc)
        await db.commit()

        return True
    except Exception as exc:
        logger.exception("Failed to delete document %s: %s", doc_id, exc)
        try:
            await db.rollback()
        except Exception as rb_exc:
            logger.exception("Failed to rollback after delete failure for %s: %s", doc_id, rb_exc)

        return False
