"""Admin service."""

from datetime import datetime, timedelta

import bcrypt
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User


async def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


async def list_users(db: AsyncSession):
    result = await db.execute(select(User))
    return result.scalars().all()


async def get_user(user_id: int, db: AsyncSession):
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(data: dict, db: AsyncSession):
    try:
        if "password" in data:
            data["password_hash"] = await hash_password(data.pop("password"))
        else:
            raise ValueError("Password is required")

        new_user = User(
            **data, is_active=True, failed_attempts=0, is_locked=False, created_at=datetime.utcnow()
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user
    except IntegrityError:
        await db.rollback()
        raise HTTPException(400, "Username or email already exists.")
    except ValueError as ve:
        raise HTTPException(400, str(ve))


async def update_user(user_id: int, data: dict, db: AsyncSession):
    user = await get_user(user_id, db)
    if not user:
        return False

    if "password" in data:
        data["password_hash"] = await hash_password(data.pop("password"))

    for key, value in data.items():
        if hasattr(user, key):
            setattr(user, key, value)

    await db.commit()
    await db.refresh(user)
    return True


async def lock_user(user_id: int, db: AsyncSession):
    user = await get_user(user_id, db)
    if not user:
        return False

    user.is_locked = True
    user.locked_until = datetime.utcnow() + timedelta(days=30)
    await db.commit()
    return True


async def unlock_user(user_id: int, db: AsyncSession):
    user = await get_user(user_id, db)
    if not user:
        return False

    user.is_locked = False
    user.failed_attempts = 0
    user.locked_until = None
    await db.commit()
    return True
