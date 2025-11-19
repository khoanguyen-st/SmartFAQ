"""Language helpers."""

from __future__ import annotations

LANGUAGE_ALIASES: dict[str, str] = {
    "en": "en",
    "eng": "en",
    "english": "en",
    "us": "en",
    "vi": "vi",
    "vie": "vi",
    "vietnamese": "vi",
    "vn": "vi",
}


def normalize_language_code(value: str | None, *, default: str = "auto") -> str:
    """
    Normalize raw language input to a short code.

    Returns one of:
    - "en": English
    - "vi": Vietnamese
    - default (defaults to "auto") if unrecognized/empty
    """
    if value is None:
        return default

    code = value.strip().lower()
    if not code:
        return default

    if code in LANGUAGE_ALIASES:
        return LANGUAGE_ALIASES[code]

    if code.startswith("en"):
        return "en"
    if code.startswith("vi"):
        return "vi"

    return default


__all__ = ["normalize_language_code"]
