from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session

from app.models.document import Document as DocumentModel
from app.rag.document_processor import DocumentProcessor
from app.rag.vector_store import VectorStore

UPLOAD_ROOT = Path(os.getenv("UPLOAD_DIR", "uploads")).resolve()
ALLOWED_EXTS = {".pdf", ".docx", ".doc", ".txt", ".md"}
MAX_SIZE_MB = int(os.getenv("UPLOAD_MAX_MB", "50"))
MAX_BYTES = MAX_SIZE_MB * 1024 * 1024
logger = logging.getLogger(__name__)


class DocumentService:
    def __init__(self):
        self.processor = DocumentProcessor()
        self.vector_store = VectorStore()

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
