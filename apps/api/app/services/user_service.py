"""User service for handling database operations."""

from typing import List, Optional

from sqlalchemy.orm import Session

from ..core.security import get_password_hash
from ..models.user import User


class UserService:
    """Service class for user-related database operations."""

    @staticmethod
    def get_all_users(db: Session) -> List[User]:
        """Get all users from database."""
        return db.query(User).all()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get a user by ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Get a user by username."""
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def create_user(db: Session, username: str, email: str, password: str, role: str) -> User:
        """Create a new user."""
        new_user = User(
            username=username,
            password_hash=get_password_hash(password),
            role=role,
            is_active=True,
        )

        # Add email if User model supports it
        if hasattr(User, "email"):
            new_user.email = email

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def update_user(
        db: Session,
        user: User,
        username: Optional[str] = None,
        email: Optional[str] = None,
        role: Optional[str] = None,
    ) -> User:
        """Update an existing user."""
        if username:
            user.username = username

        if email and hasattr(User, "email"):
            user.email = email

        if role:
            user.role = role

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def delete_user(db: Session, user: User) -> None:
        """Delete a user."""
        db.delete(user)
        db.commit()
