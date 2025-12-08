"""Admin service."""

from datetime import datetime, timedelta
from typing import List, Optional

import bcrypt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.department import Department
from ..models.user import User
from ..models.user_department import UserDepartment


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

    # Validate staff must have departments
    department_ids = data.pop("department_ids", [])
    if role == "staff" and not department_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Staff users must be assigned to at least one department.",
        )

    if "password" not in data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required",
        )
    data["password_hash"] = hash_password(data.pop("password"))

    new_user = User(
        **data,
        failed_attempts=0,
        is_locked=False,
        locked_until=None,
        created_at=datetime.utcnow(),
    )

    db.add(new_user)
    await db.flush()

    # Assign departments if provided
    if department_ids:
        # Verify all departments exist
        dept_result = await db.execute(select(Department).where(Department.id.in_(department_ids)))
        departments = dept_result.scalars().all()
        if len(departments) != len(department_ids):
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more department IDs are invalid.",
            )

        # Create user-department associations
        for dept_id in department_ids:
            user_dept = UserDepartment(user_id=new_user.id, department_id=dept_id)
            db.add(user_dept)

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
