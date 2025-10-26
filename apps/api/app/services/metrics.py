"""Metrics aggregation stubs."""

from typing import Any


async def get_dashboard_metrics() -> dict[str, Any]:
    return {
        "total_questions": {"day": 0, "week": 0, "month": 0},
        "avg_response_time_ms": 0,
        "fallback_rate": 0.0,
        "satisfaction_rate": 0.0,
        "active_documents": 0,
    }


async def get_query_logs() -> list[dict[str, Any]]:
    return []
