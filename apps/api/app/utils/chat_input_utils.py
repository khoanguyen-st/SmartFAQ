"""Input helpers for chat endpoints."""

from __future__ import annotations

from ..constants.chat import CHANNEL_CANONICAL, LANGUAGE_CANONICAL
from ..models.chat import Channel
from ..rag.utils.language import detect_language_simple, normalize_language_code


def coerce_language(preferred: str | None, fallback_question: str) -> str:
    """Return supported language code (en|vi)."""
    if preferred:
        normalized = normalize_language_code(preferred, default="en")
    else:
        detected = detect_language_simple(fallback_question or "")
        normalized = "vi" if detected == "vi" else "en"
    return normalized if normalized in LANGUAGE_CANONICAL else "en"


def validate_language_input(value: str | None) -> str | None:
    """Validate language against accepted set."""
    if value is None:
        return None
    normalized = value.strip().lower()
    if normalized not in LANGUAGE_CANONICAL:
        raise ValueError(f"language must be one of {sorted(LANGUAGE_CANONICAL)}")
    return normalized


def coerce_channel(value: str | None) -> str:
    """Normalize channel input to canonical values; default to widget."""
    if not value:
        return Channel.WIDGET.value
    candidate = value.strip().lower()
    return candidate if candidate in CHANNEL_CANONICAL else Channel.WIDGET.value


def validate_channel_input(value: str | None) -> str | None:
    """Validate channel against accepted set and normalize."""
    if value is None:
        return None
    normalized = value.strip().lower()
    if normalized not in CHANNEL_CANONICAL:
        raise ValueError(f"channel must be one of {sorted(CHANNEL_CANONICAL)}")
    return coerce_channel(value)


__all__ = [
    "coerce_language",
    "validate_language_input",
    "coerce_channel",
    "validate_channel_input",
]
