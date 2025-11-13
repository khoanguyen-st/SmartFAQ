from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import settings
from app.rag.constants import SUPPORTED_INTENTS
from app.rag.prompts import get_intent_detection_prompt
from app.rag.question_understanding import IntentDetector
from app.rag.utils.llm_json import invoke_json_llm
from app.rag.validations import Intent

logger = logging.getLogger(__name__)


class RuleBasedIntentDetector(IntentDetector):
    def __init__(self):
        try:
            self.ai_llm = ChatGoogleGenerativeAI(
                model=settings.LLM_MODEL,
                temperature=0.1,
                max_output_tokens=512,
                google_api_key=settings.GOOGLE_API_KEY,
            )
            self.ai_parser = StrOutputParser()
        except Exception as e:
            logger.warning(f"Failed to initialize AI components: {e}. Will use fallback only.")
            self.ai_llm = None
            self.ai_parser = None

    def detect(self, question: str, context: Optional[Dict[str, Any]] = None) -> Intent:
        if not question or not question.strip():
            logger.debug("Empty question received in intent detector")
            return Intent(
                label="other",
                confidence=0.0,
                metadata={"reason": "empty_question"},
            )
        if len(question) > 500:
            logger.warning(f"Question too long for intent detection: {len(question)} chars")
            question = question[:500]
        ai_intent = self._detect_with_ai(question)
        if ai_intent:
            return ai_intent
        logger.warning("AI-based intent detection failed. Falling back to simple fallback.")

        return Intent(
            label="other",
            confidence=0.3,
            metadata={
                "reason": "ai_detection_failed",
                "method": "fallback",
            },
        )

    def _detect_with_ai(self, question: str) -> Optional[Intent]:
        """Detect intent using Gemini AI with retry logic."""
        prompt = self._build_unified_prompt()
        result = invoke_json_llm(
            self.ai_llm,
            self.ai_parser,
            system_prompt=prompt,
            question=question,
            logger=logger,
            log_ctx="Intent detection",
        )
        if not result:
            return None

        intent_label = result.get("intent", "other")
        if intent_label not in SUPPORTED_INTENTS:
            intent_label = "other"

        confidence_raw = result.get("confidence", 0.5)
        try:
            confidence = float(confidence_raw)
        except (TypeError, ValueError):
            logger.debug("Invalid confidence value returned: %s", confidence_raw)
            confidence = 0.5
        confidence = max(0.0, min(1.0, confidence))

        metadata = {
            "reasoning": result.get("reasoning", ""),
            "is_in_domain": result.get("is_in_domain", True),
            "language": result.get("language", "en"),
            "method": "ai_based",
        }
        return Intent(
            label=intent_label,
            confidence=round(confidence, 3),
            metadata=metadata,
        )

    def _build_unified_prompt(self) -> str:
        """Build unified system prompt that handles both Vietnamese and English."""
        return get_intent_detection_prompt()

    def get_available_intents(self) -> List[str]:
        return SUPPORTED_INTENTS
