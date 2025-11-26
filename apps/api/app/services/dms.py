import asyncio
import logging
import os
from contextlib import asynccontextmanager
from tempfile import NamedTemporaryFile
from typing import Any

import cloudinary
from cloudinary.uploader import destroy, upload
from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.config import settings
from ..core.database import AsyncSessionLocal
from ..models.document import Document
from ..models.document_version import DocumentVersion
from ..rag.document_processor import DocumentProcessor
from ..rag.vector_store import delete_by_document_id, upsert_documents

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)

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


def upload_to_cloudinary(content: bytes, filename: str) -> tuple[str, int, str]:
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

    file_public_id = f"{base_name}"

    logger.info("upload start: %s to Cloudinary (Public ID: %s)", orig_name, file_public_id)

    try:
        result = upload(
            content,
            public_id=file_public_id,
            folder=settings.CLOUDINARY_FOLDER_DOCUMENT,
            resource_type="raw",
        )
        public_id = result["public_id"]
        uploaded_size = result["bytes"]
        logger.info("upload complete: %d bytes", uploaded_size)
        return public_id, uploaded_size, fmt
    except Exception as exc:
        raise exc


async def create_document_record(
    db: AsyncSession,
    title: str,
    file_path: str | None = None,
    file_size: int | None = None,
    format: str | None = None,
) -> int:
    doc = Document(
        title=title,
        language="en",
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

    public_id = None
    temp_path = None

    try:
        public_id, size, fmt = await asyncio.to_thread(upload_to_cloudinary, content, orig_name)

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
                    file_path=public_id,
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
            if public_id:
                try:
                    await asyncio.to_thread(destroy, public_id, resource_type="raw")
                    logger.info("Cleaned up Cloudinary file after DB/index failure: %s", public_id)
                except Exception as cleanup_exc:
                    logger.error(
                        "Failed to delete Cloudinary file %s after DB/index error: %s",
                        public_id,
                        cleanup_exc,
                    )
            raise

        return {"document_id": doc_id, "public_id": public_id}

    except Exception as exc:
        if public_id:
            try:
                await asyncio.to_thread(destroy, public_id, resource_type="raw")
                logger.info("Cleaned up orphaned Cloudinary file: %s", public_id)
            except Exception as cleanup_exc:
                logger.error(
                    "Failed to delete Cloudinary file %s after error: %s", public_id, cleanup_exc
                )
        raise exc
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


async def enqueue_multiple_documents(files: list[UploadFile]) -> list[dict]:
    """Process multiple file uploads."""
    results = []
    for file in files:
        try:
            r = await enqueue_single_document(file)
            results.append(r)
        except Exception as exc:
            results.append({"filename": file.filename, "error": str(exc)})
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


async def update_document(doc_id: int, updates: dict[str, Any], db: AsyncSession) -> bool:
    stmt = select(Document).where(Document.id == doc_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        return False

    for k, v in updates.items():
        setattr(doc, k, v)

    await db.commit()
    return True


async def delete_document(doc_id: int, db: AsyncSession) -> bool:
    stmt = select(Document).options(selectinload(Document.versions)).where(Document.id == doc_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        return False

    try:
        await asyncio.to_thread(delete_by_document_id, str(doc.id))

        cloudinary_delete_tasks = []
        for v in doc.versions:
            if v.file_path:
                task = asyncio.to_thread(destroy, v.file_path, resource_type="raw")
                cloudinary_delete_tasks.append(task)

        if cloudinary_delete_tasks:
            await asyncio.gather(*cloudinary_delete_tasks)

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
