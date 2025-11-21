from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from app.rag.constants import MAX_QUESTION_LENGTH
from app.rag.validations import Entity, Intent, NormalizedQuestion

logger = logging.getLogger(__name__)


class IntentDetector(ABC):
    @abstractmethod
    def detect(self, question: str, context: Optional[Dict[str, Any]] = None) -> Intent:
        raise NotImplementedError


class EntityExtractor(ABC):
    @abstractmethod
    def extract(self, question: str, intent: Optional[Intent] = None) -> List[Entity]:
        raise NotImplementedError


class QuestionNormalizer(ABC):
    @abstractmethod
    def normalize(self, question: str) -> str:
        raise NotImplementedError

    def get_clarification_message(
        normalization_failed: bool = False,
        intent_detection_failed: bool = False,
        entity_extraction_failed: bool = False,
        language: str = "en",
    ) -> str:
        if language == "vi":
            if normalization_failed or intent_detection_failed:
                return "Tôi không chắc chắn về câu hỏi của bạn. Bạn có thể làm rõ thêm được không?"
            return "Bạn có thể làm rõ thêm câu hỏi của mình không?"
        else:
            if normalization_failed or intent_detection_failed:
                return "I'm not sure what you mean. Could you please clarify?"
            return "Could you please rephrase your question?"


