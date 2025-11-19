"""Admin DTO schemas."""

from pydantic import BaseModel, EmailStr, Field


class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=150)
    email: EmailStr
    campus: list[str] = Field(..., min_items=1)
    department: list[str] = Field(..., min_items=1)
    role: str = Field(default="Staff", pattern="^(Super Admin|Admin|Staff|Viewer)$")


class UpdateUserRequest(BaseModel):
    username: str | None = Field(None, min_length=3, max_length=150)
    email: EmailStr | None = None
    campus: list[str] | None = Field(None, min_items=1)
    department: list[str] | None = Field(None, min_items=1)
    role: str | None = Field(None, pattern="^(Super Admin|Admin|Staff|Viewer)$")


class UserResponse(BaseModel):
    id: int
    username: str
    email: str | None = None
    role: str
    status: str
    campus: list[str] | None = None
    department: list[str] | None = None
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
