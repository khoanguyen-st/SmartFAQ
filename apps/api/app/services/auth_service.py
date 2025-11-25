from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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

class InactiveAccountError(Exception):
    """Raised when user account is inactive."""

class AuthService:
    """Business logic for authenticating admin users."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def login(self, email: str, password: str, campus_id: str) -> tuple[str, str]:
        """Authenticate user and return JWT access token and refresh token."""
        user = await self._authenticate_user(email, password, campus_id)

        import time
        login_time = int(time.time())
        
        user_data = {
            "sub": str(user.id),  # Use user_id as subject instead of email
            "user_id": user.id,
            "role": user.role,
            "campus_id": user.campus_id,
        }
        
        access_token = create_access_token(data=user_data)
        refresh_token = create_refresh_token(
            data={**user_data, "login_time": login_time}
        )
        
        return access_token, refresh_token

    async def _authenticate_user(self, email: str, password: str, campus_id: str) -> User:
        """Internal method to authenticate user."""
        result = await self.db.execute(select(User).filter(User.email == email))
        user: Optional[User] = result.scalar_one_or_none()
        
        # Check if user exists
        if not user:
            raise UserNotFoundError
        
        # Check if account is active
        if not user.is_active:
            raise InactiveAccountError 

        # Check if campus matches
        if user.campus_id != campus_id:
            raise InvalidCampusError
        
        # Check if account is locked
        self.check_account_locked(user)
        
        # Verify password
        if verify_password(password, user.password_hash):
            await self.reset_failed_attempts(user)
            await self.db.commit()
            await self.db.refresh(user)
            return user
        
        # Password is incorrect
        await self.increment_failed_attempts(user)
        await self.db.commit()
        await self.db.refresh(user)
        if user.is_locked:
            raise AccountLockedError
        raise InvalidPasswordError

    def check_account_locked(self, user: User) -> None:
        """Check if user account is locked."""
        if user.is_locked:
            raise AccountLockedError

    async def increment_failed_attempts(self, user: User) -> None:
        """Increment failed login attempts and lock account if threshold reached."""
        user.failed_attempts += 1
        if user.failed_attempts >= 5 and user.role != "ADMIN":
            user.is_locked = True
            user.locked_until = datetime.utcnow()
            result = await self.db.execute(
                select(User).filter(
                    User.role == "ADMIN",
                    User.is_active == True
                )
            )
            admin_user = result.scalar_one_or_none()
            if admin_user:
                admin_email = admin_user.notification_email or admin_user.email
                # TODO: Send email notification to admin_email about locked account
        self.db.add(user)

    async def reset_failed_attempts(self, user: User) -> None:
        """Reset failed login attempts."""
        user.failed_attempts = 0
        user.is_locked = False
        user.locked_until = None
        self.db.add(user)

    async def forgot_password(self, email: str) -> str:
        """Generate password reset token for user."""
        result = await self.db.execute(select(User).filter(User.email == email))
        user: User | None = result.scalar_one_or_none()
        if not user:
            raise UserNotFoundError
        reset_token = create_reset_token(user_id=user.id, email=user.email)
        result = await self.db.execute(
            select(User).filter(
                User.role == "ADMIN",
                User.is_active == True
            )
        )
        admin_user = result.scalar_one_or_none()
        if admin_user:
            admin_email = admin_user.notification_email or admin_user.email
            # TODO: Send reset_token via email
        return reset_token

    async def reset_password(self, token: str, new_password: str) -> None:
        """Reset user password using reset token."""
        token_payload = verify_reset_token(token)
        if not token_payload:
            raise InvalidTokenError
        result = await self.db.execute(select(User).filter(User.id == token_payload["user_id"]))
        user: User | None = result.scalar_one_or_none()
        if not user:
            raise InvalidTokenError
        if not validate_password_strength(new_password):
            raise WeakPasswordError
        user.password_hash = hash_password(new_password)
        await self.reset_failed_attempts(user)
        await self.db.commit()

    async def logout(self, token: str) -> None:
        """Blacklist token on logout."""
        await add_token_to_blacklist(token, self.db)

    async def unlock_account(self, user_id: int) -> None:
        """Unlock user account (Admin only)."""
        result = await self.db.execute(select(User).filter(User.id == user_id))
        user: User | None = result.scalar_one_or_none()
        if not user:
            raise UserNotFoundError
        await self.reset_failed_attempts(user)
        await self.db.commit()

    async def refresh_access_token(self, refresh_token: str) -> str:
        """
        Refresh access token using refresh token.
        Returns new access token if refresh token is valid and within 24h of login.
        """
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
                "campus_id": user.campus_id,
            }
        )
        
        return access_token
