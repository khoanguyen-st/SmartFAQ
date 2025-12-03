from typing import Optional

from pydantic import BaseModel, EmailStr


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
