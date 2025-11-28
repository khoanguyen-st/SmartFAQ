from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    username: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    image: Optional[str] = None
    campus: str
    role: str

    class Config:
        from_attributes = True


class UserCreate(UserBase):
    password: str
    role: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    image: Optional[str] = None
    campus: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None


class UserOut(UserBase):
    id: int
    failed_attempts: int
    locked_until: Optional[datetime]
    is_locked: bool
    created_at: datetime


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None
