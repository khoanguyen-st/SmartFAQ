from __future__ import annotations

import logging
import re
from typing import Dict, Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import StrOutputParser
from google.api_core import exceptions as google_exceptions

from app.core.config import settings
from app.rag.prompts import get_normalization_prompt
from app.rag.constants import MAX_NORMALIZER_INPUT_LENGTH
from app.rag.question_understanding import QuestionNormalizer
from app.rag.utils.llm_json import invoke_json_llm
logger = logging.getLogger(__name__)

class RuleBasedNormalizer(QuestionNormalizer):
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
    
    def normalize(self, question: str) -> str:
        if not question:
            return ""
        if not question.strip():
            return ""
        if len(question) > MAX_NORMALIZER_INPUT_LENGTH:
            logger.debug(
                "Truncating question from %s to %s chars",
                len(question),
                MAX_NORMALIZER_INPUT_LENGTH,
            )
            question = question[:MAX_NORMALIZER_INPUT_LENGTH]
        ai_normalized: Optional[str] = None
        try:
            ai_normalized = self._normalize_with_ai(question)
        except google_exceptions.ResourceExhausted as exc:
            logger.warning("Quota exhausted in normalization: %s. Using basic cleaning fallback.", exc)
        except Exception as exc:  # noqa: BLE001
            logger.warning("AI-based normalization failed: %s. Using basic cleaning fallback.", exc)
        if ai_normalized:
            return ai_normalized
        logger.warning("AI-based normalization failed. Using basic cleaning fallback.")
        return self._normalize_basic_cleaning(question)
    
    def _normalize_with_ai(self, question: str) -> Optional[str]:
        """Normalize question using Gemini AI with retry logic."""
        prompt = self._build_normalization_prompt()
        result = invoke_json_llm(
            self.ai_llm,
            self.ai_parser,
            system_prompt=prompt,
            question=question,
            logger=logger,
            log_ctx="Normalization",
        )
        if not result:
            return None
        normalized_text = result.get("normalized_text", "")
        if not isinstance(normalized_text, str):
            logger.debug("Invalid normalized_text type: %s", type(normalized_text))
            return None
        normalized_text = normalized_text.strip()
        if not normalized_text:
            return None
        return normalized_text
    
    def _normalize_basic_cleaning(self, question: str) -> str:
        """Minimal fallback: chỉ làm basic text cleaning khi AI fails."""
        try:
            normalized = question.strip()
            normalized = re.sub(r'\s+', ' ', normalized)
            trailing_punct = ""
            if normalized.endswith(('?', '!')):
                trailing_punct = normalized[-1]
                normalized = normalized[:-1]
            normalized = normalized.strip('.,;:')
            if trailing_punct:
                normalized = normalized + trailing_punct
            normalized = re.sub(r'\s+', ' ', normalized).strip()
            if trailing_punct and not normalized.endswith(trailing_punct):
                normalized = normalized + trailing_punct
            if question and question[0].isupper():
                normalized = normalized.capitalize()
            return normalized
        except Exception as e:
            logger.error(f"Basic cleaning error: {e}", exc_info=True)
            return question.strip()

    def _build_normalization_prompt(self) -> str:
        """Build prompt for AI-based normalization."""
        return get_normalization_prompt()
    
    def get_spell_corrections(self) -> Dict[str, str]:
        """Return empty dictionary as AI now handles spell correction."""
        return {}
    
    def get_abbreviations(self) -> Dict[str, str]:
        """Return empty dictionary as AI now handles abbreviation expansion."""
        return {}
    
    def get_synonyms(self) -> Dict[str, str]:
        """Return empty dictionary as AI now handles synonym normalization."""
        return {}