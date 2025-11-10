"""Admin endpoints for metrics and logs."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from ..core.users import get_current_user, get_password_hash
from ..core.config import get_db
from ..models.user import User
from ..services import metrics

router = APIRouter()


# Pydantic models for request/response
class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str = Field(..., pattern="^(Super Admin|Admin|Staff|Viewer)$")


class UpdateUserRequest(BaseModel):
    username: str | None = Field(None, min_length=3, max_length=150)
    email: EmailStr | None = None
    role: str | None = Field(None, pattern="^(Super Admin|Admin|Staff|Viewer)$")


class UserResponse(BaseModel):
    id: int
    username: str
    email: str | None = None
    role: str
    status: str
    phone_number: str | None = None
    created_at: str | None = None

    class Config:
        from_attributes = True


class CreateUserResponse(BaseModel):
    user_id: int
    username: str
    role: str
    status: str
    message: str


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
    """Create a new user account."""
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already exists."
        )
    
    # Validate password complexity
    if len(data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password does not meet security requirements."
        )
    if not any(c.isupper() for c in data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password does not meet security requirements."
        )
    if not any(c.isdigit() for c in data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password does not meet security requirements."
        )
    if not any(c in "!@#$%^&*" for c in data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password does not meet security requirements."
        )
    
    # Create new user
    new_user = User(
        username=data.username,
        password_hash=get_password_hash(data.password),
        role=data.role,
        is_active=True
    )
    
    # Add email if User model supports it
    if hasattr(User, 'email'):
        new_user.email = data.email
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return CreateUserResponse(
        user_id=new_user.id,
        username=new_user.username,
        role=new_user.role,
        status="active",
        message="New user created successfully."
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
