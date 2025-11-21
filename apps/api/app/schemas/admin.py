from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, validator


class Role(str, Enum):
    # Chỉ cho phép tạo/cập nhật vai trò Admin qua giao diện này
    ADMIN = "Admin"


class Status(str, Enum):
    ACTIVE = "Active"
    LOCKED = "Locked"


class UserBase(BaseModel):
    email: EmailStr
    role: Role = Role.ADMIN
    phoneNumber: Optional[str] = None
    address: Optional[str] = None
    image: Optional[str] = None


class UserCreate(UserBase):
    password: str
    status: Status = Status.ACTIVE

    @validator("role")
    def role_must_be_admin(cls, value):
        # Đảm bảo Super Admin chỉ tạo role Admin
        if value != Role.ADMIN:
            raise ValueError("Super Admin can only create 'Admin' roles through this interface.")
        return value


class UserUpdate(BaseModel):
    # Tất cả đều là Optional vì có thể chỉ cập nhật 1 trường
    email: Optional[EmailStr] = None
    role: Optional[Role] = None
    phoneNumber: Optional[str] = None
    address: Optional[str] = None
    image: Optional[str] = None

    @validator("role", pre=True, always=True)
    def role_must_be_admin_or_none(cls, value):
        if value is not None and value != Role.ADMIN:
            raise ValueError("Super Admin can only set 'Admin' role through this interface.")
        return value


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    # Map trường is_active (bool) trong DB sang trường status (enum) trong API
    status: Status = Field(..., alias="is_active")
    phoneNumber: Optional[str] = None
    address: Optional[str] = None
    image: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
        validate_by_name = True
        # Cho phép mapping từ is_active sang status
        json_encoders = {bool: lambda v: Status.ACTIVE.value if v else Status.LOCKED.value}


class ErrorResponse(BaseModel):
    error: str
