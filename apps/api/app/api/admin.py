import logging
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.users import get_current_user
from ..models.user import User
from ..schemas.admin_schemas import UserCreate, UserOut, UserUpdate
from ..services import ams

router = APIRouter()
logger = logging.getLogger(__name__)


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource. Admin role required.",
        )
    return current_user


@router.get(
    "/",
    response_model=Dict[str, List[UserOut]],
    status_code=status.HTTP_200_OK,
)
async def list_users(
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    if role and role not in ["staff", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role parameter. Must be 'staff' or 'admin'.",
        )
    try:
        items = await ams.list_users(db, role=role)
        return {"items": items}
    except Exception as exc:
        logger.exception("Failed to list users")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list users.",
        ) from exc


@router.post(
    "/",
    response_model=Dict[str, UserOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        data = payload.dict()
        result = await ams.create_user(data, db)
        return {"item": result}
    except Exception as exc:
        logger.exception("Failed to create user")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user.",
        ) from exc


@router.put(
    "/{user_id}",
    response_model=Dict[str, str],
    status_code=status.HTTP_200_OK,
)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        ok = await ams.update_user(user_id, payload.dict(exclude_none=True), db)
        if not ok:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return {"status": "ok"}
    # Bắt lỗi 500
    except Exception as exc:
        logger.exception("Failed to update user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user.",
        ) from exc


@router.put(
    "/{user_id}/lock",
    response_model=Dict[str, str],
    status_code=status.HTTP_200_OK,
)
async def lock_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        ok = await ams.lock_user(user_id, db)
        if not ok:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return {"status": "locked"}
    except Exception as exc:
        logger.exception("Failed to lock user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to lock user.",
        ) from exc


@router.put(
    "/{user_id}/unlock",
    response_model=Dict[str, str],
    status_code=status.HTTP_200_OK,
)
async def unlock_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        ok = await ams.unlock_user(user_id, db)
        if not ok:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return {"status": "unlocked"}
    except Exception as exc:
        logger.exception("Failed to unlock user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unlock user.",
        ) from exc
