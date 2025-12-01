import time
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import (
    add_token_to_blacklist,
    create_access_token,
    create_refresh_token,
    create_reset_token,
    hash_password,
    validate_password_strength,
    verify_password,
    verify_refresh_token,
    verify_reset_token,
)
from ..models.user import User
from ..services.email_service import EmailService


class AccountLockedError(Exception):
    """Raised when user account is locked."""


class InvalidCredentialsError(Exception):
    """Raised when credentials are invalid."""


class UserNotFoundError(Exception):
    """Raised when user is not found."""


class InvalidCampusError(Exception):
    """Raised when campus_id does not match user's campus."""


class InvalidPasswordError(Exception):
    """Raised when password is incorrect."""


class InvalidTokenError(Exception):
    """Raised when token is invalid or expired."""


class WeakPasswordError(Exception):
    """Raised when password does not meet strength requirements."""


class SamePasswordError(Exception):
    """Raised when new password is same as old password."""


class InactiveAccountError(Exception):
    """Raised when user account is inactive."""


class AuthService:
    """Business logic for authenticating admin users."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def login(self, email: str, password: str, campus_id: str) -> tuple[str, str]:
        user = await self._authenticate_user(email, password, campus_id)
        login_time = int(time.time())
        user_data = {
            "sub": str(user.id),
            "user_id": user.id,
            "role": user.role,
            "campus_id": user.campus,
        }
        access_token = create_access_token(data=user_data)
        refresh_token = create_refresh_token(data={**user_data, "login_time": login_time})
        return access_token, refresh_token

    async def _authenticate_user(self, email: str, password: str, campus_id: str) -> User:
        result = await self.db.execute(select(User).filter(User.email == email))
        user: Optional[User] = result.scalar_one_or_none()

        if not user:
            raise UserNotFoundError

        if user.is_locked:
            raise AccountLockedError

        if not user.is_active:
            raise InactiveAccountError

        if not verify_password(password, user.password_hash):
            await self.increment_failed_attempts(user)
            await self.db.commit()
            await self.db.refresh(user)

            if user.is_locked:
                raise AccountLockedError
            raise InvalidPasswordError

        if user.campus != campus_id:
            raise InvalidCampusError

        await self.reset_failed_attempts(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def increment_failed_attempts(self, user: User) -> None:
        user.failed_attempts += 1
        if user.failed_attempts >= 5 and user.role != "ADMIN":
            user.is_locked = True
            user.locked_until = datetime.utcnow()
            result = await self.db.execute(
                select(User).filter(User.role == "ADMIN", User.is_active)
            )
            admin_user = result.scalar_one_or_none()
            if admin_user:
                pass
        self.db.add(user)

    async def reset_failed_attempts(self, user: User) -> None:
        user.failed_attempts = 0
        user.is_locked = False
        user.locked_until = None
        self.db.add(user)

    async def reset_failed_attempts_only(self, user: User) -> None:
        user.failed_attempts = 0
        self.db.add(user)

    async def forgot_password(self, email: str) -> str:
        result = await self.db.execute(select(User).filter(User.email == email))
        user: User | None = result.scalar_one_or_none()
        if not user:
            raise UserNotFoundError

        reset_token = create_reset_token(user_id=user.id, email=user.email)

        # Gửi email reset password
        email_service = EmailService()
        email_sent = await email_service.send_password_reset_email(
            to_email=user.email, reset_token=reset_token, username=user.username
        )

        if not email_sent:
            # Log error but don't fail the request (security: don't reveal if email exists)
            pass

        result = await self.db.execute(select(User).filter(User.role == "ADMIN", User.is_active))
        admin_user = result.scalar_one_or_none()
        if admin_user:
            pass

        return reset_token

    async def reset_password(self, token: str, new_password: str) -> None:
        token_payload = await verify_reset_token(token, self.db)
        if not token_payload:
            raise InvalidTokenError
        result = await self.db.execute(select(User).filter(User.id == token_payload["user_id"]))
        user: User | None = result.scalar_one_or_none()
        if not user:
            raise InvalidTokenError
        if not validate_password_strength(new_password):
            raise WeakPasswordError
        if verify_password(new_password, user.password_hash):
            raise SamePasswordError
        user.password_hash = hash_password(new_password)
        await self.reset_failed_attempts_only(user)
        await add_token_to_blacklist(token, self.db)
        await self.db.commit()

    async def logout(self, token: str) -> None:
        await add_token_to_blacklist(token, self.db)

    async def unlock_account(self, user_id: int) -> None:
        result = await self.db.execute(select(User).filter(User.id == user_id))
        user: User | None = result.scalar_one_or_none()
        if not user:
            raise UserNotFoundError
        await self.reset_failed_attempts(user)
        await self.db.commit()

    async def refresh_access_token(self, refresh_token: str) -> str:
        payload = verify_refresh_token(refresh_token)
        if not payload:
            raise InvalidTokenError
        user_id = payload.get("user_id")
        if not user_id:
            raise InvalidTokenError
        result = await self.db.execute(select(User).filter(User.id == user_id))
        user: User | None = result.scalar_one_or_none()
        if not user:
            raise InvalidTokenError
        if not user.is_active:
            raise InactiveAccountError
        if user.is_locked:
            raise AccountLockedError

        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "user_id": user.id,
                "role": user.role,
                "campus_id": user.campus,
            }
        )

        return access_token

    async def verify_reset_token(self, token: str) -> dict | None:
        """Verify reset token without resetting password."""
        return await verify_reset_token(token, self.db)
