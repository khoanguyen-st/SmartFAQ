"""Shared input validation helpers for user-provided content."""

from __future__ import annotations

import re
from typing import Iterable

_HTML_PATTERN = re.compile(
    r"<\/?script|<\/?iframe|javascript:\s*|onerror\s*=|onload\s*=|onfocus\s*=", re.IGNORECASE
)
_PROMPT_INJECTION_PHRASES: tuple[str, ...] = (
    "ignore all previous instructions",
    "disregard the above",
    "override your guidelines",
    "forget prior rules",
)


class UnsafeInputError(ValueError):
    """Raised when user input contains potentially malicious content."""


def _contains_phrase(value: str, phrases: Iterable[str]) -> bool:
    lowered = value.casefold()
    return any(phrase in lowered for phrase in phrases)


def ensure_safe_text(value: str, *, field_name: str = "input", max_length: int = 4096) -> str:
    """Validate user supplied text to mitigate simple XSS and prompt-injection attempts.

    The function trims leading/trailing whitespace, enforces a maximum length, and rejects
    payloads that include suspicious HTML/JS constructs or common prompt-injection phrases.

    Args:
        value: The raw user supplied text.
        field_name: Field identifier for error messaging.
        max_length: Maximum accepted length after trimming.

    Returns:
        The sanitized and trimmed text.

    Raises:
        UnsafeInputError: If the text appears malicious.
    """

    trimmed = value.strip()
    if not trimmed:
        return trimmed

    if len(trimmed) > max_length:
        trimmed = trimmed[:max_length]

    if _HTML_PATTERN.search(trimmed) or _contains_phrase(trimmed, _PROMPT_INJECTION_PHRASES):
        raise UnsafeInputError(f"{field_name} contains disallowed content.")

    return trimmed
