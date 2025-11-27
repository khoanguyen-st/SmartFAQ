"""User schemas."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=150,
        description="Username must be between 3 and 150 characters",
    )
    email: EmailStr = Field(..., description="Valid email address")
    phone: str | None = Field(None, max_length=50, description="Phone number (optional)")
    address: str | None = Field(None, max_length=255, description="Address (optional)")
    image: str | None = Field(None, max_length=255, description="Image URL (optional)")
    notification_email: str | None = Field(
        None, max_length=500, description="Notification email (optional)"
    )
    campus_id: str = Field(..., max_length=10, description="Campus ID")
    role: str = Field(..., max_length=50, description="User role")


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")


class UserUpdate(BaseModel):
    username: str | None = Field(
        None,
        min_length=3,
        max_length=150,
        description="Username must be between 3 and 150 characters",
    )
    email: EmailStr | None = Field(None, description="Valid email address")
    phone: str | None = Field(None, max_length=50, description="Phone number (optional)")
    address: str | None = Field(None, max_length=255, description="Address (optional)")
    image: str | None = Field(None, max_length=255, description="Image URL (optional)")
    notification_email: str | None = Field(
        None, max_length=500, description="Notification email (optional)"
    )
    campus_id: str | None = Field(None, max_length=10, description="Campus ID")
    password: str | None = Field(
        None, min_length=8, description="Password must be at least 8 characters"
    )
    role: str | None = Field(None, max_length=50, description="User role")
    is_active: bool | None = Field(None, description="Active status")


class UserOut(UserBase):
    id: int
    is_active: bool
    failed_attempts: int
    is_locked: bool
    created_at: datetime

    class Config:
        from_attributes = True
