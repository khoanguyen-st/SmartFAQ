"""Document management endpoints (clean version)."""

from fastapi import APIRouter, Depends, UploadFile, HTTPException, status, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os

from ..core.db import get_session
from ..services import dms
from . import schemas

router = APIRouter()


@router.get("/")
def list_docs(db: Session = Depends(get_session)):
    return {"items": dms.list_documents(db)}


@router.post("/")
async def create_docs(
    files: list[UploadFile] | None = None,
    title: str | None = Form(None),
    category: str | None = Form(None),
    tags: str | None = Form(None),
    language: str = Form("en"),
    status: str = Form("ACTIVE"),
    db: Session = Depends(get_session),
):
    # ✅ Case 1: Upload N files
    if files:
        results = await dms.enqueue_multiple_documents(files)
        return {"status": "accepted", "items": results}

    # ✅ Case 2: Metadata only
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
    result = dms.create_metadata_document(data, db)
    return {"item": result}


@router.get("/{doc_id}", response_model=schemas.DocumentOut)
def get_document(doc_id: int, db: Session = Depends(get_session)):
    doc = dms.get_document(doc_id, db)
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc


@router.get("/{doc_id}/download")
def download_document(doc_id: int, db: Session = Depends(get_session)):
    doc = dms.get_document(doc_id, db)
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


@router.put("/{doc_id}")
def update_document(doc_id: int, payload: schemas.DocumentUpdate, db: Session = Depends(get_session)):
    ok = dms.update_document(doc_id, payload.dict(exclude_none=True), db)
    if not ok:
        raise HTTPException(404, "Document not found")
    return {"status": "ok"}


@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_session)):
    ok = dms.delete_document(doc_id, db)
    if not ok:
        raise HTTPException(404, "Document not found")
    return {"status": "deleted"}
