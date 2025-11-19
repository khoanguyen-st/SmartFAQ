"""Admin endpoints for metrics and logs."""

import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.users import get_current_user, get_password_hash
from ..core.config import get_db
from ..models.user import User
from ..services import metrics
from ..dto.admin import (
    CreateUserRequest,
    UpdateUserRequest,
    UserResponse,
    CreateUserResponse,
)

router = APIRouter()


def generate_random_password(length: int = 12) -> str:
    """Generate a random secure password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        # Ensure password meets complexity requirements
        if (any(c.isupper() for c in password) and
            any(c.islower() for c in password) and
            any(c.isdigit() for c in password) and
            any(c in "!@#$%^&*" for c in password)):
            return password


@router.get("/metrics")
async def get_metrics(current_user=Depends(get_current_user)) -> dict[str, object]:
    return await metrics.get_dashboard_metrics()


@router.get("/logs")
async def get_logs(current_user=Depends(get_current_user)) -> dict[str, list]:
    return {"items": await metrics.get_query_logs()}


@router.get("/users")
async def get_users(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
) -> list[UserResponse]:
    """Get all users."""
    users = db.query(User).all()
    return [
        UserResponse(
            id=user.id,
            username=user.username,
            email=getattr(user, 'email', None),
            role=user.role,
            status="active" if user.is_active else "locked",
            campus=getattr(user, 'campus', None),
            department=getattr(user, 'department', None),
            phone_number=getattr(user, 'phone_number', None),
            created_at=user.created_at.isoformat() if user.created_at else None
        )
        for user in users
    ]


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    data: CreateUserRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
) -> CreateUserResponse:
    """Create a new user account with auto-generated password."""
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already exists."
        )
    
    # Check if email already exists
    if data.email:
        existing_email = db.query(User).filter(User.email == data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username or email already exists."
            )
    
    # Generate random password
    auto_password = generate_random_password()
    
    # Create new user
    new_user = User(
        username=data.username,
        email=data.email,
        password_hash=get_password_hash(auto_password),
        role=data.role,
        is_active=True
    )
    
    # Add campus and department if User model supports it
    if hasattr(User, 'campus'):
        new_user.campus = data.campus
    if hasattr(User, 'department'):
        new_user.department = data.department
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return CreateUserResponse(
        user_id=new_user.id,
        username=new_user.username,
        role=new_user.role,
        status="active",
        message=f"New user created successfully. Temporary password: {auto_password}"
    )


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    data: UpdateUserRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserResponse:
    """Update an existing user account."""
    # Find user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    
    # Check if username already exists (if updating username)
    if data.username and data.username != user.username:
        existing_user = db.query(User).filter(User.username == data.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username or email already exists."
            )
        user.username = data.username
    
    # Update email if provided and model supports it
    if data.email and hasattr(User, 'email'):
        user.email = data.email
    
    # Update campus if provided
    if data.campus and hasattr(User, 'campus'):
        user.campus = data.campus
    
    # Update department if provided
    if data.department and hasattr(User, 'department'):
        user.department = data.department
    
    # Update role if provided
    if data.role:
        user.role = data.role
    
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=getattr(user, 'email', None),
        role=user.role,
        status="active" if user.is_active else "locked",
        campus=getattr(user, 'campus', None),
        department=getattr(user, 'department', None),
        phone_number=getattr(user, 'phone_number', None),
        created_at=user.created_at.isoformat() if user.created_at else None
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    
    db.delete(user)
    db.commit()
    return None
