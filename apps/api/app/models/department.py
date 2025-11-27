"""Department model."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .config import Base

if TYPE_CHECKING:
    from .document import Document
    from .user import User


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    documents: Mapped["Document"] = relationship(
        "Document",
        back_populates="department",
    )

    users: Mapped[list["User"]] = relationship(
        "User", secondary="user_departments", back_populates="departments"
    )
