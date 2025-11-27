"""Pydantic schemas for API payloads and responses."""

from typing import Optional

from pydantic import BaseModel, EmailStr


class DocumentCreate(BaseModel):
    title: str
    category: str | None = None
    tags: str | None = None
    language: str = "en"
    status: str = "ACTIVE"


class DocumentUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    tags: str | None = None
    language: str | None = None
    status: str | None = None


class DocumentVersionOut(BaseModel):
    id: int
    version_no: int
    file_path: str
    file_size: int | None
    format: str
    created_at: str | None


class DocumentOut(BaseModel):
    id: int
    title: str
    category: str | None
    tags: str | None
    language: str
    status: str
    current_version_id: int | None
    versions: list[DocumentVersionOut] | None = None

    class Config:
        try:
            from_attributes = True
        except Exception:
            orm_mode = True


class UserOut(BaseModel):
    username: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    image: Optional[str] = None

    class Config:
        try:
            from_attributes = True
        except Exception:
            orm_mode = True


class UserUpdate(BaseModel):
    username: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
