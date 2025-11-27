import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..schemas import admin_schemas
from ..services import ams

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
async def list_users(db: AsyncSession = Depends(get_db)):
    try:
        items = await ams.list_users(db)
        return {"items": items}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to list users")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list users.",
        ) from exc


@router.post("/")
async def create_user(
    payload: admin_schemas.UserCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        data = payload.dict()
        result = await ams.create_user(data, db)
        return {"item": result}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to create user")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user.",
        ) from exc


@router.get("/{user_id}", response_model=admin_schemas.UserOut)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    try:
        user = await ams.get_user(user_id, db)
        if not user:
            raise HTTPException(404, "User not found")
        return user
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user.",
        ) from exc


@router.put("/{user_id}")
async def update_user(
    user_id: int, payload: admin_schemas.UserUpdate, db: AsyncSession = Depends(get_db)
):
    try:
        ok = await ams.update_user(user_id, payload.dict(exclude_none=True), db)
        if not ok:
            raise HTTPException(404, "User not found")
        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to update user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user.",
        ) from exc


@router.put("/{user_id}/lock")
async def lock_user(user_id: int, db: AsyncSession = Depends(get_db)):
    try:
        ok = await ams.lock_user(user_id, db)
        if not ok:
            raise HTTPException(404, "User not found")
        return {"status": "locked"}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to lock user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to lock user.",
        ) from exc


@router.put("/{user_id}/unlock")
async def unlock_user(user_id: int, db: AsyncSession = Depends(get_db)):
    try:
        ok = await ams.unlock_user(user_id, db)
        if not ok:
            raise HTTPException(404, "User not found")
        return {"status": "unlocked"}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to unlock user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unlock user.",
        ) from exc
