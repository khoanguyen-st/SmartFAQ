"""User dependency stubs."""

import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User
from .config import settings
from .database import get_db
from .security import is_token_blacklisted, should_refresh_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
logger = logging.getLogger(__name__)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    logger.info("get_current_user called - Token received")
    if await is_token_blacklisted(token, db):
        logger.warning("Token is blacklisted")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked"
        )

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired. Please refresh your token using /auth/refresh endpoint.",
        )
    except JWTError as exc:
        logger.error(f"JWT decode error: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc

    # Check type after successful decode
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Access token required.",
        )

    # Check remaining time (optional - can log warning or add header suggestion)
    if should_refresh_token(token, threshold_seconds=60):
        pass  # Could log warning or add response header

    user_id: int | None = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalar_one_or_none()
    if not user:
        logger.error(f"User with ID {user_id} not found in database")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    logger.info(
        f"User found: {user.email}, role: {user.role}, active: {user.is_active}, locked: {user.is_locked}"
    )

    if not user.is_active:
        logger.warning(f"User {user.email} is inactive")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "Account is inactive. Please contact administrator."},
        )

    if user.is_locked:
        logger.warning(f"User {user.email} is locked")
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail={
                "error": "Account locked due to multiple failed login attempts. Please contact Super Admin."
            },
        )

    return user
