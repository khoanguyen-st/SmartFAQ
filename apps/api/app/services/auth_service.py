"""Authentication service logic."""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

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

class InvalidTokenError(Exception):
    """Raised when token is invalid or expired."""

class WeakPasswordError(Exception):
    """Raised when password does not meet strength requirements."""

class InactiveAccountError(Exception):
    """Raised when user account is inactive."""

class AuthService:
    """Business logic for authenticating admin users."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def login(self, email: str, password: str, campus_id: str) -> tuple[str, str]:
        """Authenticate user and return JWT access token and refresh token."""
        user = self._authenticate_user(email, password, campus_id)
        if not user:
            raise InvalidCredentialsError

        import time
        login_time = int(time.time())
        
        user_data = {
            "sub": user.email,
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "campus_id": user.campus_id,
        }
        
        access_token = create_access_token(data=user_data)
        refresh_token = create_refresh_token(
            data={**user_data, "login_time": login_time}
        )
        
        return access_token, refresh_token

    def _authenticate_user(self, email: str, password: str, campus_id: str) -> Optional[User]:
        """Internal method to authenticate user."""
        user: Optional[User] = (
            self.db.query(User).filter(User.email == email).first()
        )
        if not user:
            return None
        if not user.is_active:
            raise InactiveAccountError 

        if user.campus_id != campus_id:
            return None
        self.check_account_locked(user)
        if verify_password(password, user.password_hash):
            self.reset_failed_attempts(user)
            self.db.commit()
            self.db.refresh(user)
            return user
        self.increment_failed_attempts(user)
        self.db.commit()
        self.db.refresh(user)
        if user.is_locked:
            raise AccountLockedError
        return None

    def check_account_locked(self, user: User) -> None:
        """Check if user account is locked."""
        if user.is_locked:
            raise AccountLockedError
    def increment_failed_attempts(self, user: User) -> None:
        """Increment failed login attempts and lock account if threshold reached."""
        user.failed_attempts += 1
        if user.failed_attempts >= 5 and user.role != "ADMIN":
            user.is_locked = True
            user.locked_until = datetime.utcnow()
            admin_user = self.db.query(User).filter(
                User.role == "ADMIN",
                User.is_active == True
            ).first()
            if admin_user:
                admin_email = admin_user.notification_email or admin_user.email
                # TODO: Send email notification to admin_email about locked account
                # Email content should include: locked username (user.username), timestamp, etc.
                # Example: f"Account {user.username} has been locked due to 5 failed login attempts."
        self.db.add(user)

    def reset_failed_attempts(self, user: User) -> None:
        """Reset failed login attempts."""
        user.failed_attempts = 0
        user.is_locked = False
        user.locked_until = None
        self.db.add(user)

    def forgot_password(self, email: str) -> str:
        """Generate password reset token for user."""
        user: User | None = self.db.query(User).filter(User.email == email).first()
        if not user:
            raise UserNotFoundError
        reset_token = create_reset_token(user_id=user.id, email=user.email)
        admin_user = self.db.query(User).filter(
            User.role == "ADMIN",
            User.is_active == True
        ).first()
        if admin_user:
            admin_email = admin_user.notification_email or admin_user.email
            # TODO: Send reset_token via email to:
            #   - user.email (the user requesting reset)
            #   - admin_email (notify admin about password reset request)
            # Email to user should contain reset link with token
            # Email to admin should notify about password reset request for user.username
        return reset_token

    def reset_password(self, token: str, new_password: str) -> None:
        """Reset user password using reset token."""
        token_payload = verify_reset_token(token)
        if not token_payload:
            raise InvalidTokenError
        user: User | None = self.db.query(User).filter(User.id == token_payload["user_id"]).first()
        if not user:
            raise InvalidTokenError
        if not validate_password_strength(new_password):
            raise WeakPasswordError
        user.password_hash = hash_password(new_password)
        self.reset_failed_attempts(user)
        self.db.commit()

    def logout(self, token: str) -> None:
        """Blacklist token on logout."""
        add_token_to_blacklist(token, self.db)

    def unlock_account(self, user_id: int) -> None:
        """Unlock user account (Admin only)."""
        user: User | None = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise UserNotFoundError
        self.reset_failed_attempts(user)
        self.db.commit()

    def refresh_access_token(self, refresh_token: str) -> str:
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
        
        user: User | None = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise InvalidTokenError
        if not user.is_active:
            raise InactiveAccountError
        if user.is_locked:
            raise AccountLockedError
        
        access_token = create_access_token(
            data={
                "sub": user.email,
                "user_id": user.id,
                "email": user.email,
                "role": user.role,
                "campus_id": user.campus_id,
            }
        )
        
        return access_token