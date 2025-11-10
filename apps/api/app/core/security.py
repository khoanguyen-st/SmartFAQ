"""Security helpers for authentication and authorization."""

from datetime import timedelta
from functools import lru_cache
from typing import Optional
import re
import time

from jose import jwt
import bcrypt

from .config import settings
from ..models.user import User


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt (AC 4.1).
    
    Args:
        password: Plain text password to hash
        
    Returns:
        Hashed password string (bcrypt format)
    """
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash using bcrypt (AC 4.1).
    
    Args:
        password: Plain text password to verify
        hashed_password: Hashed password to compare against
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        password_bytes = password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


@lru_cache(maxsize=1)
def get_admin_hash() -> str:
    return hash_password("admin")


async def authenticate_user(username: str, password: str) -> Optional[User]:
    # TODO: 
    admin_hash = get_admin_hash()
    if username == "admin" and verify_password(password, admin_hash):
        return User(username="admin", password_hash=admin_hash, role="SUPER_ADMIN", is_active=True)
    return None


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token (AC 5.1, AC 5.2).
    
    Args:
        data: Dictionary containing user_id, username, role to include in token
        expires_delta: Optional timedelta for token expiration. Defaults to 8 hours (28800 seconds).
        
    Returns:
        Encoded JWT token string with user_id, username, role, iat, exp
    """
    if expires_delta is None:
        expires_delta = timedelta(seconds=28800)
    
   
    now_ts = int(time.time())
    expire_ts = now_ts + int(expires_delta.total_seconds())
    
    payload = {
        **data, 
        "exp": expire_ts,  
        "iat": now_ts  
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")



_token_blacklist: set[str] = set()


def add_token_to_blacklist(token: str) -> None:
    """
    Add token to blacklist để logout (AC 6).
    
    Args:
        token: JWT token to blacklist
    """
    _token_blacklist.add(token)


def is_token_blacklisted(token: str) -> bool:
    """
    Check if token is blacklisted (AC 6).
    
    Args:
        token: JWT token to check
        
    Returns:
        True if token is blacklisted, False otherwise
    """
    return token in _token_blacklist


def clear_token_blacklist() -> None:
    """
    Clear all blacklisted tokens (for testing or cleanup).
    """
    _token_blacklist.clear()


def create_reset_token(user_id: int, email: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT reset token for password reset (AC 7.2).
    
    Args:
        user_id: User ID
        email: User email
        expires_delta: Optional timedelta for token expiration. Defaults to 1 hour.
        
    Returns:
        Encoded JWT reset token
    """
    if expires_delta is None:
        expires_delta = timedelta(hours=1)  # Default 1 hour
    
    now_ts = int(time.time())
    expire_ts = now_ts + int(expires_delta.total_seconds())
    
    payload = {
        "user_id": user_id,
        "email": email,
        "type": "password_reset",
        "exp": expire_ts,
        "iat": now_ts
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def verify_reset_token(token: str) -> dict | None:
    """
    Verify and decode reset token (AC 7.4).
    
    Args:
        token: Reset token to verify
        
    Returns:
        Decoded payload if valid, None otherwise
    """
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
    Validate password complexity rules (AC 7.5).
    """
    pattern = re.compile(
        r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[{\]};:'\",<.>/?\\|`~]).{8,}$"
    )
    return bool(pattern.match(password))
