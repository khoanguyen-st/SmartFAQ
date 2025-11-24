from __future__ import annotations

from typing import Optional

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


def normalize_language_code(value: Optional[str], *, default: str = "auto") -> str:
    """
    Normalize a user-provided language string into a canonical code.

    Returns:
        "vi", "en", or "auto" (if unknown and default is "auto")
    """
    if not value:
        return default
    v = value.strip().lower()
    if not v:
        return default
    if v in LANGUAGE_ALIASES:
        return LANGUAGE_ALIASES[v]
    if "-" in v:
        prefix = v.split("-", 1)[0]
        if prefix in LANGUAGE_ALIASES:
            return LANGUAGE_ALIASES[prefix]
    return default


VIETNAMESE_DIACRITIC_CHARS = set(
    "ắằẳẵặấầẩẫậáàảãạéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ"
)


def detect_language_simple(text: Optional[str]) -> str:
    if not text:
        return "en"
    t = text.strip().lower()
    if not t:
        return "en"
    for ch in t:
        if ch in VIETNAMESE_DIACRITIC_CHARS:
            return "vi"
    return "en"


__all__ = ["normalize_language_code", "detect_language_simple"]
