"""Security helpers for authentication and authorization."""

from datetime import datetime, timedelta
from functools import lru_cache
from typing import Optional

from jose import jwt
from passlib.context import CryptContext

from .config import settings
from ..models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@lru_cache(maxsize=1)
def get_admin_hash() -> str:
    # Tính hash chỉ khi cần, lưu lại để không tính nhiều lần
    return pwd_context.hash("admin")


async def authenticate_user(username: str, password: str) -> Optional[User]:
    # TODO: replace with database lookup
    admin_hash = get_admin_hash()
    if username == "admin" and pwd_context.verify(password, admin_hash):
        return User(username="admin", password_hash=admin_hash, role="SUPER_ADMIN", is_active=True)
    return None


def create_access_token(*, subject: str, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.jwt_expire_minutes))
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