class QuestionUnderstanding:
    def __init__(
        self,
        intent_detector: Optional[IntentDetector] = None,
        entity_extractor: Optional[EntityExtractor] = None,
        normalizer: Optional[QuestionNormalizer] = None,
        language_detector: Optional[Any] = None,
    ):
        if intent_detector is None:
            from app.rag.intent_detector import RuleBasedIntentDetector

            intent_detector = RuleBasedIntentDetector()
        if entity_extractor is None:
            from app.rag.entity_extractor import RuleBasedEntityExtractor

            entity_extractor = RuleBasedEntityExtractor()
        if normalizer is None:
            from app.rag.normalizer import RuleBasedNormalizer

            normalizer = RuleBasedNormalizer()
        self.intent_detector = intent_detector
        self.entity_extractor = entity_extractor
        self.normalizer = normalizer
        self.language_detector = language_detector

    def understand(
        self, question: str, context: Optional[Dict[str, Any]] = None
    ) -> NormalizedQuestion:
        stripped_question = self._validate_question(question)
        metadata = self._init_metadata(question)

        normalized_question, normalization_failed = self._run_normalization(
            question, stripped_question, metadata
        )
        intent, intent_detection_failed, detected_language = self._run_intent_detection(
            normalized_question,
            context,
            metadata,
        )
        entities, entity_extraction_failed = self._run_entity_extraction(
            normalized_question,
            intent,
            metadata,
        )

        language = self._resolve_language(
            intent, intent_detection_failed, detected_language, metadata
        )
        metadata["entities_count"] = len(entities)
        self._update_clarification_flag(
            normalization_failed,
            intent_detection_failed,
            entity_extraction_failed,
            len(entities),
            intent,
            metadata,
        )

        return NormalizedQuestion(
            original_question=question,
            normalized_question=normalized_question,
            intent=intent,
            entities=entities,
            language=language,
            metadata=metadata,
        )

    def _validate_question(self, question: str) -> str:
        if not question:
            logger.warning("Empty question received")
            raise ValueError("Question cannot be empty. Please provide a question.")

        stripped = question.strip()
        if not stripped:
            logger.warning("Whitespace-only question received")
            raise ValueError("Question cannot be empty. Please provide a question.")

        if len(question) > MAX_QUESTION_LENGTH:
            logger.warning("Question too long: %s chars", len(question))
            raise ValueError(
                f"Question is too long (maximum {MAX_QUESTION_LENGTH} characters). "
                "Please shorten your question."
            )
        return stripped

    def _init_metadata(self, question: str) -> Dict[str, Any]:
        return {
            "original_length": len(question),
            "processing_steps": [],
            "errors": [],
            "warnings": [],
        }

    def _run_normalization(
        self,
        original_question: str,
        stripped_question: str,
        metadata: Dict[str, Any],
    ) -> tuple[str, bool]:
        if not self.normalizer:
            metadata["processing_steps"].append("basic_normalization")
            metadata["normalized_length"] = len(stripped_question)
            return stripped_question, False

        try:
            normalized = self.normalizer.normalize(original_question)
            if not normalized or not normalized.strip():
                logger.warning("Normalization returned empty result, using original question")
                metadata["warnings"].append("Normalization returned empty result")
                metadata["processing_steps"].append("normalization_failed")
                normalized = stripped_question
                normalization_failed = True
            else:
                metadata["processing_steps"].append("normalization")
                normalization_failed = False
        except Exception as exc:  
            logger.error("Normalization failed: %s", exc, exc_info=True)
            metadata["errors"].append(
                {"step": "normalization", "error": str(exc), "error_type": type(exc).__name__}
            )
            metadata["processing_steps"].append("normalization_failed")
            normalized = stripped_question
            normalization_failed = True

        metadata["normalized_length"] = len(normalized)
        return normalized.strip(), normalization_failed

    def _run_intent_detection(
        self,
        normalized_question: str,
        context: Optional[Dict[str, Any]],
        metadata: Dict[str, Any],
    ) -> tuple[Intent, bool, str]:
        detected_language = "en"
        if not self.intent_detector:
            metadata["processing_steps"].append("intent_detection_fallback")
            intent = Intent(label="other", confidence=0.5, metadata={"fallback": True})
            return intent, False, detected_language

        try:
            intent = self.intent_detector.detect(normalized_question, context)
            if intent is None:
                raise ValueError("Intent detector returned None")
            if not intent.label:
                logger.warning("Intent detector returned empty label")
                metadata["warnings"].append("Intent detector returned empty label")
                metadata["processing_steps"].append("intent_detection_failed")
                fallback_intent = Intent(
                    label="other",
                    confidence=0.0,
                    metadata={"fallback": True, "reason": "empty_label"},
                )
                return fallback_intent, True, detected_language

            metadata["processing_steps"].append("intent_detection")
            detected_language = intent.metadata.get("language", detected_language)
            if "language" in intent.metadata:
                metadata["processing_steps"].append("language_detection")
                metadata["language_detection_method"] = "intent_metadata"
            if intent.confidence < 0.4:
                logger.debug(
                    "Low confidence intent detected: %s (confidence: %s)",
                    intent.label,
                    intent.confidence,
                )
                metadata["warnings"].append(
                    f"Low confidence intent: {intent.label} ({intent.confidence})"
                )
            return intent, False, detected_language
        except Exception as exc:  
            logger.error("Intent detection failed: %s", exc, exc_info=True)
            metadata["errors"].append(
                {"step": "intent_detection", "error": str(exc), "error_type": type(exc).__name__}
            )
            metadata["processing_steps"].append("intent_detection_failed")
            fallback_intent = Intent(
                label="other",
                confidence=0.0,
                metadata={"fallback": True, "error": str(exc), "error_type": type(exc).__name__},
            )
            return fallback_intent, True, detected_language

    def _run_entity_extraction(
        self,
        normalized_question: str,
        intent: Intent,
        metadata: Dict[str, Any],
    ) -> tuple[List[Entity], bool]:
        if not self.entity_extractor:
            metadata["processing_steps"].append("entity_extraction_fallback")
            return [], False

        try:
            entities = self.entity_extractor.extract(normalized_question, intent)
            if entities is None:
                logger.warning("Entity extractor returned None")
                metadata["warnings"].append("Entity extractor returned None")
                metadata["processing_steps"].append("entity_extraction_failed")
                return [], True

            valid_entities = []
            for entity in entities:
                if entity is None or not entity.type or not entity.value:
                    logger.warning("Invalid entity detected: %s", entity)
                    continue
                valid_entities.append(entity)

            metadata["processing_steps"].append("entity_extraction")
            return valid_entities, False
        except Exception as exc:  
            logger.error("Entity extraction failed: %s", exc, exc_info=True)
            metadata["errors"].append(
                {"step": "entity_extraction", "error": str(exc), "error_type": type(exc).__name__}
            )
            metadata["processing_steps"].append("entity_extraction_failed")
            return [], True

    def _resolve_language(
        self,
        intent: Intent,
        intent_detection_failed: bool,
        detected_language: str,
        metadata: Dict[str, Any],
    ) -> str:
        language = detected_language
        if intent_detection_failed and intent.confidence == 0.0:
            language = "en"
            if "language_detection" not in metadata["processing_steps"]:
                metadata["processing_steps"].append("language_detection_fallback")
                metadata["language_detection_method"] = "fallback_default"

        metadata["detected_language"] = language
        metadata["language_source"] = (
            "intent_metadata" if not intent_detection_failed else "fallback"
        )
        return language

    def _update_clarification_flag(
        self,
        normalization_failed: bool,
        intent_detection_failed: bool,
        entity_extraction_failed: bool,
        entity_count: int,
        intent: Intent,
        metadata: Dict[str, Any],
    ) -> None:
        critical_failures = sum(
            [
                bool(intent_detection_failed and (intent.confidence == 0.0 if intent else True)),
                bool(entity_extraction_failed and entity_count == 0),
                bool(normalization_failed),
            ]
        )
        if critical_failures >= 2:
            metadata["clarification_needed"] = True
            metadata["suggestion"] = "I'm not sure what you mean. Could you please clarify?"
        else:
            metadata["clarification_needed"] = False

    def __repr__(self) -> str:
        return (
            f"QuestionUnderstanding("
            f"intent_detector={self.intent_detector is not None}, "
            f"entity_extractor={self.entity_extractor is not None}, "
            f"normalizer={self.normalizer is not None})"
        )
