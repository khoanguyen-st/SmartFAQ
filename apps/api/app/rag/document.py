# document.py
from __future__ import annotations

import hashlib
import os
from pathlib import Path
from typing import Optional
import asyncio

from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.rag.document_processor import DocumentProcessor
from app.rag.vector_store import VectorStore, upsert_documents  # nếu bạn đã có helper
from app.models.document import Document as DocumentModel

UPLOAD_ROOT = Path(os.getenv("UPLOAD_DIR", "uploads")).resolve()
ALLOWED_EXTS = {".pdf", ".docx"}  # mở rộng nếu hỗ trợ thêm
MAX_SIZE_MB = int(os.getenv("UPLOAD_MAX_MB", "50"))
MAX_BYTES = MAX_SIZE_MB * 1024 * 1024


def _secure_name(name: str) -> str:
    # chỉ giữ basename + ký tự an toàn
    base = Path(name).name
    safe = "".join(c for c in base if c.isalnum() or c in ("-", "_", ".", " "))
    return safe.strip() or "file"


async def _save_upload_async(src: UploadFile, dst: Path) -> int:
    """Lưu file upload theo dạng streaming, trả về số bytes ghi."""
    # tạo parent
    dst.parent.mkdir(parents=True, exist_ok=True)
    written = 0
    # use blocking file writes inside a thread to avoid adding aiofiles dependency
    with open(dst, "wb") as out:
        while True:
            chunk = await src.read(1024 * 1024)  # 1MB/chunk
            if not chunk:
                break
            written += len(chunk)
            if written > MAX_BYTES:
                raise HTTPException(status_code=413, detail="File quá lớn")
            # write chunk in a thread so the event loop is not blocked
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
        self.vector_store = VectorStore()  # hoặc dùng get_vectorstore() singleton

    async def upload_and_index(
        self,
        file: UploadFile,
        user_id: str,
        db: Session,
    ) -> DocumentModel:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTS:
            raise HTTPException(status_code=400, detail=f"Định dạng không hỗ trợ: {ext}")

        # chuẩn bị đường dẫn
        # (tách thư mục theo user để quản trị dễ hơn)
        user_dir = (UPLOAD_ROOT / user_id).resolve()
        user_dir.mkdir(parents=True, exist_ok=True)

        # tên file an toàn + UUID prefix
        from uuid import uuid4
        document_id = str(uuid4())
        safe_name = _secure_name(file.filename)
        final_path = (user_dir / f"{document_id}_{safe_name}").resolve()

        # hạn chế Path traversal
        if user_dir not in final_path.parents:
            raise HTTPException(status_code=400, detail="Invalid upload path")

        # ghi file async
        try:
            size = await _save_upload_async(file, final_path)
        finally:
            # đảm bảo đóng handle nội bộ
            try:
                await file.close()
            except Exception:
                pass

        # checksum để idempotent/dedupe
        checksum = _sha256_of_file(final_path)

        # nếu muốn: kiểm tra doc tồn tại theo checksum để bỏ qua index trùng
        existing: Optional[DocumentModel] = (
            db.query(DocumentModel)
            .filter(DocumentModel.checksum == checksum)
            .first()
        )
        if existing:
            # bạn có thể link user với doc sẵn có thay vì re-index
            return existing

        # tạo record + transaction
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

            # xử lý (chunking)
            meta = {"title": safe_name, "uploaded_by": user_id}
            documents = self.processor.process_document(str(final_path), document_id, meta)
            if not documents:
                raise HTTPException(status_code=422, detail="Không trích xuất được nội dung tài liệu")

            # index (idempotent với ids từ vector_store helper)
            # self.vector_store.add_documents(documents)  # nếu muốn đơn giản
            upsert_documents(documents)  # nếu bạn có helper gen ids hash

            # cập nhật trạng thái
            doc_model.status = "active"
            doc_model.chunk_count = len(documents)
            db.commit()
            db.refresh(doc_model)
            return doc_model

        except Exception:
            db.rollback()
            # đánh dấu failed (best-effort)
            try:
                doc_model.status = "failed"
                db.add(doc_model)
                db.commit()
            except Exception:
                db.rollback()
            raise

    def delete_document(self, document_id: str, db: Session) -> None:
        # xóa vector theo metadata
        try:
            self.vector_store.delete_by_metadata({"document_id": document_id})
        except Exception:
            # log cảnh báo, nhưng không block xóa DB
            pass

        doc: Optional[DocumentModel] = (
            db.query(DocumentModel)
            .filter(DocumentModel.id == document_id)
            .first()
        )
        if not doc:
            return

        # xóa file
        try:
            Path(doc.file_path).unlink(missing_ok=True)
        except Exception:
            # log warning
            pass

        # xóa record DB
        db.delete(doc)
        db.commit()
