"""Staff management endpoints (async version)."""

import io
import logging

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.users import get_current_user
from ..models.user import User
from ..schemas import schemas
from ..services import ums

router = APIRouter()
logger = logging.getLogger(__name__)


def require_staff(current_user: User = Depends(get_current_user)):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource. Staff role required.",
        )
    return current_user


@router.get("/me")
async def get_current_user_info(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get current user info with departments."""
    try:
        user_info = await ums.get_current_user_info(current_user.id, db)
        if not user_info:
            raise HTTPException(404, "User not found")
        return user_info
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch current user info")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user info.",
        ) from exc


@router.get("/{user_id}", response_model=schemas.UserOut)
async def get_profile(
    user_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(require_staff)
):
    try:
        profile = await ums.get_user_profile(user_id, db)
        if not profile:
            raise HTTPException(404, "Profile not found")
        return profile
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch profile")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch profile.",
        ) from exc


@router.put("/{user_id}")
async def update_profile(
    user_id: int,
    payload: schemas.UserUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_staff),
):
    try:
        updates = payload.dict(exclude_none=True)
        ok = await ums.update_user_profile(user_id, updates, db)
        if not ok:
            raise HTTPException(404, "Profile not found")
        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to update profile")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile.",
        ) from exc


@router.post("/{user_id}/avatar")
async def upload_avatar(
    user_id: int,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_staff),
):
    try:
        if not file:
            raise HTTPException(400, "File is required")
        result = await ums.upload_user_avatar(file, user_id, db)
        return {"status": "accepted", "item": result}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to upload avatar")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload avatar.",
        ) from exc


@router.delete("/{user_id}/avatar")
async def delete_avatar(
    user_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(require_staff)
):
    try:
        ok = await ums.delete_user_avatar(user_id, db)
        if not ok:
            raise HTTPException(404, "Avatar not found")
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to delete avatar")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete avatar.",
        ) from exc


@router.post("/{user_id}/change-password")
async def change_password(
    user_id: int,
    current_password: str = Form(...),
    new_password: str = Form(...),
    confirm_password: str = Form(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_staff),
):
    try:
        if new_password != confirm_password:
            raise HTTPException(400, "New password and confirm password do not match")
        ok = await ums.change_user_password(
            current_password=current_password, new_password=new_password, user_id=user_id, db=db
        )
        if not ok:
            raise HTTPException(400, "Invalid current password or other error")
        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to change password")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password.",
        ) from exc


@router.get("/files/{file_key:path}")
async def get_file(file_key: str):
    """Get file from MinIO by file key (object path)."""
    try:
        response = await ums.get_file_from_minio(file_key)
        content = response.read()

        # Determine content type based on file extension
        content_type = "application/octet-stream"
        if file_key.lower().endswith((".png", ".jpg", ".jpeg")):
            ext = file_key.lower().split(".")[-1]
            content_type = f"image/{ext if ext != 'jpg' else 'jpeg'}"

        return StreamingResponse(
            io.BytesIO(content),
            media_type=content_type,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to get file %s", file_key)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get file.",
        ) from exc
