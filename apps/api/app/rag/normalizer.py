from __future__ import annotations

import logging
import re
import unicodedata
from typing import Any, Dict, Optional

from app.rag.language import detect_language
from app.rag.llm import LLMWrapper
from app.rag.prompts import get_normalization_prompt

logger = logging.getLogger(__name__)


def remove_accents(s: str) -> str:
    if not s:
        return ""
    nfkd = unicodedata.normalize("NFKD", s)
    return "".join([c for c in nfkd if not unicodedata.combining(c)]).lower()


class SmartNormalizer:
    def __init__(self, llm_wrapper: LLMWrapper):
        self.llm_wrapper = llm_wrapper
        self.cache: Dict[str, Dict[str, Any]] = {}

        self.abbrev_map = {
            "cntt": "công nghệ thông tin",
            "qtkd": "quản trị kinh doanh",
            "ctsv": "công tác sinh viên",
            "ts": "tuyển sinh",
            "sv": "sinh viên",
            "gv": "giảng viên",
            "dh": "đại học",
            "hs": "hồ sơ",
            "nv": "ngành nghề",
            "cn": "chuyên ngành",
        }

        # Common typos and variations
        self.typo_map = {
            "nganh": "ngành",
            "nghành": "ngành",
            "hoc": "học",
            "phi": "phí",
            "truong": "trường",
            "sinh vien": "sinh viên",
            "giang vien": "giảng viên",
            "thoi hoc": "thôi học",
            "bao luu": "bảo lưu",
            "hoc bong": "học bổng",
            "dang ky": "đăng ký",
        }

    def _capitalize_first_char(self, text: str) -> str:
        if not text:
            return ""
        t = text.strip()
        if not t:
            return ""
        return t[0].upper() + t[1:]

    def _cache_get(self, text: str) -> Optional[Dict[str, Any]]:
        key = text.strip().lower()
        return self.cache.get(key)

    def _cache_set(self, text: str, result: Dict[str, Any]) -> None:
        key = text.strip().lower()
        self.cache[key] = result

    def _rule_based(self, text: str) -> Dict[str, Any]:
        det = detect_language(text)
        lang = det if isinstance(det, str) else "other"

        t = text.strip().lower()
        cleaned = re.sub(r"\s+", " ", t)

        # Fix common typos first
        for typo, correct in self.typo_map.items():
            cleaned = cleaned.replace(typo, correct)

        tokens = cleaned.split()
        changed = False
        expanded_tokens = []

        for tok in tokens:
            raw = remove_accents(tok)
            if raw in self.abbrev_map:
                expanded_tokens.append(self.abbrev_map[raw])
                changed = True
            else:
                expanded_tokens.append(tok)

        result_raw = " ".join(expanded_tokens).strip()
        result = self._capitalize_first_char(result_raw)

        return {
            "normalized_text": result,
            "language": lang,
            "changed": changed or (result_raw != t),
        }

    def _need_llm(self, text: str, rule_output: Dict[str, Any]) -> bool:
        if not text or not text.strip():
            return False

        if rule_output["changed"]:
            return False

        if rule_output["language"] == "vi" and remove_accents(text) != text.lower():
            return False

        return True

    async def _llm_normalize(self, text: str) -> Dict[str, Any]:
        try:
            prompt = get_normalization_prompt()
            data = await self.llm_wrapper.invoke_json(prompt, text)

            if isinstance(data, dict) and "normalized_text" in data:
                return {
                    "normalized_text": self._capitalize_first_char(
                        data.get("normalized_text", text)
                    ),
                    "language": data.get("language", "en"),
                }

            logger.warning(f"LLM Normalize JSON Invalid: {data}")
            return {"normalized_text": text, "language": "en"}

        except Exception as e:
            logger.error(f"LLM Normalize Failed: {e}")
            return {"normalized_text": text, "language": "en"}

    async def understand(self, question: str) -> Dict[str, Any]:
        clean_q = self._capitalize_first_char(question)

        cached = self._cache_get(clean_q)
        if cached:
            return cached

        rule_res = self._rule_based(clean_q)

        if self._need_llm(clean_q, rule_res):
            logger.info(f"Normalizer: Calling LLM for '{clean_q}'")
            llm_res = await self._llm_normalize(clean_q)
            final = llm_res
        else:
            final = {
                "normalized_text": rule_res["normalized_text"],
                "language": rule_res["language"],
            }

        self._cache_set(clean_q, final)
        return final


UnifiedNormalizer = SmartNormalizer
