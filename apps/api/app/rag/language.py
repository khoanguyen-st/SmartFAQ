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
    return bool(
        re.search(
            r"[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợ" r"ùúủũụưừứửữựỳýỷỹỵđ]",
            s,
            re.IGNORECASE,
        )
    )


def _tokenize(s: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9\u00C0-\u017F]+", s.lower())


def detect_language_enhanced(text: str, llm_wrapper=None, async_: bool = False) -> str:
    if not text or not text.strip():
        return "en"

    s = text.lower()

    if re.search(
        r"[àáảãạâầấẩẫậăằắẳẵặ"
        r"èéẻẽẹêềếểễệ"
        r"ìíỉĩị"
        r"òóỏõọôồốổỗộơờớởỡợ"
        r"ùúủũụưừứửữự"
        r"ỳýỷỹỵ"
        r"đ]",
        s,
    ):
        return "vi"

    tokens = re.findall(r"[a-z0-9]+", s)

    # 2. Match từ khóa tiếng Việt không dấu
    vi_keywords = {"hoc", "phi", "nganh", "truong", "sinhvien", "dangky", "tuyensinh"}
    if any(t in vi_keywords for t in tokens):
        return "vi"

    return "en"


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

    if lang == "vi":
        return "vi", txt
    return "en", txt
