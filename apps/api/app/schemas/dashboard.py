"""Dashboard schema definitions."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DashboardMetrics(BaseModel):
    """KPI metrics for dashboard."""

    questions_today: int
    avg_response_time_ms: int
    fallback_rate: float
    active_documents: int

    model_config = ConfigDict(populate_by_name=True)


class TrendDataPoint(BaseModel):
    """Single data point for trends chart."""

    period: str
    questions: int
    avg_confidence: float | None = None
    fallback_count: int = 0

    model_config = ConfigDict(populate_by_name=True)


class TrendsResponse(BaseModel):
    """Weekly trends data."""

    data: list[TrendDataPoint]

    model_config = ConfigDict(populate_by_name=True)


class UnansweredQuestion(BaseModel):
    """Unanswered question item."""

    id: int
    question: str
    reason: str
    channel: str | None = None
    created_at: datetime = Field(alias="createdAt")
    status: str = "In Progress"  # Could be extended to track resolution

    model_config = ConfigDict(populate_by_name=True)


class UnansweredQuestionsResponse(BaseModel):
    """List of unanswered questions."""

    items: list[UnansweredQuestion]
    total: int

    model_config = ConfigDict(populate_by_name=True)


__all__ = [
    "DashboardMetrics",
    "TrendDataPoint",
    "TrendsResponse",
    "UnansweredQuestion",
    "UnansweredQuestionsResponse",
]
