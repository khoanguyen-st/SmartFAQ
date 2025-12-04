"""Query logs schema definitions."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QueryLogItem(BaseModel):
    """Single query log item."""

    id: str
    session_id: str = Field(alias="sessionId")
    question: str
    answer: str | None = None
    confidence: float | None = None
    fallback: bool = False
    lang: str = "en"
    channel: str | None = None
    user_agent: str | None = Field(default=None, alias="userAgent")
    response_ms: int | None = Field(default=None, alias="responseMs")
    feedback: str | None = None
    timestamp: datetime

    model_config = ConfigDict(populate_by_name=True)


class QueryLogsResponse(BaseModel):
    """Paginated query logs response."""

    items: list[QueryLogItem]
    total: int
    page: int
    page_size: int = Field(alias="pageSize")
    total_pages: int = Field(alias="totalPages")

    model_config = ConfigDict(populate_by_name=True)


__all__ = ["QueryLogItem", "QueryLogsResponse"]
