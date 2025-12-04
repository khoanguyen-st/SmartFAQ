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
    await db.refresh(doc, ["versions", "current_version"])

    object_name: Optional[str] = None
    try:
        if doc.current_version and doc.current_version.file_path:
            object_name = doc.current_version.file_path
        elif doc.versions and len(doc.versions) > 0:
            object_name = doc.versions[0].file_path

        if not object_name:
            raise RuntimeError("No file path available for document")

        # Check file size before processing to prevent memory issues
        try:
            stat = await asyncio.to_thread(
                dms.minio_client.stat_object, dms.BUCKET_NAME, object_name
            )
            file_size_mb = stat.size / (1024 * 1024)
            max_process_mb = int(getattr(settings, "MAX_PROCESS_FILE_SIZE_MB", 100))

            if file_size_mb > max_process_mb:
                logger.error(
                    "Document %s file size %.2f MB exceeds max processable size %d MB",
                    doc.id,
                    file_size_mb,
                    max_process_mb,
                )
                doc.status = "FAIL"
                db.add(doc)
                await db.commit()
                return
        except Exception as stat_exc:
            logger.warning("Failed to stat file %s: %s, continuing anyway", object_name, stat_exc)

        doc.status = "PROCESSING"
        db.add(doc)
        await db.commit()

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
            file_stream, ext, str(doc.id), metadata={"title": doc.title, "source": object_name}
        )

        await asyncio.to_thread(upsert_documents, split_docs)

        doc.status = "ACTIVE"
        db.add(doc)
        await db.commit()
        logger.info("Document %s processed and set to ACTIVE", doc.id)

    except Exception as exc:
        logger.exception("Processing failed for document %s: %s", getattr(doc, "id", "?"), exc)
        try:
            doc.status = "FAIL"
            db.add(doc)
            await db.commit()
        except Exception:
            await db.rollback()

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
            logger.info("Fetching documents with status 'REQUEST' for processing...")
            stmt = (
                select(Document)
                .where(Document.status == "REQUEST")
                .options(selectinload(Document.current_version), selectinload(Document.versions))
            )
            result = await db.execute(stmt)
            docs = result.scalars().all()

            logger.info("Found %d documents to process.", len(docs))

            if not docs:
                return

            # Process documents concurrently with a limit to prevent resource exhaustion
            max_concurrent = int(getattr(settings, "MAX_CONCURRENT_PROCESSING", 3))
            semaphore = asyncio.Semaphore(max_concurrent)

            async def process_with_semaphore(doc):
                async with semaphore:
                    async with AsyncSessionLocal() as doc_db:
                        try:
                            logger.info("Processing document ID: %s", doc.id)
                            await _process_single_document(doc_db, doc)
                        except Exception:
                            logger.exception("Error processing document ID: %s", doc.id)

            # Process all documents concurrently (with semaphore limiting parallelism)
            tasks = [process_with_semaphore(doc) for doc in docs]
            await asyncio.gather(*tasks, return_exceptions=True)

        except Exception:
            logger.exception("Failed to fetch REQUEST documents for processing")


async def start_periodic_task() -> None:
    interval = int(getattr(settings, "CRON_INTERVAL_SECONDS", 30))
    logger.info("Starting document processing cron with interval %s seconds", interval)
    try:
        while True:
            logger.info("Starting a new processing cycle.")
            await process_requests_once()
            logger.info("Processing cycle completed. Sleeping for %s seconds.", interval)
            await asyncio.sleep(interval)
    except asyncio.CancelledError:
        logger.info("Document processing cron cancelled")
        raise
