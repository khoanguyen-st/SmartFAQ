from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from ..constants.chat import FeedbackStatus
from ..core.input_validation import UnsafeInputError, ensure_safe_text
from ..utils.chat_input_utils import validate_channel_input


class ChatQuery(BaseModel):
    question: str = Field(..., min_length=1, max_length=1024)
    language: str | None = Field(default=None, max_length=10)
    session_id: str | None = Field(default=None, alias="sessionId")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("question")
    @classmethod
    def _validate_question(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("question must not be empty")
        try:
            return ensure_safe_text(stripped, field_name="question", max_length=1024)
        except UnsafeInputError as exc:
            raise ValueError(str(exc)) from exc


class ChatSource(BaseModel):
    title: str
    chunk_id: str | None = Field(default=None, alias="chunkId")
    relevance: float | None = None

    model_config = ConfigDict(populate_by_name=True)


class ChatQueryResponse(BaseModel):
    answer: str
    sources: list[ChatSource]
    confidence: int
    language: str
    fallback: bool
    chat_id: str = Field(alias="chatId")

    model_config = ConfigDict(populate_by_name=True)


class NewSessionRequest(BaseModel):
    user_agent: str | None = Field(default=None, alias="userAgent", max_length=255)
    language: str | None = Field(default=None, max_length=10)
    channel: str | None = Field(default=None, max_length=50)

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, value: str | None) -> str | None:
        return validate_channel_input(value) if value is not None else None

    @field_validator("language")
    @classmethod
    def validate_language(cls, value: str | None) -> str | None:
        return value


class NewSessionResponse(BaseModel):
    sessionId: str
    message: str


class FeedbackRequest(BaseModel):
    chat_id: str = Field(..., alias="chatId")
    session_id: str = Field(..., alias="sessionId")
    feedback: FeedbackStatus

    model_config = ConfigDict(populate_by_name=True)


class FeedbackResponse(BaseModel):
    status: str
    message: str


class ChatHistoryMessage(BaseModel):
    role: str
    text: str
    timestamp: datetime
    chat_id: str | None = Field(default=None, alias="chatId")
    confidence: int | None = None
    fallback: bool | None = None

    model_config = ConfigDict(populate_by_name=True)


class ChatHistoryResponse(BaseModel):
    sessionId: str
    messages: list[ChatHistoryMessage]


class ChatSourcesResponse(BaseModel):
    chat_id: str = Field(alias="chatId")
    sources: list[ChatSource]

    model_config = ConfigDict(populate_by_name=True)


class ChatConfidenceResponse(BaseModel):
    chat_id: str = Field(alias="chatId")
    confidence: int
    threshold: int
    fallback_triggered: bool = Field(alias="fallbackTriggered")

    model_config = ConfigDict(populate_by_name=True)


__all__ = [
    "ChatQuery",
    "ChatSource",
    "ChatQueryResponse",
    "NewSessionRequest",
    "NewSessionResponse",
    "FeedbackStatus",
    "FeedbackRequest",
    "FeedbackResponse",
    "ChatHistoryMessage",
    "ChatHistoryResponse",
    "ChatSourcesResponse",
    "ChatConfidenceResponse",
]
