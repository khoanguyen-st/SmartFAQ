"""Admin endpoints for user management, metrics and logs."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

from ..core.database import get_db
from ..core.users import get_current_user
from ..schemas.admin import ErrorResponse, UserCreate, UserResponse, UserUpdate
from ..services import admin_service, metrics
from ..services.admin_service import APIException

router = APIRouter(prefix="/admin", tags=["Admin - User Management"])


async def get_current_super_admin(current_user: User = Depends(get_current_user)):
    """Kiểm tra nếu người dùng hiện tại là Super Admin."""
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "Only Super Admins can perform this action."},
        )
    return current_user


# Dashboard metrics
@router.get("/metrics")
async def get_metrics(current_user: User = Depends(get_current_super_admin)) -> dict[str, object]:
    return await metrics.get_dashboard_metrics()


@router.get("/logs")
async def get_logs(current_user: User = Depends(get_current_super_admin)) -> dict[str, list]:
    return {"items": await metrics.get_query_logs()}


# [Admin Dashboard] View List of User Accounts
@router.get("/users", response_model=List[UserResponse])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """Xem danh sách Tài khoản Người dùng (trừ Super Admin)"""
    try:
        return await admin_service.get_users(db, skip=skip, limit=limit)
    except APIException as e:
        raise HTTPException(status_code=e.status_code, detail={"error": e.detail})


# 1. Create New User Account - POST /api/admin/users
@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        409: {"model": ErrorResponse, "description": "Username or email already exists."},
        400: {
            "model": ErrorResponse,
            "description": "Password does not meet security requirements.",
        },
    },
)
async def create_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Tạo Tài khoản Người dùng mới (Role 'Admin')"""
    try:
        return await admin_service.create_user(db, user)
    except APIException as e:
        raise HTTPException(status_code=e.status_code, detail={"error": e.detail})


# 2. Edit Existing User Account - PUT /api/admin/users/{user_id}
@router.put(
    "/users/{user_id}",
    response_model=UserResponse,
    responses={
        404: {"model": ErrorResponse, "description": "User not found."},
        409: {"model": ErrorResponse, "description": "Username or email already exists."},
        403: {"model": ErrorResponse, "description": "Cannot manage Super Admin accounts."},
    },
)
async def update_user(
    user_id: int,
    user: UserUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Cập nhật thông tin Tài khoản Người dùng"""
    try:
        return await admin_service.update_user(db, user_id, user)
    except APIException as e:
        raise HTTPException(status_code=e.status_code, detail={"error": e.detail})


# 3. Reset User Password - POST /api/admin/users/{user_id}/reset-password
@router.post(
    "/users/{user_id}/reset-password",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"model": ErrorResponse, "description": "User not found."},
        403: {"model": ErrorResponse, "description": "Cannot reset Super Admin password."},
    },
)
async def reset_password(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Thiết lập lại Mật khẩu Người dùng và gửi mật khẩu tạm thời qua email."""
    try:
        await admin_service.reset_user_password(db, user_id)
        return status.HTTP_204_NO_CONTENT
    except APIException as e:
        raise HTTPException(status_code=e.status_code, detail={"error": e.detail})


# 4. Lock User - PATCH /api/admin/users/{user_id}/lock
@router.patch(
    "/users/{user_id}/lock",
    response_model=UserResponse,
    responses={
        404: {"model": ErrorResponse, "description": "User not found."},
        409: {"model": ErrorResponse, "description": "User account is already locked."},
        403: {"model": ErrorResponse, "description": "Only Super Admins can lock user accounts."},
        500: {
            "model": ErrorResponse,
            "description": "Unable to lock user. Please try again later.",
        },
    },
)
async def lock_user_endpoint(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Khóa Tài khoản Người dùng"""
    try:
        return await admin_service.lock_user(db, user_id)
    except APIException as e:
        msg = e.detail if e.status_code != 500 else "Unable to lock user. Please try again later."
        raise HTTPException(status_code=e.status_code, detail={"error": msg})


# 5. Unlock User - PATCH /api/admin/users/{user_id}/unlock
@router.patch(
    "/users/{user_id}/unlock",
    response_model=UserResponse,
    responses={
        404: {"model": ErrorResponse, "description": "User not found."},
        403: {"model": ErrorResponse, "description": "Cannot unlock Super Admin accounts."},
    },
)
async def unlock_user_endpoint(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Mở khóa Tài khoản Người dùng"""
    try:
        return await admin_service.unlock_user(db, user_id)
    except APIException as e:
        raise HTTPException(status_code=e.status_code, detail={"error": e.detail})


# [Admin Dashboard] Delete User Account
@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"model": ErrorResponse, "description": "User not found."},
        403: {"model": ErrorResponse, "description": "Cannot delete Super Admin accounts."},
    },
)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Xóa Tài khoản Người dùng"""
    try:
        await admin_service.delete_user(db, user_id)
        return status.HTTP_204_NO_CONTENT
    except APIException as e:
        raise HTTPException(status_code=e.status_code, detail={"error": e.detail})
