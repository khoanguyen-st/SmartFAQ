from __future__ import annotations
import logging
import time
import re
import unicodedata
from collections import defaultdict
from typing import Dict, Optional

from app.core.config import settings
from app.rag.llm import LLMWrapper
from app.rag.retriever import Retriever
from app.rag.language import detect_language_enhanced
from app.rag.guardrail import GuardrailService
from app.rag.types import BLACKLIST_KEYWORDS

try:
    from app.rag.normalizer import UnifiedNormalizer
except Exception:
    UnifiedNormalizer = None

logger = logging.getLogger("app.rag.orchestrator")


def remove_accents(s: str) -> str:
    if not s:
        return ""
    nfkd = unicodedata.normalize("NFKD", s)
    return "".join([c for c in nfkd if not unicodedata.combining(c)]).lower()


def normalize_lang_code(code: str) -> str:
    if not code:
        return "other"
    c = code.strip().lower()
    if c.startswith("vi"):
        return "vi"
    if c.startswith("en"):
        return "en"
    return "other"


class RAGOrchestrator:
    def __init__(self, retriever: Optional[Retriever] = None, llm_wrapper: Optional[LLMWrapper] = None):
        self.retriever = retriever or Retriever()
        self.llm_wrapper = llm_wrapper or LLMWrapper()
        self.guardrail = GuardrailService(self.llm_wrapper)

        try:
            self.normalizer = UnifiedNormalizer(self.llm_wrapper) if UnifiedNormalizer else None
        except Exception as e:
            logger.error(f"FAILED to init UnifiedNormalizer: {e}")
            self.normalizer = None

        self._session_contexts: Dict[str, Dict[str, str]] = defaultdict(dict)

    def _capitalize_input(self, text: str) -> str:
        if not text:
            return ""
        t = text.strip()
        return t[0].upper() + t[1:] if t else ""

    async def query(self, question: str, top_k: int = 5):
        t0 = time.time()

        question = self._capitalize_input(question)
        logger.debug(f"[STEP 1] Capitalized input = {question!r}")

        try:
            det = detect_language_enhanced(question, llm_wrapper=self.llm_wrapper)
            logger.debug(f"[STEP 2] detect_language_enhanced result = {det}")
        except Exception as e:
            logger.error(f"[ERROR] detect_language_enhanced failed: {e}")
            det = "other"

        lang_code = det[0] if isinstance(det, (tuple, list)) else det
        detected_lang = normalize_lang_code(lang_code)
        logger.debug(f"[STEP 2] normalized language = {detected_lang}")

        if detected_lang == "other":
            logger.info("[LANGUAGE] Unsupported language -> fallback")
            return {
                "answer": "Please input Vietnamese or English",
                "confidence": 0.0,
                "sources": [],
                "fallback_triggered": True,
                "latency_ms": int((time.time() - t0) * 1000),
            }

        is_vi = detected_lang == "vi"
        fallback_txt = "Tôi không tìm thấy thông tin." if is_vi else "I could not find information."

        if re.search(r"\b(tôi là ai|nhà tôi|tên tôi|người yêu tôi|who am i|my name|my house)\b", question.lower()):
            logger.debug("[STEP 3] Personal question detected -> fallback")
            return {
                "answer": fallback_txt,
                "confidence": 0.0,
                "sources": [],
                "fallback_triggered": True,
                "latency_ms": int((time.time() - t0) * 1000),
                "intent": "personal_question",
            }

        raw_noacc = remove_accents(question)
        logger.debug(f"[STEP 4] remove_accents = {raw_noacc}")
        for kw in BLACKLIST_KEYWORDS:
            if kw in raw_noacc:
                logger.info(f"[STEP 4] Fast blacklist matched keyword = {kw}")
                msg = "Xin lỗi, tôi chỉ hỗ trợ thông tin về Greenwich." if is_vi else "I only support info about Greenwich."
                return {
                    "answer": msg,
                    "confidence": 1.0,
                    "sources": [],
                    "fallback_triggered": False,
                    "latency_ms": int((time.time() - t0) * 1000),
                    "intent": "out_of_scope",
                }

        logger.debug("[STEP 5] Running guardrail...")
        gr = await self.guardrail.check_safety(question)
        logger.debug(f"[STEP 5] Guardrail result = {gr}")
        if gr.get("status") == "blocked":
            msg = gr["vi"] if is_vi else gr["en"]
            logger.info("[STEP 5] Guardrail blocked -> returning")
            return {
                "answer": msg,
                "confidence": 1.0,
                "sources": [],
                "fallback_triggered": False,
                "latency_ms": int((time.time() - t0) * 1000),
                "intent": "blocked",
            }

        if self.normalizer:
            try:
                logger.debug("[STEP 6] Calling SmartNormalizer...")
                norm_res = await self.normalizer.understand(question)
                logger.debug(f"[STEP 6] SmartNormalizer result = {norm_res}")
                normalized_q = norm_res.get("normalized_text", question)
            except Exception as e:
                logger.error(f"[STEP 6] Normalizer failed: {e}")
                normalized_q = question
        else:
            normalized_q = question
            logger.debug("[STEP 6] No SmartNormalizer available.")

        logger.info(f"[NORMALIZED QUERY] = {normalized_q!r}")

        clean_normalized = remove_accents(normalized_q)
        logger.debug(f"[STEP 7] normalized no-accents = {clean_normalized}")
        for kw in BLACKLIST_KEYWORDS:
            if kw in clean_normalized:
                logger.info(f"[STEP 7] Deep blacklist matched = {kw}")
                msg = "Xin lỗi, tôi chỉ hỗ trợ thông tin về Greenwich." if is_vi else "I only support info about Greenwich."
                return {
                    "answer": msg,
                    "confidence": 1.0,
                    "sources": [],
                    "fallback_triggered": False,
                    "latency_ms": int((time.time() - t0) * 1000),
                    "intent": "out_of_scope",
                }

        if re.search(r"\b(hi|hello|hey|chao|xin chao)\b", clean_normalized):
            logger.info("[STEP 8] Greeting intent detected")
            if is_vi:
                return {
                    "answer": "Chào bạn! Tôi là trợ lý ảo của Đại học Greenwich Việt Nam. Tôi có thể giúp gì cho bạn?",
                    "confidence": 1.0,
                    "sources": [],
                    "fallback_triggered": False,
                    "latency_ms": int((time.time() - t0) * 1000),
                }
            return {
                "answer": "Hi! I am the AI assistant of Greenwich Vietnam. How can I help you?",
                "confidence": 1.0,
                "sources": [],
                "fallback_triggered": False,
                "latency_ms": int((time.time() - t0) * 1000),
            }

        logger.debug("[STEP 9] Calling retriever...")
        try:
            contexts = self.retriever.retrieve(normalized_q, top_k=top_k, with_score=True)
            logger.debug(f"[STEP 9] Retriever contexts = {contexts}")
        except Exception as e:
            logger.error(f"[STEP 9] Retriever ERROR: {e}")
            return {
                "answer": "System Error",
                "confidence": 0.0,
                "sources": [],
                "fallback_triggered": True,
                "latency_ms": int((time.time() - t0) * 1000),
            }

        if not contexts:
            logger.info("[STEP 9] Retriever returned EMPTY -> fallback")
            return {
                "answer": fallback_txt,
                "confidence": 0.0,
                "sources": [],
                "fallback_triggered": True,
                "latency_ms": int((time.time() - t0) * 1000),
            }

        conf = self.retriever.calculate_confidence(contexts)
        logger.info(f"[CONFIDENCE] = {conf}")

        if conf >= float(getattr(settings, "CONFIDENCE_THRESHOLD", 0.65)):
            logger.debug("[STEP 11] Calling LLM generate_answer_async...")
            ans = await self.llm_wrapper.generate_answer_async(
                normalized_q,
                contexts,
                target_language=("vi" if is_vi else "en"),
            )

            if any(x in ans.lower() for x in ["không tìm", "could not", "no information"]):
                logger.info("[LLM] Answer indicates NO INFORMATION → fallback")
                return {
                    "answer": fallback_txt,
                    "confidence": 0.0,
                    "sources": [],
                    "fallback_triggered": True,
                    "latency_ms": int((time.time() - t0) * 1000),
                }

            srcs = [{"source": c["metadata"].get("source"), "page": c["metadata"].get("page")} for c in contexts]
            return {
                "answer": ans,
                "confidence": round(conf, 4),
                "sources": srcs,
                "fallback_triggered": False,
                "latency_ms": int((time.time() - t0) * 1000),
            }

        logger.info("[STEP 12] Confidence too low → fallback")
        return {
            "answer": fallback_txt,
            "confidence": round(conf, 4),
            "sources": [],
            "fallback_triggered": True,
            "latency_ms": int((time.time() - t0) * 1000),
        }
