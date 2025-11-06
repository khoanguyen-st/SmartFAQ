from __future__ import annotations
import json
import re
import logging
import time
from typing import Any, Dict, List, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from google.api_core import exceptions as google_exceptions
from app.rag.question_understanding import Intent, IntentDetector
from app.core.config import settings
from app.rag.prompts import get_intent_detection_prompt
logger = logging.getLogger(__name__)

SUPPORTED_INTENTS = [
    "ask_admission_process",
    "ask_tuition_fee",
    "ask_deadline",
    "ask_requirements",
    "ask_schedule",
    "ask_contact",
    "out_of_scope",
    "other",
]

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
        
        try:
            ai_intent = self._detect_with_ai(question)
            if ai_intent:
                return ai_intent
        except Exception as e:
            logger.warning(f"AI-based intent detection failed: {e}. Falling back to simple fallback.")

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
        if not self.ai_llm or not self.ai_parser:
            return None
        max_retries = 3
        base_delay = 1.0
        for attempt in range(max_retries):
            try:
                prompt = self._build_unified_prompt()
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
                    json_match = re.search(r'\{[^{}]*\}', response, re.DOTALL)
                    if json_match:
                        result = json.loads(json_match.group())
                    else:
                        raise
                intent_label = result.get("intent", "other")
                if intent_label not in SUPPORTED_INTENTS:
                    intent_label = "other"
                confidence = float(result.get("confidence", 0.5))
                confidence = max(0.0, min(1.0, confidence))
                reasoning = result.get("reasoning", "")
                is_in_domain = result.get("is_in_domain", True)
                language = result.get("language", "en")
                metadata = {
                    "reasoning": reasoning,
                    "is_in_domain": is_in_domain,
                    "language": language,
                    "method": "ai_based",
                }
                return Intent(
                    label=intent_label,
                    confidence=round(confidence, 3),
                    metadata=metadata,
                )
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
                logger.error(f"AI intent detection error (attempt {attempt + 1}/{max_retries}): {e}", exc_info=True)
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    time.sleep(delay)
                    continue
                else:
                    return None
        return None
    
    def _build_unified_prompt(self) -> str:
        """Build unified system prompt that handles both Vietnamese and English."""
        return get_intent_detection_prompt()
    
    def get_available_intents(self) -> List[str]:
        return SUPPORTED_INTENTS