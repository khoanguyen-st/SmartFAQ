"""Test Error Handling in Question Understanding module."""

import pytest
from app.rag.question_understanding import QuestionUnderstanding
from app.rag.validations import NormalizedQuestion

class TestErrorHandling:
    
    def test_empty_question(self):
        qu = QuestionUnderstanding()
        with pytest.raises(ValueError) as exc_info:
            qu.understand("")
        assert "empty" in str(exc_info.value).lower()
        with pytest.raises(ValueError) as exc_info:
            qu.understand("   ")
        assert "empty" in str(exc_info.value).lower()
    
    def test_very_long_question(self):
        qu = QuestionUnderstanding()
        long_question = "What is " * 200 
        with pytest.raises(ValueError) as exc_info:
            qu.understand(long_question)
        assert "too long" in str(exc_info.value).lower()
    
    def test_normalization_failure_graceful(self):
        qu = QuestionUnderstanding()
        result = qu.understand("What is the admission process?")
        assert result.normalized_question is not None
        assert len(result.normalized_question) > 0
    
    def test_intent_detection_failure_graceful(self):
        from app.rag.question_understanding import IntentDetector
        class FailingIntentDetector(IntentDetector):
            def detect(self, question: str, context=None):
                raise ValueError("Intent detection failed")
        qu = QuestionUnderstanding(intent_detector=FailingIntentDetector())
        result = qu.understand("What is the admission process?")
        assert result is not None
        assert result.intent is not None
        assert result.intent.label == "other"
        assert "intent_detection_failed" in result.metadata["processing_steps"]
        assert "errors" in result.metadata
    
    def test_entity_extraction_failure_graceful(self):
        from app.rag.question_understanding import EntityExtractor
        class FailingEntityExtractor(EntityExtractor):
            def extract(self, question: str, intent=None):
                raise ValueError("Entity extraction failed")
        qu = QuestionUnderstanding(entity_extractor=FailingEntityExtractor())
        result = qu.understand("What are the requirements for Computer Science?")
        assert result is not None
        assert result.entities == []  
        assert "entity_extraction_failed" in result.metadata["processing_steps"]
        assert "errors" in result.metadata
    
    def test_multiple_failures(self):
        from app.rag.question_understanding import IntentDetector, EntityExtractor
        class FailingIntentDetector(IntentDetector):
            def detect(self, question: str, context=None):
                raise ValueError("Intent detection failed")
        class FailingEntityExtractor(EntityExtractor):
            def extract(self, question: str, intent=None):
                raise ValueError("Entity extraction failed")
        qu = QuestionUnderstanding(
            intent_detector=FailingIntentDetector(),
            entity_extractor=FailingEntityExtractor(),
        )
        result = qu.understand("What is the process?")
        assert result is not None
        assert isinstance(result, NormalizedQuestion)
        assert result.intent.label == "other"  
        assert result.entities == [] 
        assert len(result.metadata["errors"]) >= 2  
    
    def test_error_metadata_structure(self):
        from app.rag.question_understanding import EntityExtractor
        class FailingEntityExtractor(EntityExtractor):
            def extract(self, question: str, intent=None):
                raise ValueError("Test error")
        qu = QuestionUnderstanding(entity_extractor=FailingEntityExtractor())
        result = qu.understand("Test question")
        assert "errors" in result.metadata
        assert isinstance(result.metadata["errors"], list)
        if result.metadata["errors"]:
            error = result.metadata["errors"][0]
            assert "step" in error
            assert "error" in error
            assert "error_type" in error
    
    def test_warnings_tracking(self):
        qu = QuestionUnderstanding()
        result = qu.understand("Hello world")  
        assert "warnings" in result.metadata
        assert isinstance(result.metadata["warnings"], list)
    
    def test_clarification_needed_flag(self):
        from app.rag.question_understanding import IntentDetector, EntityExtractor
        class FailingIntentDetector(IntentDetector):
            def detect(self, question: str, context=None):
                from app.rag.validations import Intent
                return Intent(label="other", confidence=0.0, metadata={})
        class FailingEntityExtractor(EntityExtractor):  
            def extract(self, question: str, intent=None):
                raise ValueError("Failed")
        
        qu = QuestionUnderstanding(
            intent_detector=FailingIntentDetector(),
            entity_extractor=FailingEntityExtractor(),
        )
        
        result = qu.understand("???")  
        if result.metadata.get("clarification_needed"):
            assert "suggestion" in result.metadata
            assert "clarify" in result.metadata["suggestion"].lower()