"""User-Department association model."""

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from .config import Base


class UserDepartment(Base):
    __tablename__ = "user_departments"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), primary_key=True)

    department_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("departments.id"), primary_key=True
    )
