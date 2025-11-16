"""User-related Data Transfer Objects."""

from pydantic import BaseModel, EmailStr, Field


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


class UpdateUserResponse(BaseModel):
    user_id: int
    username: str
    role: str
    status: str
    message: str
