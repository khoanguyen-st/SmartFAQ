# apps/api/app/services/auth_service.py
"""Authentication service logic."""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from ..core.security import verify_password
from ..models.user import User


class AccountLockedError(Exception):
    """Raised when user account is locked."""


class AuthService:
    """Business logic for authenticating admin users."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        user: Optional[User] = (
            self.db.query(User).filter(User.username == username).first()
        )

        if not user:
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
        if user.is_locked:
            raise AccountLockedError

    def increment_failed_attempts(self, user: User) -> None:
        user.failed_attempts += 1

        if user.failed_attempts >= 5:
            user.is_locked = True
            user.locked_until = datetime.utcnow()
            # TODO: Trigger email notification to Super Admin about locked account.

        self.db.add(user)

    def reset_failed_attempts(self, user: User) -> None:
        user.failed_attempts = 0
        user.is_locked = False
        user.locked_until = None
        self.db.add(user)