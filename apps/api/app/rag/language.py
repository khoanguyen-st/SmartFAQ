from __future__ import annotations

import logging
import re
from typing import Optional, Tuple

logging.getLogger("app.rag.language").setLevel(logging.DEBUG)

_vi_common_words = {
    "la",
    "toi",
    "ban",
    "anh",
    "chi",
    "em",
    "cai",
    "con",
    "mot",
    "hai",
    "ba",
    "muon",
    "khong",
    "co",
    "duoc",
    "nguoi",
    "hoc",
    "truong",
    "day",
    "nay",
    "hoi",
    "cho",
    "lam",
    "ve",
    "ai",
    "may",
    "chao",
    "xin",
    "cam",
    "on",
    "duong",
    "dang",
    "viet",
    "ngon",
    "ngu",
    "nam",
}

_en_common_words = {
    "the",
    "is",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "a",
    "an",
    "and",
    "or",
    "not",
    "to",
    "of",
    "in",
    "on",
    "for",
    "with",
    "that",
    "this",
    "there",
    "here",
    "hello",
    "who",
    "what",
    "where",
}


def _has_diacritics(s: str) -> bool:
    """Check if string contains Vietnamese diacritics."""
    return bool(
        re.search(
            r"[àáảãạâầấẩẫậăằắẳẵặ"
            r"èéẻẽẹêềếểễệ"
            r"ìíỉĩị"
            r"òóỏõọôồốổỗộơờớởỡợ"
            r"ùúủũụưừứửữự"
            r"ỳýỷỹỵ"
            r"đ]",
            s,
            re.IGNORECASE,
        )
    )


def _tokenize(s: str) -> list[str]:
    """Tokenize keeping Vietnamese Unicode."""
    return re.findall(r"[a-zA-Z0-9\u00C0-\u017F]+", s.lower())


VI_KEYWORDS_SINGLE = {"hoc", "phi", "nganh", "truong", "sinhvien", "dangky", "tuyensinh", "cntt"}

VI_KEYWORDS_PHRASES = [
    ["cong", "nghe", "thong", "tin"],
]


def _detect_vi_no_accent(tokens: list[str]) -> bool:
    if any(tok in VI_KEYWORDS_SINGLE for tok in tokens):
        return True

    for phrase in VI_KEYWORDS_PHRASES:
        n = len(phrase)
        for i in range(len(tokens) - n + 1):
            if tokens[i : i + n] == phrase:
                return True

    return False


def _is_likely_english(tokens: list[str]) -> bool:
    """Heuristic đơn giản nhận diện tiếng Anh."""
    if not tokens:
        return False

    if not any(tok in _en_common_words for tok in tokens):
        return False

    ascii_tokens = sum(1 for t in tokens if re.fullmatch(r"[a-z0-9]+", t))
    ratio = ascii_tokens / len(tokens)
    return ratio >= 0.8


def detect_language_enhanced(text: str, llm_wrapper=None, async_: bool = False) -> str:
    if not text or not text.strip():
        return "en"
    s = text.lower()
    if _has_diacritics(s):
        return "vi"
    tokens = _tokenize(s)
    if _detect_vi_no_accent(tokens):
        return "vi"
    if _is_likely_english(tokens):
        return "en"
    return "unsupported"


def normalize_text(
    text: str,
    llm_wrapper: Optional[object] = None,
    force_restore: bool = False,
    async_: bool = False,
) -> Tuple[str, str]:
    if text is None:
        return "en", ""

    txt = text.strip()
    lang = detect_language_enhanced(txt, llm_wrapper=llm_wrapper, async_=async_)

    return lang, txt
