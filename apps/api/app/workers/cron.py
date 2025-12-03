import asyncio
import io
import logging
import os
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.config import settings
from ..core.database import AsyncSessionLocal
from ..models.document import Document
from ..rag.document_processor import DocumentProcessor
from ..rag.vector_store import upsert_documents
from ..services import dms

logger = logging.getLogger(__name__)


async def _process_single_document(db: AsyncSession, doc: Document) -> None:
    # Refresh relationships to get file path/version
    await db.refresh(doc, ["versions", "current_version"])

    object_name: Optional[str] = None
    try:
        if doc.current_version and doc.current_version.file_path:
            object_name = doc.current_version.file_path
        elif doc.versions and len(doc.versions) > 0:
            object_name = doc.versions[0].file_path

        if not object_name:
            raise RuntimeError("No file path available for document")

        # mark as PROCESSING
        doc.status = "PROCESSING"
        db.add(doc)
        await db.commit()

        # fetch file from MinIO
        minio_obj = await asyncio.to_thread(
            dms.minio_client.get_object, dms.BUCKET_NAME, object_name
        )
        file_bytes = minio_obj.read()
        minio_obj.close()
        minio_obj.release_conn()

        file_stream = io.BytesIO(file_bytes)
        _, ext = os.path.splitext(object_name)

        processor = DocumentProcessor()
        split_docs = processor.process_document(
            file_stream, ext, str(doc.id), metadata={"title": doc.title}
        )

        # upsert vector data
        await asyncio.to_thread(upsert_documents, split_docs)

        # success -> ACTIVE
        doc.status = "ACTIVE"
        db.add(doc)
        await db.commit()
        logger.info("Document %s processed and set to ACTIVE", doc.id)

    except Exception as exc:
        logger.exception("Processing failed for document %s: %s", getattr(doc, "id", "?"), exc)
        try:
            # set status FAIL then cleanup
            doc.status = "FAIL"
            db.add(doc)
            await db.commit()
        except Exception:
            await db.rollback()

        # cleanup: remove minio object if exists, delete DB record
        try:
            if object_name:
                await asyncio.to_thread(
                    dms.minio_client.remove_object, dms.BUCKET_NAME, object_name
                )
                logger.info("Removed MinIO object during cleanup: %s", object_name)
        except Exception as cleanup_exc:
            logger.exception("Failed to remove MinIO object %s: %s", object_name, cleanup_exc)

        try:
            await db.delete(doc)
            await db.commit()
            logger.info("Deleted document record %s after failure", getattr(doc, "id", "?"))
        except Exception as db_exc:
            logger.exception(
                "Failed to delete document record %s: %s", getattr(doc, "id", "?"), db_exc
            )


async def process_requests_once() -> None:
    async with AsyncSessionLocal() as db:
        try:
            stmt = (
                select(Document)
                .where(Document.status == "REQUEST")
                .options(selectinload(Document.current_version), selectinload(Document.versions))
            )
            result = await db.execute(stmt)
            docs = result.scalars().all()

            if not docs:
                return

            for doc in docs:
                try:
                    await _process_single_document(db, doc)
                except Exception:
                    # errors are handled per-document inside _process_single_document
                    pass

        except Exception:
            logger.exception("Failed to fetch REQUEST documents for processing")


async def start_periodic_task() -> None:
    interval = int(getattr(settings, "CRON_INTERVAL_SECONDS", 180))
    logger.info("Starting document processing cron with interval %s seconds", interval)
    try:
        while True:
            await process_requests_once()
            await asyncio.sleep(interval)
    except asyncio.CancelledError:
        logger.info("Document processing cron cancelled")
        raise
