from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from .config import Base


class ChatRole(str, Enum):
    """Enumeration for chat roles."""

    USER = "user"
    ASSISTANT = "assistant"


class Channel(str, Enum):
    """Enumeration for chat channels."""

    WIDGET = "widget"
    CHATSTUDENT = "chatstudent"
    CHATSTAFF = "chatstaff"
    MANAGEMENT = "management"


class Language(str, Enum):
    """Enumeration for supported languages."""

    EN = "en"
    VI = "vi"


class ChatSession(Base):
    """Represents a chat session."""

    __tablename__: str = "chat_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    channel: Mapped[str] = mapped_column(String(50), default=Channel.WIDGET.value, nullable=False)
    user_agent: Mapped[str] = mapped_column(String(255), nullable=False, default="unknown")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


__all__ = ["ChatRole", "ChatSession", "Channel", "Language"]
