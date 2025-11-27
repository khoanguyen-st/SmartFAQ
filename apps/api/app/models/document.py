"""Document metadata model."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .config import Base

if TYPE_CHECKING:
    from .department import Department
    from .document_version import DocumentVersion
    from .user import User


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    tags: Mapped[str | None] = mapped_column(String(255), nullable=True)
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="vi")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")

    current_version_id: Mapped[int | None] = mapped_column(
        ForeignKey("document_versions.id"), nullable=True
    )

    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)

    creator_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    versions: Mapped[list["DocumentVersion"]] = relationship(
        "DocumentVersion",
        back_populates="document",
        cascade="all, delete-orphan",
        primaryjoin="Document.id == DocumentVersion.document_id",
        foreign_keys="DocumentVersion.document_id",
    )

    current_version: Mapped["DocumentVersion | None"] = relationship(
        "DocumentVersion",
        uselist=False,
        foreign_keys=[current_version_id],
        post_update=True,
    )

    department: Mapped["Department | None"] = relationship(
        "Department", back_populates="documents", foreign_keys=[department_id]
    )

    creator: Mapped["User | None"] = relationship(
        "User", back_populates="documents", foreign_keys=[creator_id]
    )
