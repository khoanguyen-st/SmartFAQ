"""Document management service (clean version)."""

import logging
import os
from typing import Any
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.db import session_scope
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


ALLOWED_EXTS = {".pdf", ".txt", ".docx", ".md", ".png", ".jpg", ".jpeg"}


async def save_uploaded_file(file: UploadFile) -> tuple[str, int, str]:
    """Save uploaded file to disk and return (file_path, size, format)."""

    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    orig_name = os.path.basename(file.filename or "upload.bin")
    _, ext = os.path.splitext(orig_name)
    ext = ext.lower()

    if ext not in ALLOWED_EXTS:
        raise InvalidFileType(f"file type '{ext}' is not allowed")

    unique_name = f"{uuid4().hex}{ext}"
    dest_path = os.path.join(upload_dir, unique_name)

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


def create_document_record(
    db: Session,
    title: str,
    uploaded_by: int | None,
    file_path: str | None = None,
    file_size: int | None = None,
    format: str | None = None,
) -> int:
    """Create Document + DocumentVersion (optional)."""

    doc = Document(
        title=title,
        language="en",
        status="ACTIVE",
        created_by=uploaded_by,
    )
    db.add(doc)
    db.flush()

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
        db.flush()

        doc.current_version_id = dv.id
        db.add(doc)

    return doc.id


async def enqueue_single_document(file: UploadFile, uploaded_by=None) -> dict:
    """Upload a single file and create document record."""
    file_path, size, fmt = await save_uploaded_file(file)
    # # If configured, upload the saved file to Google Cloud Storage and use the
    # # GCS URI as the stored file_path. We perform this before creating the DB
    # # record so the database stores the cloud location.
    # if settings.GCS_ENABLED:
    #     if not settings.GCS_BUCKET:
    #         # misconfiguration
    #         try:
    #             os.remove(file_path)
    #         except Exception:
    #             pass
    #         raise RuntimeError("GCS_ENABLED is True but GCS_BUCKET is not configured")

    #     try:
    #         try:
    #             from google.cloud import storage
    #         except Exception as imp_err:  # pragma: no cover - environment dependent
    #             # remove local file to avoid orphaned files
    #             try:
    #                 os.remove(file_path)
    #             except Exception:
    #                 pass
    #             raise RuntimeError(
    #                 "google-cloud-storage package is required for GCS uploads: pip install google-cloud-storage"
    #             ) from imp_err

    #         client = storage.Client()
    #         bucket = client.bucket(settings.GCS_BUCKET)
    #         basename = os.path.basename(file_path)
    #         blob_name = f"documents/{basename}"
    #         blob = bucket.blob(blob_name)
    #         blob.upload_from_filename(file_path)
    #         cloud_uri = f"gs://{settings.GCS_BUCKET}/{blob_name}"
    #         # remove local file after successful upload
    #         try:
    #             os.remove(file_path)
    #         except Exception:
    #             logging.warning("failed to remove local temp file after GCS upload: %s", file_path)

    #         file_path = cloud_uri
    #         logging.info("uploaded file to GCS: %s", cloud_uri)
    #     except Exception:
    #         # ensure local file cleaned up on failure and re-raise
    #         try:
    #             if os.path.exists(file_path):
    #                 os.remove(file_path)
    #         except Exception:
    #             logging.exception("failed to cleanup local file after GCS upload error: %s", file_path)
    #         logging.exception("GCS upload failed for %s", file.filename)
    #         raise

    with session_scope() as db:
        doc_id = create_document_record(
            db,
            title=file.filename,
            uploaded_by=None,
            file_path=file_path,
            file_size=size,
            format=fmt,
        )

        # Process and upsert to vector DB
        processor = DocumentProcessor()
        split_docs = processor.process_document(
            file_path, str(doc_id), metadata={"title": file.filename}
        )
        upsert_documents(split_docs)

        return {"document_id": doc_id, "file_path": file_path}


async def enqueue_multiple_documents(files: list[UploadFile]) -> list[dict]:
    """Process multiple file uploads."""
    results = []
    for file in files:
        try:
            r = await enqueue_single_document(file, uploaded_by=None)
            results.append(r)
        except Exception as exc:
            results.append({"filename": file.filename, "error": str(exc)})
    return results


def create_metadata_document(data: dict[str, Any], db: Session) -> dict:
    doc = Document(**data)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"id": doc.id, "title": doc.title}


def list_documents(db: Session) -> list[dict[str, Any]]:
    rows = db.query(Document).order_by(Document.created_at.desc()).all()
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


def get_document(doc_id: int, db: Session):
    d = db.query(Document).filter(Document.id == doc_id).first()
    if not d:
        return None

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


def update_document(doc_id: int, updates: dict[str, Any], db: Session) -> bool:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        return False

    for k, v in updates.items():
        setattr(doc, k, v)

    db.commit()
    return True


def delete_document(doc_id: int, db: Session) -> bool:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        return False

    db.delete(doc)
    db.commit()
    return True
