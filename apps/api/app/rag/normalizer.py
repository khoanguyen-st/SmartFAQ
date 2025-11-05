from __future__ import annotations
import json
import re
import logging
import time
from typing import Dict, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from google.api_core import exceptions as google_exceptions
from app.rag.question_understanding import QuestionNormalizer
from app.core.config import settings
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
        MAX_QUESTION_LENGTH = 500
        if len(question) > MAX_QUESTION_LENGTH:
            logger.debug(f"Truncating question from {len(question)} to {MAX_QUESTION_LENGTH} chars")
            question = question[:MAX_QUESTION_LENGTH]
        try:
            ai_normalized = self._normalize_with_ai(question)
            if ai_normalized:
                return ai_normalized
        except google_exceptions.ResourceExhausted as e:
            logger.warning(f"Quota exhausted in normalization: {e}. Using basic cleaning fallback.")
        except Exception as e:
            logger.warning(f"AI-based normalization failed: {e}. Using basic cleaning fallback.")
        return self._normalize_basic_cleaning(question)
    
    def _normalize_with_ai(self, question: str) -> Optional[str]:
        """Normalize question using Gemini AI with retry logic."""
        if not self.ai_llm or not self.ai_parser:
            return None
        max_retries = 3
        base_delay = 1.0
        for attempt in range(max_retries):
            try:
                prompt = self._build_normalization_prompt()
                prompt_template = ChatPromptTemplate.from_messages([
                    ("system", prompt),
                    ("human", "{question}"),
                ])
                chain = prompt_template | self.ai_llm | self.ai_parser
                response = chain.invoke({"question": question})
                response = response.strip()
                if response.startswith("```json"):
                    response = response[7:]
                if response.startswith("```"):
                    response = response[3:]
                if response.endswith("```"):
                    response = response[:-3]
                response = response.strip()
                try:
                    result = json.loads(response)
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON response: {response[:200]}. Error: {e}")
                    # Try to extract JSON from response
                    json_match = re.search(r'\{[^{}]*\}', response, re.DOTALL)
                    if json_match:
                        result = json.loads(json_match.group())
                    else:
                        raise
                normalized_text = result.get("normalized_text", "").strip()
                if not normalized_text:
                    return None
                return normalized_text
            except google_exceptions.ResourceExhausted as e:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    logger.warning(f"Quota exhausted, retrying in {delay}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(delay)
                    continue
                else:
                    logger.error(f"Quota exhausted after {max_retries} attempts: {e}")
                    return None
            except Exception as e:
                logger.error(f"AI normalization error (attempt {attempt + 1}/{max_retries}): {e}", exc_info=True)
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    time.sleep(delay)
                    continue
                else:
                    return None
        return None
    
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
        return """Đây là hệ thống FAQ của trường Greenwich University Việt Nam.

This is the FAQ system of Greenwich University Vietnam.

Nhiệm vụ / Task: Normalize câu hỏi của người dùng bằng cách:
- Sửa lỗi chính tả (spell correction)
- Mở rộng từ viết tắt (expand abbreviations)
- Chuẩn hóa từ đồng nghĩa (normalize synonyms)
- Giữ nguyên ý nghĩa và ngôn ngữ gốc

QUAN TRỌNG / IMPORTANT:
- Tự động detect ngôn ngữ của user input (tiếng Việt có dấu, không dấu, hoặc tiếng Anh)
- Automatically detect the language of user input (Vietnamese with/without diacritics, or English)
- Nếu user input là tiếng Việt (có dấu hoặc không dấu) → normalize và trả về bằng tiếng Việt (có dấu)
- If user input is Vietnamese (with or without diacritics) → normalize and return in Vietnamese (with diacritics)
- Nếu user input là tiếng Anh → normalize và trả về bằng tiếng Anh
- If user input is English → normalize and return in English
- Giữ nguyên capitalization và punctuation
- Preserve capitalization and punctuation

Ví dụ / Examples:
- Input: "admision process" → Output: "admission process"
- Input: "ielts req" → Output: "IELTS requirement"
- Input: "Lam sao de dang ky?" (không dấu) → Output: "Làm sao để đăng ký?" (có dấu)
- Input: "hoc phi bao nhieu?" (không dấu) → Output: "Học phí bao nhiêu?" (có dấu)

Hãy trả về response theo đúng chuẩn JSON sau, KHÔNG trả thêm bất kì text nào khác / Return response in the following JSON format exactly, DO NOT add any other text:

{
  "normalized_text": "normalized question here",
  "language": "vi" (nếu tiếng Việt) hoặc "en" (nếu tiếng Anh)
}"""
    
    def get_spell_corrections(self) -> Dict[str, str]:
        """Return empty dictionary as AI now handles spell correction."""
        return {}
    
    def get_abbreviations(self) -> Dict[str, str]:
        """Return empty dictionary as AI now handles abbreviation expansion."""
        return {}
    
    def get_synonyms(self) -> Dict[str, str]:
        """Return empty dictionary as AI now handles synonym normalization."""
        return {}