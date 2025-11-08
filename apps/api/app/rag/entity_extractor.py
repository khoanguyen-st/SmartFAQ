from __future__ import annotations

import logging
import re
from typing import List, Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import StrOutputParser
from google.api_core import exceptions as google_exceptions

from app.core.config import settings
from app.rag.constants import SUPPORTED_ENTITY_TYPES
from app.rag.prompts import get_entity_extraction_prompt
from app.rag.question_understanding import Entity, EntityExtractor, Intent
from app.rag.utils.llm_json import invoke_json_llm

logger = logging.getLogger(__name__)

class RuleBasedEntityExtractor(EntityExtractor):
    def __init__(self):
        try:
            self.ai_llm = ChatGoogleGenerativeAI(
                model=settings.LLM_MODEL,
                temperature=0.1,  
                max_output_tokens=1024,
                google_api_key=settings.GOOGLE_API_KEY,
            )
            self.ai_parser = StrOutputParser()
        except Exception as e:
            logger.warning(f"Failed to initialize AI components: {e}. Will use fallback only.")
            self.ai_llm = None
            self.ai_parser = None
    
    def extract(self, question: str, intent: Optional[Intent] = None) -> List[Entity]:
        if not question or not question.strip():
            logger.debug("Empty question received in entity extractor")
            return []
        ai_entities: Optional[List[Entity]] = None
        try:
            ai_entities = self._extract_with_ai(question, intent)
        except google_exceptions.ResourceExhausted as exc:
            logger.warning("Quota exhausted in entity extraction: %s", exc)
            return []
        except Exception as exc:  # noqa: BLE001
            logger.warning("AI-based entity extraction failed: %s. Returning empty list.", exc)
            return []
        if ai_entities is not None:
            return ai_entities
        logger.warning("AI-based entity extraction failed. Returning empty list.")
        return []
    
    def _extract_with_ai(self, question: str, intent: Optional[Intent] = None) -> Optional[List[Entity]]:
        """Extract entities using Gemini AI with retry logic."""
        prompt = self._build_unified_prompt(intent)
        result = invoke_json_llm(
            self.ai_llm,
            self.ai_parser,
            system_prompt=prompt,
            question=question,
            logger=logger,
            log_ctx="Entity extraction",
        )
        if not result:
            return None

        entities_data = result.get("entities", [])
        if not isinstance(entities_data, list):
            logger.warning("Expected list of entities, got %s", type(entities_data))
            return []

        entities: List[Entity] = []
        for entity_data in entities_data:
            if not isinstance(entity_data, dict):
                continue

            entity_type = entity_data.get("type", "").lower()
            if entity_type not in SUPPORTED_ENTITY_TYPES:
                logger.debug("Skipping unsupported entity type: %s", entity_type)
                continue

            value = entity_data.get("value", "").strip()
            if not value:
                continue

            confidence_raw = entity_data.get("confidence", 0.5)
            try:
                confidence = float(confidence_raw)
            except (TypeError, ValueError):
                logger.debug("Invalid confidence for entity %s: %s", entity_type, confidence_raw)
                confidence = 0.5
            confidence = max(0.0, min(1.0, confidence))

            start_pos = entity_data.get("start_pos")
            end_pos = entity_data.get("end_pos")
            if (
                start_pos is None
                or end_pos is None
                or start_pos < 0
                or end_pos > len(question)
            ):
                found_pos = self._find_entity_positions(question, value)
                if found_pos:
                    start_pos, end_pos = found_pos
                else:
                    start_pos = None
                    end_pos = None

            entity = Entity(
                type=entity_type,
                value=value,
                confidence=round(confidence, 3),
                start_pos=start_pos,
                end_pos=end_pos,
            )
            entities.append(entity)

        return self._deduplicate_entities(entities)
    
    def _find_entity_positions(self, question: str, entity_value: str) -> Optional[tuple]:
        """Fallback method to find entity positions if AI doesn't provide them."""
        if not entity_value:
            return None
        pattern = re.escape(entity_value)
        matches = list(re.finditer(pattern, question, re.IGNORECASE))
        if matches:
            match = matches[0]
            return (match.start(), match.end())
        
        question_lower = question.lower()
        entity_lower = entity_value.lower()
        start_idx = question_lower.find(entity_lower)
        if start_idx >= 0:
            end_idx = start_idx + len(entity_value)
            return (start_idx, end_idx)
        return None
    
    def _deduplicate_entities(self, entities: List[Entity]) -> List[Entity]:
        """Remove duplicate entities based on type and value."""
        seen = set()
        unique = []
        for entity in entities:
            key = (entity.type.lower(), entity.value.lower().strip())
            if key not in seen:
                seen.add(key)
                unique.append(entity)
        return unique
    
    def _build_unified_prompt(self, intent: Optional[Intent] = None) -> str:
        """Build unified system prompt that handles both Vietnamese and English."""
        intent_label = None
        intent_confidence = None
        if intent:
            intent_label = intent.label
            intent_confidence = intent.confidence
        return get_entity_extraction_prompt(intent_label=intent_label, intent_confidence=intent_confidence)
    
    def get_supported_entity_types(self) -> List[str]:
        return SUPPORTED_ENTITY_TYPES