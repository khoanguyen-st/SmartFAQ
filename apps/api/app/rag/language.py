from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Optional, Tuple

import fasttext

logger = logging.getLogger(__name__)

LID_MODEL_PATH = Path("app/dataset/lid.176.ftz")
_lid_model = None


def _load_lid_model():
    global _lid_model
    if _lid_model is None:
        try:
            if LID_MODEL_PATH.exists():
                _lid_model = fasttext.load_model(str(LID_MODEL_PATH))
            else:
                logger.warning(f"LID model not found at {LID_MODEL_PATH}")
        except Exception as e:
            logger.error(f"Failed to load LID model: {e}")


def has_vietnamese_accent(text: str) -> bool:
    if not text:
        return False
    vietnamese_chars = r"[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]"
    return bool(re.search(vietnamese_chars, text, re.IGNORECASE))


def detect_language(text: str, llm_wrapper=None, async_: bool = False) -> str:
    if not text or not text.strip():
        return "en"

    clean_text = text.strip()

    if has_vietnamese_accent(clean_text):
        return "vi"

    if _lid_model is None:
        _load_lid_model()

    if _lid_model:
        try:
            lbl, _ = _lid_model.predict(clean_text.replace("\n", " "), k=1)
            if lbl and "__label__vi" in lbl[0]:
                return "vi"
        except Exception:
            pass

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
    lang = detect_language(txt, llm_wrapper=llm_wrapper, async_=async_)
    return lang, txt
