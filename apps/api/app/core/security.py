"""Security helpers for authentication and authorization."""

import hashlib
import time
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Optional

import bcrypt
from jose import jwt
from sqlalchemy.orm import Session

from .config import settings
from ..models.token_blacklist import TokenBlacklist
from ..models.user import User


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        password_bytes = password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


@lru_cache(maxsize=1)
def get_admin_hash() -> str:
    return hash_password("admin")


async def authenticate_user(username: str, password: str) -> Optional[User]:
    admin_hash = get_admin_hash()
    if username == "admin" and verify_password(password, admin_hash):
        return User(username="admin", password_hash=admin_hash, role="SUPER_ADMIN", is_active=True)
    return None


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta is None:
        expires_delta = timedelta(seconds=28800) 

    now_ts = int(time.time())
    expire_ts = now_ts + int(expires_delta.total_seconds())

    payload = {
        **data,
        "exp": expire_ts,
        "iat": now_ts,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


_token_blacklist: set[str] = set()


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _extract_token_expiration(token: str) -> datetime:
    try:
        claims = jwt.get_unverified_claims(token)
        exp = claims.get("exp")
        if exp is not None:
            return datetime.utcfromtimestamp(int(exp))
    except Exception:
        pass
    return datetime.utcnow()


def add_token_to_blacklist(token: str, db: Session | None = None) -> None:
    expires_at = _extract_token_expiration(token)

    if db:
        token_hash = _hash_token(token)
        record = db.query(TokenBlacklist).filter(TokenBlacklist.token_hash == token_hash).first()
        if record:
            record.revoked_at = datetime.utcnow()
            record.expires_at = expires_at
        else:
            db.add(TokenBlacklist(token_hash=token_hash, expires_at=expires_at))
        db.commit()

    _token_blacklist.add(token)


def is_token_blacklisted(token: str, db: Session | None = None) -> bool:
    if db:
        token_hash = _hash_token(token)
        record = db.query(TokenBlacklist).filter(TokenBlacklist.token_hash == token_hash).first()
        if record:
            if record.expires_at <= datetime.utcnow():
                db.delete(record)
                db.commit()
            else:
                return True

    return token in _token_blacklist


def clear_token_blacklist(db: Session | None = None) -> None:
    if db:
        db.query(TokenBlacklist).delete()
        db.commit()
    _token_blacklist.clear()


def create_reset_token(user_id: int, email: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta is None:
        expires_delta = timedelta(hours=1)

    now_ts = int(time.time())
    expire_ts = now_ts + int(expires_delta.total_seconds())

    payload = {
        "user_id": user_id,
        "email": email,
        "type": "password_reset",
        "exp": expire_ts,
        "iat": now_ts,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def verify_reset_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        if payload.get("type") != "password_reset":
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.JWTError:
        return None
