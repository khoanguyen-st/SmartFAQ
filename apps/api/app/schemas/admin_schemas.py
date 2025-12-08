from datetime import datetime
from typing import List, Optional  # <-- Cần thêm List

from pydantic import BaseModel, EmailStr


# --- THÊM MỚI: Schema để hiển thị Department ---
class DepartmentOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


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
    department_ids: list[int] = []


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    image: Optional[str] = None
    campus: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    department_ids: Optional[List[int]] = None


class UserOut(UserBase):
    id: int
    failed_attempts: int
    locked_until: Optional[datetime]
    is_locked: bool
    created_at: datetime

    # --- THÊM MỚI: Trường departments trả về list ---
    departments: List[DepartmentOut] = []


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None
