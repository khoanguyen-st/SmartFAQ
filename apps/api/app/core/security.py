import hashlib
import re
import time
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import jwt
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.token_blacklist import TokenBlacklist
from .config import settings


def hash_password(password: str) -> str:
    """Hash password using bcrypt (12 rounds)."""
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    try:
        password_bytes = password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token (default: 5 minutes)."""
    if expires_delta is None:
        expires_delta = timedelta(minutes=5000)

    now_ts = int(time.time())
    expire_ts = now_ts + int(expires_delta.total_seconds())

    payload = {
        **data,
        "type": "access",
        "exp": expire_ts,
        "iat": now_ts,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT refresh token (default: 24 hours)."""
    if expires_delta is None:
        expires_delta = timedelta(hours=24)

    now_ts = int(time.time())
    expire_ts = now_ts + int(expires_delta.total_seconds())
    login_time = data.get("login_time", now_ts)

    payload = {
        **data,
        "type": "refresh",
        "login_time": login_time,
        "exp": expire_ts,
        "iat": now_ts,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def verify_refresh_token(token: str) -> dict | None:
    """Verify and decode refresh token."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])

        if payload.get("type") != "refresh":
            return None

        login_time = payload.get("login_time")
        if login_time is None:
            return None

        now_ts = int(time.time())
        hours_since_login = (now_ts - login_time) / 3600

        if hours_since_login > 24:
            return None

        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.JWTError:
        return None


def get_token_remaining_time(token: str) -> int | None:
    """Get remaining time until token expiration in seconds."""
    try:
        payload = jwt.get_unverified_claims(token)
        exp = payload.get("exp")
        if exp is None:
            return None

        now_ts = int(time.time())
        remaining = exp - now_ts
        return remaining if remaining > 0 else None
    except Exception:
        return None


def should_refresh_token(token: str, threshold_seconds: int = 60) -> bool:
    """Check if token should be refreshed (remaining time < threshold)."""
    remaining = get_token_remaining_time(token)
    if remaining is None:
        return True
    return remaining < threshold_seconds


_token_blacklist: set[str] = set()


def _hash_token(token: str) -> str:
    """Hash token using SHA256."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _extract_token_expiration(token: str) -> datetime:
    """Extract expiration time from JWT token."""
    try:
        claims = jwt.get_unverified_claims(token)
        exp = claims.get("exp")
        if exp is not None:
            return datetime.utcfromtimestamp(int(exp))
    except Exception:
        pass
    return datetime.utcnow()


async def add_token_to_blacklist(token: str, db: AsyncSession | None = None) -> None:
    """Add token to blacklist (in-memory and database)."""
    expires_at = _extract_token_expiration(token)
    token_hash = _hash_token(token)

    if db:
        result = await db.execute(
            select(TokenBlacklist).filter(TokenBlacklist.token_hash == token_hash)
        )
        record = result.scalar_one_or_none()
        if record:
            record.revoked_at = datetime.utcnow()
            record.expires_at = expires_at
        else:
            db.add(TokenBlacklist(token_hash=token_hash, expires_at=expires_at))
        await db.commit()

    _token_blacklist.add(token_hash)


async def is_token_blacklisted(token: str, db: AsyncSession | None = None) -> bool:
    """Check if token is blacklisted."""
    token_hash = _hash_token(token)

    if db:
        result = await db.execute(
            select(TokenBlacklist).filter(TokenBlacklist.token_hash == token_hash)
        )
        record = result.scalar_one_or_none()
        if record:
            if record.expires_at <= datetime.utcnow():
                # Delete expired token from database
                await db.execute(delete(TokenBlacklist).where(TokenBlacklist.id == record.id))
                await db.commit()
            else:
                return True

    return token_hash in _token_blacklist


def create_reset_token(user_id: int, email: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create password reset token (default: 1 hour)."""
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
    """Verify and decode password reset token."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        if payload.get("type") != "password_reset":
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.JWTError:
        return None


def validate_password_strength(password: str) -> bool:
    """
    Validate password complexity rules.
    Rules: Minimum 8 characters, uppercase, lowercase, digit, special character.
    """
    pattern = re.compile(
        r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[{\]};:'\",<.>/?\\|`~]).{8,}$"
    )
    return bool(pattern.match(password))
