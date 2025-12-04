"""Input helpers for chat endpoints."""

from __future__ import annotations

from ..constants.chat import CHANNEL_CANONICAL, LANGUAGE_CANONICAL
from ..models.chat import Channel


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
    "validate_language_input",
    "coerce_channel",
    "validate_channel_input",
]
