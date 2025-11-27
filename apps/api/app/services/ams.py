"""Admin service."""

from datetime import datetime, timedelta
from typing import List, Optional

import bcrypt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User


def hash_password(password: str) -> str:
    if not password or not password.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password cannot be empty",
        )
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


async def list_users(db: AsyncSession, role: Optional[str] = None) -> List[User]:
    """List only internal users (staff & admin)."""
    stmt = select(User).where(User.role.in_(["staff", "admin"]))

    if role:
        stmt = stmt.where(User.role == role)

    result = await db.execute(stmt)
    return result.scalars().all()


async def get_user(user_id: int, db: AsyncSession):
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(data: dict, db: AsyncSession):
    role = data.get("role")
    if not role or role not in ["staff", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'staff' or 'admin'.",
        )

    if "password" not in data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required",
        )
    data["password_hash"] = hash_password(data.pop("password"))

    new_user = User(
        **data,
        is_active=True,
        failed_attempts=0,
        is_locked=False,
        locked_until=None,
        created_at=datetime.utcnow(),
    )

    db.add(new_user)

    try:
        await db.commit()
        await db.refresh(new_user)
        return new_user
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists.",
        )


async def update_user(user_id: int, data: dict, db: AsyncSession) -> bool:
    user = await get_user(user_id, db)
    if not user:
        return False

    if "role" in data and data["role"] not in ["staff", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'staff' or 'admin'.",
        )

    if "password" in data:
        data["password_hash"] = hash_password(data.pop("password"))

    for key, value in data.items():
        if hasattr(user, key):
            setattr(user, key, value)

    try:
        await db.commit()
        await db.refresh(user)
        return True
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists.",
        )


async def lock_user(user_id: int, db: AsyncSession) -> bool:
    user = await get_user(user_id, db)
    if not user:
        return False

    user.is_locked = True
    user.locked_until = datetime.utcnow() + timedelta(days=30)
    await db.commit()
    return True


async def unlock_user(user_id: int, db: AsyncSession) -> bool:
    user = await get_user(user_id, db)
    if not user:
        return False

    user.is_locked = False
    user.failed_attempts = 0
    user.locked_until = None
    await db.commit()
    return True
