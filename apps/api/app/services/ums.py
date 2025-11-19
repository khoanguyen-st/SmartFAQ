"""Staff management service (async version)."""

import logging
import os
from typing import Any, Optional
from uuid import uuid4

import bcrypt
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from fastapi import UploadFile
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..models.user import User

logger = logging.getLogger(__name__)

ALLOWED_AVATAR_EXTS = {".png", ".jpg", ".jpeg"}


class UploadTooLarge(Exception):
    pass


class InvalidFileType(Exception):
    pass


def configure_cloudinary() -> None:
    if not all(
        [
            settings.CLOUDINARY_CLOUD_NAME,
            settings.CLOUDINARY_API_KEY,
            settings.CLOUDINARY_API_SECRET,
        ]
    ):
        raise ValueError("Cloudinary configuration is incomplete")

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


async def save_avatar_file(file: UploadFile) -> str:
    configure_cloudinary()

    orig_name = file.filename or "avatar.png"
    _, ext = os.path.splitext(orig_name)
    ext = ext.lower()

    if ext not in ALLOWED_AVATAR_EXTS:
        raise InvalidFileType(f"file type '{ext}' is not allowed")

    content = await file.read()
    if len(content) > settings.UPLOAD_MAX_MB * 1024 * 1024:
        raise UploadTooLarge(f"uploaded file exceeds max size of {settings.UPLOAD_MAX_MB} MB")

    await file.seek(0)

    logger.info("avatar upload start: %s", orig_name)

    try:
        upload_result = cloudinary.uploader.upload(
            file.file,
            folder=settings.CLOUDINARY_FOLDER_IMAGE,
            resource_type="image",
            public_id=f"avatar_{uuid4().hex}",
        )
        logger.info("avatar upload complete: %s", upload_result["secure_url"])
        return upload_result["public_id"]

    except Exception as exc:
        logger.error("avatar upload failed: %s", str(exc))
        raise exc


async def get_user_profile(user_id: int, db: AsyncSession) -> Optional[dict]:
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        return None

    image_url = None
    if user.image:
        configure_cloudinary()
        image_url = cloudinary.utils.cloudinary_url(user.image)[0]

    return {
        "username": user.username,
        "email": user.email,
        "phone": user.phone,
        "address": user.address,
        "image": image_url,
    }


async def update_user_profile(user_id: int, updates: dict[str, Any], db: AsyncSession) -> bool:
    allowed_fields = {"username", "phone", "address"}
    updates = {k: v for k, v in updates.items() if k in allowed_fields}

    if not updates:
        return True

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        return False

    for k, v in updates.items():
        setattr(user, k, v)

    await db.commit()
    return True


async def upload_user_avatar(file: UploadFile, user_id: int, db: AsyncSession) -> dict:
    public_id = await save_avatar_file(file)

    stmt = select(User.image).where(User.id == user_id)
    result = await db.execute(stmt)
    old_public_id = result.scalar_one_or_none()

    if old_public_id:
        configure_cloudinary()
        cloudinary.uploader.destroy(old_public_id)

    await db.execute(update(User).where(User.id == user_id).values(image=public_id))
    await db.commit()

    configure_cloudinary()
    image_url = cloudinary.utils.cloudinary_url(public_id)[0]
    return {"image": image_url}


async def delete_user_avatar(user_id: int, db: AsyncSession) -> bool:
    stmt = select(User.image).where(User.id == user_id)
    result = await db.execute(stmt)
    public_id = result.scalar_one_or_none()

    if not public_id:
        return False

    configure_cloudinary()
    cloudinary.uploader.destroy(public_id)

    await db.execute(update(User).where(User.id == user_id).values(image=None))
    await db.commit()
    return True


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


async def change_user_password(
    current_password: str, new_password: str, user_id: int, db: AsyncSession
) -> bool:
    stmt = select(User.password_hash).where(User.id == user_id)
    result = await db.execute(stmt)
    hashed = result.scalar_one_or_none()

    if not hashed or not bcrypt.checkpw(current_password.encode("utf-8"), hashed.encode("utf-8")):
        return False

    new_hashed = hash_password(new_password)

    await db.execute(update(User).where(User.id == user_id).values(password_hash=new_hashed))
    await db.commit()
    return True
