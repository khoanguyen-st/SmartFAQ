"""Staff management service (async version)."""

import asyncio
import io
import logging
import os
from typing import Any, Optional

import bcrypt
from fastapi import HTTPException, UploadFile, status
from minio import Minio
from minio.error import S3Error
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.config import settings
from ..models.user import User

logger = logging.getLogger(__name__)

# Initialize MinIO client (same as dms.py)
minio_client = Minio(
    "minio:9000",
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_SECURE,
)

BUCKET_NAME = settings.MINIO_BUCKET_NAME
AVATAR_FOLDER = "avatars/"

if not minio_client.bucket_exists(BUCKET_NAME):
    minio_client.make_bucket(BUCKET_NAME)

ALLOWED_AVATAR_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}


class UploadTooLarge(Exception):
    pass


class InvalidFileType(Exception):
    pass


async def save_avatar_file(file: UploadFile, user_id: int) -> str:
    """Upload avatar to MinIO and return the object name."""
    orig_name = file.filename or "avatar.png"
    _, ext = os.path.splitext(orig_name)
    ext = ext.lower()

    if ext not in ALLOWED_AVATAR_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{ext}' is not allowed. Allowed: {', '.join(ALLOWED_AVATAR_EXTS)}",
        )

    # Validate file size before reading
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    max_bytes = int(settings.UPLOAD_MAX_MB) * 1024 * 1024
    if size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {settings.UPLOAD_MAX_MB} MB",
        )

    # Read file content
    content = await file.read()

    # Generate unique object name: avatars/user_{user_id}_{timestamp}.ext
    import time

    timestamp = int(time.time() * 1000)
    object_name = f"{AVATAR_FOLDER}user_{user_id}_{timestamp}{ext}"

    logger.info("Avatar upload start: %s to MinIO (Object Name: %s)", orig_name, object_name)

    try:
        await asyncio.to_thread(
            minio_client.put_object,
            BUCKET_NAME,
            object_name,
            data=io.BytesIO(content),
            length=size,
            content_type=f"image/{ext.lstrip('.')}",
        )
        logger.info("Avatar upload complete: %s", object_name)
        return object_name

    except S3Error as exc:
        logger.error("Avatar upload failed: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload avatar to storage",
        ) from exc


async def get_user_profile(user_id: int, db: AsyncSession) -> Optional[dict]:
    """Get user profile with MinIO avatar URL."""
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        return None

    image_url = None
    if user.image:
        try:
            # Generate presigned URL for avatar (valid for 7 days)
            image_url = await asyncio.to_thread(
                minio_client.presigned_get_object,
                BUCKET_NAME,
                user.image,
                expires=7 * 24 * 60 * 60,  # 7 days
            )
            logger.info("Generated presigned URL for user %s avatar: %s", user_id, user.image)
        except Exception as exc:
            logger.error("Failed to generate presigned URL for avatar %s: %s", user.image, exc)
            # Fallback: return the object path itself
            image_url = user.image

    return {
        "username": user.username,
        "email": user.email,
        "phone": user.phone,
        "address": user.address,
        "image": image_url,
    }


async def get_current_user_info(user_id: int, db: AsyncSession) -> Optional[dict]:
    """Get current user info with departments for dropdown menu."""
    stmt = select(User).options(selectinload(User.departments)).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        return None

    # Get avatar URL
    image_url = None
    if user.image:
        try:
            image_url = await asyncio.to_thread(
                minio_client.presigned_get_object, BUCKET_NAME, user.image, expires=7 * 24 * 60 * 60
            )
            logger.info(
                "Generated presigned URL for user %s avatar in get_current_user_info: %s",
                user_id,
                user.image,
            )
        except Exception as exc:
            logger.error("Failed to generate presigned URL for avatar %s: %s", user.image, exc)
            # Fallback: return the object path itself
            image_url = user.image

    # Map departments
    departments = [{"id": dept.id, "name": dept.name} for dept in user.departments]

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "image": image_url,
        "departments": departments,
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
    """Upload new avatar to MinIO, delete old one if exists."""
    # Get old avatar path
    stmt = select(User.image).where(User.id == user_id)
    result = await db.execute(stmt)
    old_object_name = result.scalar_one_or_none()

    # Upload new avatar
    new_object_name = await save_avatar_file(file, user_id)

    # Delete old avatar from MinIO if exists
    if old_object_name:
        try:
            await asyncio.to_thread(minio_client.remove_object, BUCKET_NAME, old_object_name)
            logger.info("Deleted old avatar: %s", old_object_name)
        except Exception as exc:
            logger.warning("Failed to delete old avatar %s: %s", old_object_name, exc)

    # Update user record
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user:
        user.image = new_object_name
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info("Updated user %s avatar to: %s", user_id, new_object_name)
    else:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate presigned URL for response
    try:
        image_url = await asyncio.to_thread(
            minio_client.presigned_get_object,
            BUCKET_NAME,
            new_object_name,
            expires=7 * 24 * 60 * 60,
        )
    except Exception as exc:
        logger.warning("Failed to generate presigned URL: %s", exc)
        image_url = new_object_name

    return {"image": image_url}


async def delete_user_avatar(user_id: int, db: AsyncSession) -> bool:
    """Delete user avatar from MinIO and database."""
    stmt = select(User.image).where(User.id == user_id)
    result = await db.execute(stmt)
    object_name = result.scalar_one_or_none()

    if not object_name:
        return False

    # Delete from MinIO
    try:
        await asyncio.to_thread(minio_client.remove_object, BUCKET_NAME, object_name)
        logger.info("Deleted avatar from MinIO: %s", object_name)
    except Exception as exc:
        logger.error("Failed to delete avatar from MinIO %s: %s", object_name, exc)
        # Continue to update DB even if MinIO delete fails

    # Update database
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


async def get_file_from_minio(file_key: str):
    """Get file from MinIO by object path."""
    try:
        response = await asyncio.to_thread(minio_client.get_object, BUCKET_NAME, file_key)
        return response
    except S3Error as exc:
        logger.error("MinIO error getting file %s: %s", file_key, exc)
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as exc:
        logger.error("Failed to get file %s: %s", file_key, exc)
        raise HTTPException(status_code=500, detail="Failed to get file")
