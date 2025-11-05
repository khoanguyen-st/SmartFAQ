"""Document management endpoints."""

from typing import List, Any
from fastapi import APIRouter, Depends, UploadFile
from pydantic import BaseModel, Field

from ..core.users import get_current_user
from ..services import dms

router = APIRouter()


class UploadResponse(BaseModel):
    """Response model for document upload."""
    status: str = Field(..., description="Upload status")
    job_id: str = Field(..., description="Job ID for tracking")


class DocumentInfo(BaseModel):
    """Document information."""
    # Add fields based on actual document structure
    pass


class DocumentListResponse(BaseModel):
    """Response model for document list."""
    items: List[Any] = Field(..., description="List of documents")


@router.post("/upload", status_code=202, response_model=UploadResponse)
async def upload_document(
    file: UploadFile,
    current_user=Depends(get_current_user),
) -> UploadResponse:
    job_id = await dms.enqueue_document(file, uploaded_by=current_user.username)
    return UploadResponse(status="accepted", job_id=job_id)


@router.get("/", response_model=DocumentListResponse)
async def list_documents(current_user=Depends(get_current_user)) -> DocumentListResponse:
    documents = await dms.list_documents()
    return DocumentListResponse(items=documents)
