import logging
import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.config import settings
from ..core.database import AsyncSessionLocal
from ..models.document import Document
from ..models.document_version import DocumentVersion
from ..rag.document_processor import DocumentProcessor
from ..rag.vector_store import upsert_documents


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


async def save_uploaded_file(file: UploadFile) -> tuple[str, int, str]:
    """Save uploaded file to disk and return (file_path, size, format)."""
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    orig_name = os.path.basename(file.filename or "upload.bin")
    _, ext = os.path.splitext(orig_name)
    ext = ext.lower()

    if ext not in ALLOWED_EXTS:
        raise InvalidFileType(f"file type '{ext}' is not allowed")

    dest_path = os.path.join(upload_dir, orig_name)

    max_bytes = int(settings.UPLOAD_MAX_MB) * 1024 * 1024
    written = 0
    CHUNK = 1024 * 64

    logging.info("upload start: %s -> %s", orig_name, dest_path)

    try:
        with open(dest_path, "wb") as fh:
            while True:
                chunk = await file.read(CHUNK)
                if not chunk:
                    break
                written += len(chunk)
                if written > max_bytes:
                    raise UploadTooLarge(
                        f"uploaded file exceeds max size of {settings.UPLOAD_MAX_MB} MB"
                    )
                fh.write(chunk)

        logging.info("upload complete: %d bytes", written)
        return dest_path, written, ext.lstrip(".")

    except Exception as exc:
        if os.path.exists(dest_path):
            os.remove(dest_path)
        raise exc


async def create_document_record(
    db: AsyncSession,
    title: str,
    uploaded_by: int | None,
    file_path: str | None = None,
    file_size: int | None = None,
    format: str | None = None,
    category: str | None = None,
) -> int:
    """Create Document + DocumentVersion (optional)."""
    doc = Document(
        title=title,
        language="en",
        status="ACTIVE",
        created_by=uploaded_by,
        category=category,
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
            uploaded_by=uploaded_by,
        )
        db.add(dv)
        await db.flush()

        doc.current_version_id = dv.id
        db.add(doc)

    return doc.id


@asynccontextmanager
async def async_session_scope():
    """Async context manager for database session with rollback on error."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def enqueue_single_document(file: UploadFile, uploaded_by=None, category: str | None = None) -> dict:
    """Upload a single file and create document record."""
    file_path, size, fmt = await save_uploaded_file(file)

    async with async_session_scope() as db:
        doc_id = await create_document_record(
            db,
            title=file.filename or "Untitled",
            uploaded_by=uploaded_by,
            file_path=file_path,
            file_size=size,
            format=fmt,
            category=category,
        )

        # Trigger async processing workflow
        # Process document and create embeddings
        processor = DocumentProcessor()
        split_docs = processor.process_document(
            file_path, str(doc_id), metadata={"title": file.filename or "Untitled"}
        )
        upsert_documents(split_docs)

        return {"document_id": doc_id, "file_path": file_path, "filename": file.filename}


async def enqueue_multiple_documents(files: list[UploadFile], category: str | None = None) -> list[dict]:
    """Process multiple file uploads."""
    results = []
    for file in files:
        try:
            r = await enqueue_single_document(file, uploaded_by=None, category=category)
            results.append(r)
        except Exception as exc:
            results.append({"filename": file.filename, "error": str(exc)})
    return results


async def create_document_with_upload(
    files: list[UploadFile],
    category: str | None = None,
    uploaded_by: int | None = None,
) -> dict:
    """
    Create new document and upload files.
    Validates: max 20 files, each ≤50MB.
    File size validation is handled in save_uploaded_file.
    """
    MAX_FILES = 20
    MAX_FILE_SIZE_MB = 50

    # Validation: Check number of files
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=400,
            detail={"error": f"Invalid upload. Max {MAX_FILES} files, each ≤{MAX_FILE_SIZE_MB}MB."}
        )

    # Process uploads (file size validation happens in save_uploaded_file)
    results = []
    for file in files:
        try:
            r = await enqueue_single_document(file, uploaded_by=uploaded_by, category=category)
            results.append(r)
        except UploadTooLarge:
            raise HTTPException(
                status_code=400,
                detail={"error": f"Invalid upload. Max {MAX_FILES} files, each ≤{MAX_FILE_SIZE_MB}MB."}
            )
        except InvalidFileType as e:
            raise HTTPException(
                status_code=400,
                detail={"error": str(e)}
            )
        except Exception as exc:
            results.append({"filename": file.filename, "error": str(exc)})
    
    return {
        "status": "accepted",
        "items": results
    }


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

    documents = [
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
    
    return documents


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
    """
    Delete document, all attached files, and related embeddings in ChromaDB.
    """
    from ..rag.vector_store import delete_by_metadata
    
    stmt = select(Document).options(selectinload(Document.versions)).where(Document.id == doc_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        return False

    # 1. Delete physical files from all versions
    await db.refresh(doc, ["versions"])
    for version in doc.versions:
        if version.file_path and os.path.exists(version.file_path):
            try:
                os.remove(version.file_path)
                logging.info(f"Deleted file: {version.file_path}")
            except Exception as e:
                logging.warning(f"Failed to delete file {version.file_path}: {e}")

    # 2. Delete embeddings from ChromaDB
    try:
        delete_by_metadata({"document_id": str(doc_id)})
        logging.info(f"Deleted embeddings for document {doc_id}")
    except Exception as e:
        logging.warning(f"Failed to delete embeddings for document {doc_id}: {e}")

    # 3. Delete DB record (cascade will delete versions automatically)
    await db.delete(doc)
    await db.commit()
    return True
