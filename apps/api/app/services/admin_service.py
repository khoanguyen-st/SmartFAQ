# app/services/admin_service.py
import random
import re
import string
from typing import Any, Dict, List, Optional

from sqlalchemy import delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User

from ..schemas.admin import Status, UserCreate, UserUpdate


# --- Custom API exception for service layer ---
class APIException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail


# --- Helpers --------------------------------------------------------------
def check_password_policy(password: str) -> bool:
    """Password Policy: min 8 chars, 1 uppercase, 1 number, 1 special char."""
    if not password or len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?:{}|<>]", password):
        return False
    return True


def generate_username_from_email(email: str) -> str:
    return email.split("@")[0]


def generate_random_password(length: int = 12) -> str:
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        pwd = "".join(random.choice(chars) for _ in range(length))
        if check_password_policy(pwd):
            return pwd


def send_email(to_email: str, subject: str, body: str) -> bool:
    """Placeholder for sending email. Replace with real provider implementation."""
    print(f"--- EMAIL SENT --- TO: {to_email}, SUBJECT: {subject}")
    return True


# ---------------------
# Mapper: ORM -> response dict
# ---------------------
def user_to_response(user: Optional[User]) -> Optional[Dict[str, Any]]:
    if user is None:
        return None
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        # Map boolean to the enum-like string expected by response schema
        "is_active": "Active" if user.is_active else "Locked",
        "phoneNumber": user.phoneNumber,
        "address": user.address,
        "image": user.image,
        "failed_attempts": getattr(user, "failed_attempts", None),
        "locked_until": getattr(user, "locked_until", None),
        "created_at": getattr(user, "created_at", None),
    }


# ---------------------
# Service functions (async)
# ---------------------


async def get_users(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """Return list of users (excluding SUPER_ADMIN)."""
    stmt = select(User).where(User.role != "SUPER_ADMIN").offset(skip).limit(limit)
    result = await db.execute(stmt)
    users = result.scalars().all()
    return [user_to_response(u) for u in users]


async def create_user(db: AsyncSession, user_data: UserCreate) -> Dict[str, Any]:
    """Create a new user. Raises APIException on validation errors."""
    if not check_password_policy(user_data.password):
        raise APIException(status_code=400, detail="Password does not meet security requirements.")

    username = generate_username_from_email(user_data.email)

    # check duplicates
    stmt = select(User).where(or_(User.username == username, User.email == user_data.email))
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise APIException(status_code=409, detail="Username or email already exists.")

    hashed_password = hash_password(user_data.password)

    db_user = User(
        username=username,
        email=user_data.email,
        password_hash=hashed_password,
        role=user_data.role.value,
        is_active=(user_data.status == Status.ACTIVE),
        phoneNumber=user_data.phoneNumber,
        address=user_data.address,
        image=user_data.image,
    )

    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return user_to_response(db_user)


async def update_user(db: AsyncSession, user_id: int, user_data: UserUpdate) -> Dict[str, Any]:
    """Update existing user."""
    db_user = await db.get(User, user_id)
    if not db_user:
        raise APIException(status_code=404, detail="User not found.")

    if db_user.role == "SUPER_ADMIN":
        raise APIException(status_code=403, detail="Cannot manage Super Admin accounts.")

    # validate duplicate when email changes
    if user_data.email and user_data.email != db_user.email:
        new_username = generate_username_from_email(user_data.email)
        stmt = select(User).where(
            or_(User.username == new_username, User.email == user_data.email), User.id != user_id
        )
        result = await db.execute(stmt)
        existing_user = result.scalars().first()
        if existing_user:
            raise APIException(status_code=409, detail="Username or email already exists.")

        db_user.username = new_username
        db_user.email = user_data.email

    if user_data.role:
        db_user.role = user_data.role.value

    if user_data.phoneNumber is not None:
        db_user.phoneNumber = user_data.phoneNumber
    if user_data.address is not None:
        db_user.address = user_data.address
    if user_data.image is not None:
        db_user.image = user_data.image

    await db.commit()
    await db.refresh(db_user)
    return user_to_response(db_user)


async def reset_user_password(db: AsyncSession, user_id: int) -> Dict[str, Any]:
    """Reset a user's password and email the temporary password."""
    db_user = await db.get(User, user_id)
    if not db_user:
        raise APIException(status_code=404, detail="User not found.")

    if db_user.role == "SUPER_ADMIN":
        raise APIException(
            status_code=403, detail="Cannot reset Super Admin password through this interface."
        )

    new_password = generate_random_password()
    hashed_password = hash_password(new_password)

    db_user.password_hash = hashed_password
    await db.commit()
    await db.refresh(db_user)

    send_email(
        to_email=db_user.email,
        subject="Thiết lập lại mật khẩu thành công",
        body=f"Mật khẩu tạm thời: {new_password}",
    )

    return user_to_response(db_user)


async def lock_user(db: AsyncSession, user_id: int) -> Dict[str, Any]:
    """Lock a user account."""
    db_user = await db.get(User, user_id)
    if not db_user:
        raise APIException(status_code=404, detail="User not found.")

    if db_user.role == "SUPER_ADMIN":
        raise APIException(status_code=403, detail="Only Super Admins can lock user accounts.")

    if not db_user.is_active:
        raise APIException(status_code=409, detail="User account is already locked.")

    try:
        db_user.is_active = False
        await db.commit()

        send_email(
            to_email=db_user.email,
            subject="Tài khoản bị khóa",
            body="Tài khoản của bạn đã bị khóa tạm thời.",
        )

        await db.refresh(db_user)
        return user_to_response(db_user)
    except Exception:
        raise APIException(status_code=500, detail="Unable to lock user. Please try again later.")


async def unlock_user(db: AsyncSession, user_id: int) -> Dict[str, Any]:
    """Unlock a user account."""
    db_user = await db.get(User, user_id)
    if not db_user:
        raise APIException(status_code=404, detail="User not found.")

    if db_user.role == "SUPER_ADMIN":
        raise APIException(status_code=403, detail="Cannot unlock Super Admin accounts.")

    try:
        db_user.is_active = True
        await db.commit()

        send_email(
            to_email=db_user.email,
            subject="Tài khoản đã được mở khóa",
            body="Tài khoản của bạn đã được mở khóa thành công.",
        )

        await db.refresh(db_user)
        return user_to_response(db_user)
    except Exception:
        raise APIException(status_code=500, detail="Unable to unlock user. Please try again later.")


async def delete_user(db: AsyncSession, user_id: int) -> Dict[str, Any]:
    """Delete a user from DB and confirm it."""
    db_user = await db.get(User, user_id)
    if not db_user:
        raise APIException(status_code=404, detail="User not found.")

    if db_user.role == "SUPER_ADMIN":
        raise APIException(status_code=403, detail="Cannot delete Super Admin accounts.")

    payload = user_to_response(db_user)

    # Use SQL delete (explicit) instead of ORM object delete
    stmt = delete(User).where(User.id == user_id)
    await db.execute(stmt)
    await db.commit()

    # Verify deletion
    res = await db.execute(select(User).where(User.id == user_id))
    still = res.scalar_one_or_none()
    print(f"[DEBUG] After commit, user exists? {bool(still)}")

    if still:
        raise APIException(status_code=500, detail="Delete failed — user still exists.")

    return payload
    # note: AsyncSession.delete is not awaitable; just call it.
    # db.delete(db_user)
    # await db.commit()
    # return payload
