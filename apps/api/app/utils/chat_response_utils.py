"""Formatting helpers for chat responses and persistence."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from ..schemas.chat import ChatSource


def confidence_to_percent(value: float | Decimal | None) -> int:
    if value is None:
        return 0
    numeric = float(value)
    if numeric <= 1.0:
        numeric *= 100.0
    return int(round(numeric))


def format_sources(sources: list[dict[str, Any]] | None) -> list[ChatSource]:
    formatted: list[ChatSource] = []
    for src in sources or []:
        relevance_raw = src.get("score")
        if relevance_raw is None:
            relevance_raw = src.get("relevance")
        chunk_id = src.get("chunk_id") or src.get("chunkId")

        title = (
            src.get("title")
            or src.get("docTitle")
            or src.get("source")
            or src.get("document_id")
            or src.get("docId")
            or "Unknown source"
        )

        formatted.append(
            ChatSource(
                title=title,
                chunkId=chunk_id,
                relevance=float(relevance_raw) if relevance_raw is not None else None,
            )
        )
    return formatted


def persistable_sources(sources: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    persisted: list[dict[str, Any]] = []
    for src in sources or []:
        relevance_raw = src.get("relevance")
        if relevance_raw is None:
            relevance_raw = src.get("score")
        title = (
            src.get("docTitle")
            or src.get("source")
            or src.get("title")
            or src.get("document_id")
            or src.get("docId")
            or "Unknown source"
        )
        persisted.append(
            {
                "docId": src.get("docId") or src.get("document_id") or src.get("documentId"),
                "docTitle": title,
                "chunkId": src.get("chunkId") or src.get("chunk_id"),
                "relevance": float(relevance_raw) if relevance_raw is not None else None,
            }
        )
    return persisted


def timestamp_to_iso(dt: datetime | None) -> str:
    if not dt:
        dt = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat(timespec="seconds").replace("+00:00", "Z")


def safe_int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


__all__ = [
    "confidence_to_percent",
    "format_sources",
    "persistable_sources",
    "timestamp_to_iso",
    "safe_int",
]
