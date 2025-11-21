"""Document management endpoints."""

from fastapi import APIRouter, Depends, UploadFile

from ..core.users import get_current_user
from ..services import dms

router = APIRouter()


@router.post("/upload", status_code=202)
async def upload_document(
    file: UploadFile,
    current_user=Depends(get_current_user),
) -> dict[str, str]:
    job_id = await dms.enqueue_document(file, uploaded_by=current_user.username)
    return {"status": "accepted", "job_id": job_id}


@router.get("/")
async def list_documents(current_user=Depends(get_current_user)) -> dict[str, list]:
    documents = await dms.list_documents()
    return {"items": documents}
