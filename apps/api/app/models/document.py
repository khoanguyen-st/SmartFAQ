# document.py
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .config import Base

if TYPE_CHECKING:
    from .department import Department
    from .user import User


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    version_no: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    tags: Mapped[str | None] = mapped_column(String(255), nullable=True)
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="vi")
    status: Mapped[str] = mapped_column(
        SAEnum("REQUEST", "PROCESSING", "ACTIVE", "FAIL", name="documentstatus"),
        nullable=False,
        default="REQUEST",
    )

    file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    format: Mapped[str] = mapped_column(String(50), nullable=False)

    creator_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_deleted: Mapped[bool] = mapped_column(default=False)

    creator: Mapped["User | None"] = relationship("User", back_populates="documents")
    department: Mapped["Department | None"] = relationship("Department", back_populates="documents")
