from __future__ import annotations

import asyncio
import hashlib
import logging
import os
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.models.document import Document as DocumentModel
from app.rag.document_processor import DocumentProcessor
from app.rag.vector_store import VectorStore, upsert_documents

UPLOAD_ROOT = Path(os.getenv("UPLOAD_DIR", "uploads")).resolve()
ALLOWED_EXTS = {".pdf", ".docx", ".doc", ".txt", ".md"}
MAX_SIZE_MB = int(os.getenv("UPLOAD_MAX_MB", "50"))
MAX_BYTES = MAX_SIZE_MB * 1024 * 1024
logger = logging.getLogger(__name__)


def _secure_name(name: str) -> str:
    base = Path(name).name
    safe = "".join(c for c in base if c.isalnum() or c in ("-", "_", ".", " "))
    return safe.strip() or "file"


async def _save_upload_async(src: UploadFile, dst: Path) -> int:
    dst.parent.mkdir(parents=True, exist_ok=True)
    written = 0
    with open(dst, "wb") as out:
        while True:
            chunk = await src.read(1024 * 1024)
            if not chunk:
                break
            written += len(chunk)
            if written > MAX_BYTES:
                raise HTTPException(status_code=413, detail="File quá lớn")
            await asyncio.to_thread(out.write, chunk)
    return written


def _sha256_of_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            b = f.read(chunk_size)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


class DocumentService:
    def __init__(self):
        self.processor = DocumentProcessor()
        self.vector_store = VectorStore()

    async def upload_and_index(
        self,
        file: UploadFile,
        user_id: str,
        db: Session,
    ) -> DocumentModel:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTS:
            raise HTTPException(status_code=400, detail=f"Định dạng không hỗ trợ: {ext}")

        user_dir = (UPLOAD_ROOT / user_id).resolve()
        user_dir.mkdir(parents=True, exist_ok=True)

        from uuid import uuid4

        document_id = str(uuid4())
        safe_name = _secure_name(file.filename)
        final_path = (user_dir / f"{document_id}_{safe_name}").resolve()

        if user_dir not in final_path.parents:
            raise HTTPException(status_code=400, detail="Invalid upload path")

        try:
            size = await _save_upload_async(file, final_path)
        finally:
            try:
                await file.close()
            except Exception:
                pass

        checksum = _sha256_of_file(final_path)

        existing: Optional[DocumentModel] = (
            db.query(DocumentModel).filter(DocumentModel.checksum == checksum).first()
        )
        if existing:
            logger.info("Upload skipped; document with same checksum already indexed: %s", checksum)
            return existing

        doc_model = DocumentModel(
            id=document_id,
            title=safe_name,
            file_path=str(final_path),
            uploaded_by=user_id,
            status="processing",
            size_bytes=size,
            checksum=checksum,
            mime=file.content_type or None,
            original_filename=file.filename,
        )

        try:
            db.add(doc_model)
            db.commit()
            db.refresh(doc_model)

            meta = {"title": safe_name, "uploaded_by": user_id}
            logger.info("Indexing document %s (id=%s, checksum=%s)", final_path, document_id, checksum)
            documents = self.processor.process_document(str(final_path), document_id, meta)
            upsert_documents(documents)
            logger.info("Inserted %d chunks into vector store for document %s", len(documents), document_id)
            doc_model.status = "active"
            doc_model.chunk_count = len(documents)
            db.commit()
            db.refresh(doc_model)
            return doc_model

        except ValueError as exc:
            db.rollback()
            doc_model.status = "failed"
            doc_model.chunk_count = 0
            db.add(doc_model)
            db.commit()
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        except Exception:
            db.rollback()
            try:
                doc_model.status = "failed"
                db.add(doc_model)
                db.commit()
            except Exception:
                db.rollback()
            raise

    def delete_document(self, document_id: str, db: Session) -> None:
        try:
            self.vector_store.delete_by_metadata({"document_id": document_id})
        except Exception:
            pass

        doc: Optional[DocumentModel] = (
            db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
        )
        if not doc:
            return

        try:
            Path(doc.file_path).unlink(missing_ok=True)
        except Exception:
            pass

        db.delete(doc)
        db.commit()
