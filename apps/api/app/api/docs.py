import logging
import os

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..api import schemas
from ..core.database import get_db
from ..services import dms

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
async def list_docs(db: AsyncSession = Depends(get_db)):
    try:
        items = await dms.list_documents(db)
        return {"items": items}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to list documents")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list documents.",
        ) from exc


@router.post("/")
async def create_docs(
    files: list[UploadFile] | None = None,
    title: str | None = Form(None),
    category: str | None = Form(None),
    tags: str | None = Form(None),
    language: str = Form("en"),
    status: str = Form("ACTIVE"),
    db: AsyncSession = Depends(get_db),
):
    try:
        if files:
            results = await dms.enqueue_multiple_documents(files)
            return {"status": "accepted", "items": results}

        if not title:
            raise HTTPException(400, "title is required")

        payload = schemas.DocumentCreate(
            title=title,
            category=category,
            tags=tags,
            language=language,
            status=status,
        )

        data = payload.dict()
        data["created_by"] = None
        result = await dms.create_metadata_document(data, db)
        return {"item": result}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to create document(s)")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create document(s).",
        ) from exc


@router.get("/{doc_id}", response_model=schemas.DocumentOut)
async def get_document(doc_id: int, db: AsyncSession = Depends(get_db)):
    try:
        doc = await dms.get_document(doc_id, db)
        if not doc:
            raise HTTPException(404, "Document not found")
        return doc
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch document %s", doc_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch document.",
        ) from exc


@router.get("/{doc_id}/download")
async def download_document(doc_id: int, db: AsyncSession = Depends(get_db)):
    try:
        doc = await dms.get_document(doc_id, db)
        if not doc:
            raise HTTPException(404, "Document not found")

        file_path = None
        if doc["versions"]:
            for v in doc["versions"]:
                if v["id"] == doc["current_version_id"]:
                    file_path = v["file_path"]
                    break
            if not file_path:
                file_path = doc["versions"][0]["file_path"]

        if not file_path or not os.path.isfile(file_path):
            raise HTTPException(404, "File not found on server")

        return FileResponse(file_path, filename=os.path.basename(file_path))
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to download document %s", doc_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download document.",
        ) from exc


@router.put("/{doc_id}")
async def update_document(
    doc_id: int, payload: schemas.DocumentUpdate, db: AsyncSession = Depends(get_db)
):
    try:
        ok = await dms.update_document(doc_id, payload.dict(exclude_none=True), db)
        if not ok:
            raise HTTPException(404, "Document not found")
        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to update document %s", doc_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update document.",
        ) from exc


@router.delete("/{doc_id}")
async def delete_document(doc_id: int, db: AsyncSession = Depends(get_db)):
    try:
        ok = await dms.delete_document(doc_id, db)
        if not ok:
            raise HTTPException(404, "Document not found")
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to delete document %s", doc_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document.",
        ) from exc
