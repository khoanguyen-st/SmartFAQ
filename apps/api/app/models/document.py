"""Document metadata model."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .config import Base

if TYPE_CHECKING:
    from .document_version import DocumentVersion


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    tags: Mapped[str | None] = mapped_column(String(255), nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="en")
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE")
<<<<<<< HEAD
    current_version_id: Mapped[int | None] = mapped_column(
        ForeignKey("document_versions.id"), nullable=True
    )
=======

    current_version_id: Mapped[int | None] = mapped_column(
        ForeignKey("document_versions.id"), nullable=True
    )

>>>>>>> feat/SF-33
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    versions: Mapped[list["DocumentVersion"]] = relationship(
        "DocumentVersion",
        back_populates="document",
<<<<<<< HEAD
        foreign_keys="[DocumentVersion.document_id]",
        cascade="all, delete-orphan",
        order_by="DocumentVersion.version_no",
=======
        cascade="all, delete-orphan",
        primaryjoin="Document.id == DocumentVersion.document_id",
        foreign_keys="DocumentVersion.document_id",
>>>>>>> feat/SF-33
    )

    current_version: Mapped["DocumentVersion | None"] = relationship(
        "DocumentVersion",
<<<<<<< HEAD
        foreign_keys=[current_version_id],
        uselist=False,
=======
        uselist=False,
        foreign_keys=[current_version_id],
        post_update=True,
>>>>>>> feat/SF-33
    )
