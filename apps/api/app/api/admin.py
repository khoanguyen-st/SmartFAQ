"""Admin endpoints for metrics and logs."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.db import get_session
from ..core.users import get_current_user
from ..services import metrics
from ..services.user_service import UserService
from .dto import (
    CreateUserRequest,
    CreateUserResponse,
    UpdateUserRequest,
    UserResponse,
)

router = APIRouter()


@router.get("/metrics")
async def get_metrics(current_user=Depends(get_current_user)) -> dict[str, object]:
    return await metrics.get_dashboard_metrics()


@router.get("/logs")
async def get_logs(current_user=Depends(get_current_user)) -> dict[str, list]:
    return {"items": await metrics.get_query_logs()}


@router.get("/users")
async def get_users(
    current_user=Depends(get_current_user), db: Session = Depends(get_session)
) -> list[UserResponse]:
    """Get all users."""
    users = UserService.get_all_users(db)
    return [
        UserResponse(
            id=user.id,
            username=user.username,
            email=getattr(user, "email", None),
            role=user.role,
            status="active" if user.is_active else "locked",
            phone_number=getattr(user, "phone_number", None),
            created_at=user.created_at.isoformat() if user.created_at else None,
        )
        for user in users
    ]


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    data: CreateUserRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session),
) -> CreateUserResponse:
    """Create a new user account."""
    # Check if username already exists
    existing_user = UserService.get_user_by_username(db, data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Username or email already exists."
        )

    # Validate password complexity
    if len(data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password does not meet security requirements.",
        )
    if not any(c.isupper() for c in data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password does not meet security requirements.",
        )
    if not any(c.isdigit() for c in data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password does not meet security requirements.",
        )
    if not any(c in "!@#$%^&*" for c in data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password does not meet security requirements.",
        )

    # Create new user
    new_user = UserService.create_user(
        db=db,
        username=data.username,
        email=data.email,
        password=data.password,
        role=data.role,
    )

    return CreateUserResponse(
        user_id=new_user.id,
        username=new_user.username,
        role=new_user.role,
        status="active",
        message="New user created successfully.",
    )


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    data: UpdateUserRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session),
) -> UserResponse:
    """Update an existing user account."""
    # Find user
    user = UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Check if username already exists (if updating username)
    if data.username and data.username != user.username:
        existing_user = UserService.get_user_by_username(db, data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Username or email already exists."
            )

    # Update user
    user = UserService.update_user(
        db=db,
        user=user,
        username=data.username,
        email=data.email,
        role=data.role,
    )

    return UserResponse(
        id=user.id,
        username=user.username,
        email=getattr(user, "email", None),
        role=user.role,
        status="active" if user.is_active else "locked",
        phone_number=getattr(user, "phone_number", None),
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_session)
):
    """Delete a user account."""
    user = UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    UserService.delete_user(db, user)
    return None
