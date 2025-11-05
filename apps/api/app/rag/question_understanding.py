from __future__ import annotations
from abc import ABC, abstractmethod
import logging
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
logger = logging.getLogger(__name__)

class Intent(BaseModel):
    label: str = Field(..., description="Intent label (e.g., 'ask_admission_process')")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score [0.0, 1.0]")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class Entity(BaseModel):
    type: str = Field(..., description="Entity type (e.g., 'program', 'semester')")
    value: str = Field(..., description="Extracted entity value")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score [0.0, 1.0]")
    start_pos: Optional[int] = Field(None, description="Start position in original text")
    end_pos: Optional[int] = Field(None, description="End position in original text")

class NormalizedQuestion(BaseModel):
    original_question: str = Field(..., description="Original user question")
    normalized_question: str = Field(..., description="Normalized question after processing")
    intent: Optional[Intent] = Field(None, description="Detected intent")
    entities: List[Entity] = Field(default_factory=list, description="Extracted entities")
    language: str = Field(default="en", description="Detected language (e.g., 'en', 'vi')")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Processing metadata")

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
        language: str = "en"
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
    
    def understand(self, question: str, context: Optional[Dict[str, Any]] = None) -> NormalizedQuestion:
        if not question:
            logger.warning("Empty question received")
            raise ValueError("Question cannot be empty. Please provide a question.")
        if not question.strip():
            logger.warning("Whitespace-only question received")
            raise ValueError("Question cannot be empty. Please provide a question.")
        MAX_QUESTION_LENGTH = 1000
        if len(question) > MAX_QUESTION_LENGTH:
            logger.warning(f"Question too long: {len(question)} chars")
            raise ValueError(
                f"Question is too long (maximum {MAX_QUESTION_LENGTH} characters). "
                "Please shorten your question."
            )
        metadata: Dict[str, Any] = {
            "original_length": len(question),
            "processing_steps": [],
            "errors": [],  
            "warnings": [], 
        }
        
        # Step 1: Normalize question
        normalized_question = question.strip()
        normalization_failed = False
        if self.normalizer:
            try:
                normalized_question = self.normalizer.normalize(question)
                if not normalized_question or not normalized_question.strip():
                    logger.warning("Normalization returned empty result, using original question")
                    normalized_question = question.strip()
                    normalization_failed = True
                    metadata["warnings"].append("Normalization returned empty result")
                else:
                    metadata["processing_steps"].append("normalization")
            except Exception as e:
                logger.error(f"Normalization failed: {e}", exc_info=True)
                normalized_question = question.strip() 
                normalization_failed = True
                metadata["errors"].append({
                    "step": "normalization",
                    "error": str(e),
                    "error_type": type(e).__name__,
                })
                metadata["processing_steps"].append("normalization_failed")
        else:
            normalized_question = question.strip()
            metadata["processing_steps"].append("basic_normalization")
        metadata["normalized_length"] = len(normalized_question)
        
        # Step 2: Detect intent (AI-based, includes language detection)
        intent: Optional[Intent] = None
        intent_detection_failed = False
        detected_language = "en"  # Default fallback
        
        if self.intent_detector:
            try:
                intent = self.intent_detector.detect(normalized_question, context)
                if intent is None:
                    raise ValueError("Intent detector returned None")
                if not intent.label:
                    logger.warning("Intent detector returned empty label")
                    intent = Intent(label="other", confidence=0.0, metadata={"fallback": True, "reason": "empty_label"})
                    intent_detection_failed = True
                    metadata["warnings"].append("Intent detector returned empty label")
                else:
                    metadata["processing_steps"].append("intent_detection")
                    
                    # Get language from intent metadata (AI-detected)
                    detected_language = intent.metadata.get("language", "en")
                    
                    # Add language_detection step when language is detected from intent
                    if "language" in intent.metadata:
                        metadata["processing_steps"].append("language_detection")
                        metadata["language_detection_method"] = "intent_metadata"
                    
                    if intent.confidence < 0.4:
                        logger.debug(f"Low confidence intent detected: {intent.label} (confidence: {intent.confidence})")
                        metadata["warnings"].append(f"Low confidence intent: {intent.label} ({intent.confidence})")
            except Exception as e:
                logger.error(f"Intent detection failed: {e}", exc_info=True)
                intent_detection_failed = True
                intent = Intent(
                    label="other",
                    confidence=0.0,
                    metadata={
                        "fallback": True,
                        "error": str(e),
                        "error_type": type(e).__name__,
                    }
                )
                metadata["errors"].append({
                    "step": "intent_detection",
                    "error": str(e),
                    "error_type": type(e).__name__,
                })
                metadata["processing_steps"].append("intent_detection_failed")
        else:
            intent = Intent(label="other", confidence=0.5, metadata={"fallback": True})
            metadata["processing_steps"].append("intent_detection_fallback")
        
        # Step 3: Extract entities
        entities: List[Entity] = []
        entity_extraction_failed = False
        if self.entity_extractor:
            try:
                entities = self.entity_extractor.extract(normalized_question, intent)
                if entities is None:
                    logger.warning("Entity extractor returned None")
                    entities = []
                    entity_extraction_failed = True
                    metadata["warnings"].append("Entity extractor returned None")
                else:
                    valid_entities = []
                    for entity in entities:
                        if entity is None:
                            continue
                        if not entity.type or not entity.value:
                            logger.warning(f"Invalid entity detected: {entity}")
                            continue
                        valid_entities.append(entity)
                    entities = valid_entities
                    metadata["processing_steps"].append("entity_extraction")
            except Exception as e:
                logger.error(f"Entity extraction failed: {e}", exc_info=True)
                entity_extraction_failed = True
                entities = []  
                metadata["errors"].append({
                    "step": "entity_extraction",
                    "error": str(e),
                    "error_type": type(e).__name__,
                })
                metadata["processing_steps"].append("entity_extraction_failed")
        else:
            entities = []
            metadata["processing_steps"].append("entity_extraction_fallback")
        metadata["entities_count"] = len(entities)
        
        # Step 4: Determine final language
        # Use detected language from intent (AI-detected, handles Vietnamese with/without diacritics)
        # Hoàn toàn dựa vào AI, không dùng regex pattern fallback
        language = detected_language
        
        # Chỉ fallback về "en" nếu intent detection failed hoàn toàn
        if intent_detection_failed and intent.confidence == 0.0:
            # Nếu AI detection fail hoàn toàn, mặc định là "en"
            # (Không dùng regex pattern vì không detect được Vietnamese không dấu)
            language = "en"
            if "language_detection" not in metadata["processing_steps"]:
                metadata["processing_steps"].append("language_detection_fallback")
                metadata["language_detection_method"] = "fallback_default"
        
        metadata["detected_language"] = language
        metadata["language_source"] = "intent_metadata" if not intent_detection_failed else "fallback"
        
        # Step 5: Determine if clarification is needed
        critical_failures = sum([
            intent_detection_failed and (intent.confidence == 0.0 if intent else True),
            entity_extraction_failed and len(entities) == 0,
            normalization_failed,
        ])
        if critical_failures >= 2:
            metadata["clarification_needed"] = True
            metadata["suggestion"] = "I'm not sure what you mean. Could you please clarify?"
        else:
            metadata["clarification_needed"] = False
        
        return NormalizedQuestion(
            original_question=question,
            normalized_question=normalized_question,
            intent=intent,
            entities=entities,
            language=language,
            metadata=metadata,
        )
    
    def __repr__(self) -> str:
        return (
            f"QuestionUnderstanding("
            f"intent_detector={self.intent_detector is not None}, "
            f"entity_extractor={self.entity_extractor is not None}, "
            f"normalizer={self.normalizer is not None})"
        )