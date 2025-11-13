"""Test Question Understanding module structure."""

import pytest
from unittest.mock import patch
from app.rag.question_understanding import (
    QuestionUnderstanding,
    Intent,
    Entity,
    NormalizedQuestion,
    IntentDetector,
    EntityExtractor,
    QuestionNormalizer,
)


# Mock time.sleep globally to speed up tests
@pytest.fixture(autouse=True)
def mock_time_sleep():
    """Mock time.sleep to speed up tests."""
    with patch('time.sleep'):
        yield


def test_intent_model():
    """Test Intent Pydantic model."""
    # Test 1: Create Intent with required fields
    intent = Intent(label="ask_admission_process", confidence=0.9)
    
    # Verify all fields
    assert intent.label == "ask_admission_process"
    assert intent.confidence == 0.9
    assert isinstance(intent.metadata, dict)
    assert len(intent.metadata) == 0  # Empty dict by default
    
    # Test 2: Create Intent with metadata
    intent_with_meta = Intent(
        label="ask_tuition_fee",
        confidence=0.85,
        metadata={"source": "rule-based", "matched_keywords": ["fee", "tuition"]}
    )
    assert intent_with_meta.label == "ask_tuition_fee"
    assert intent_with_meta.metadata["source"] == "rule-based"
    
    # Test 3: Validate confidence range (should pass)
    intent_valid = Intent(label="ask_deadline", confidence=1.0)
    assert intent_valid.confidence == 1.0
    
    # Test 4: Validate confidence range (should fail)
    with pytest.raises(Exception):  # Pydantic validation error
        Intent(label="invalid", confidence=1.5)  # > 1.0, should fail


def test_entity_model():
    """Test Entity Pydantic model."""
    # Test 1: Create Entity with required fields
    entity = Entity(
        type="program",
        value="Computer Science",
        confidence=0.85,
    )
    assert entity.type == "program"
    assert entity.value == "Computer Science"
    assert entity.confidence == 0.85
    assert entity.start_pos is None
    assert entity.end_pos is None
    
    # Test 2: Create Entity with positions
    entity_with_pos = Entity(
        type="semester",
        value="Fall 2025",
        confidence=0.9,
        start_pos=10,
        end_pos=19,
    )
    assert entity_with_pos.start_pos == 10
    assert entity_with_pos.end_pos == 19
    
    # Test 3: Validate confidence range
    with pytest.raises(Exception):  # Should fail if confidence > 1.0
        Entity(type="test", value="test", confidence=2.0)


def test_normalized_question_model():
    """Test NormalizedQuestion Pydantic model."""
    # Test 1: Create NormalizedQuestion with all fields
    intent = Intent(label="ask_admission_process", confidence=0.9)
    entity = Entity(type="program", value="Computer Science", confidence=0.85)
    
    normalized = NormalizedQuestion(
        original_question="What is admission process?",
        normalized_question="What is admission process?",
        intent=intent,
        entities=[entity],
        language="en",
    )
    
    assert normalized.original_question == "What is admission process?"
    assert normalized.normalized_question == "What is admission process?"
    assert normalized.intent == intent
    assert len(normalized.entities) == 1
    assert normalized.entities[0] == entity
    assert normalized.language == "en"
    assert isinstance(normalized.metadata, dict)
    
    # Test 2: Create with minimal fields (intent and entities can be None/empty)
    normalized_minimal = NormalizedQuestion(
        original_question="Hello",
        normalized_question="Hello",
    )
    assert normalized_minimal.original_question == "Hello"
    assert normalized_minimal.normalized_question == "Hello"
    assert normalized_minimal.intent is None
    assert len(normalized_minimal.entities) == 0
    assert normalized_minimal.language == "en"  # Default value


def test_question_understanding_orchestrator_basic():
    """Test QuestionUnderstanding orchestrator - basic functionality."""
    # Mock AI calls to avoid actual API calls
    mock_intent = Intent(
        label="ask_admission_process",
        confidence=0.9,
        metadata={"reasoning": "User asking about admission", "language": "en", "method": "ai_based"}
    )
    mock_entities = []
    mock_normalized = "What is admission process?"

    with patch('app.rag.intent_detector.RuleBasedIntentDetector._detect_with_ai', return_value=mock_intent):
        with patch('app.rag.entity_extractor.RuleBasedEntityExtractor._extract_with_ai', return_value=mock_entities):
            with patch('app.rag.normalizer.RuleBasedNormalizer._normalize_with_ai', return_value=mock_normalized):
                qu = QuestionUnderstanding()
                result = qu.understand("What is admission process?")
                
                # Verify result is NormalizedQuestion
                assert isinstance(result, NormalizedQuestion)
                
                # Verify original question is preserved
                assert result.original_question == "What is admission process?"
                
                # Verify normalized question (should be processed by normalizer)
                assert result.normalized_question is not None
                assert len(result.normalized_question) > 0
                
                # Verify intent exists
                assert result.intent is not None
                assert result.intent.label == "ask_admission_process"
                assert result.intent.confidence > 0.0
                
                # Verify language detection
                assert result.language == "en"
                
                # Verify metadata contains processing steps
                assert "processing_steps" in result.metadata
                assert isinstance(result.metadata["processing_steps"], list)
                
                # Verify processing steps
                assert "normalization" in result.metadata["processing_steps"]
                assert "intent_detection" in result.metadata["processing_steps"]
                assert "entity_extraction" in result.metadata["processing_steps"]


def test_question_understanding_empty_input():
    """Test error handling for empty input."""
    qu = QuestionUnderstanding()
    
    # Test 1: Empty string should raise ValueError
    with pytest.raises(ValueError) as exc_info:
        qu.understand("")
    assert "empty" in str(exc_info.value).lower()
    
    # Test 2: Whitespace-only string should raise ValueError
    with pytest.raises(ValueError) as exc_info:
        qu.understand("   ")
    assert "empty" in str(exc_info.value).lower()
    
    # Test 3: None should raise AttributeError (when calling .strip())
    with pytest.raises((AttributeError, ValueError)):
        qu.understand(None)  # type: ignore


def test_question_understanding_vietnamese_language():
    """Test language detection for Vietnamese."""
    # Mock AI calls to avoid actual API calls
    mock_intent = Intent(
        label="ask_admission_process",
        confidence=0.9,
        metadata={"reasoning": "User asking about admission", "language": "vi", "method": "ai_based"}
    )
    mock_entities = []
    mock_normalized = "Quy trình tuyển sinh như thế nào?"

    with patch('app.rag.intent_detector.RuleBasedIntentDetector._detect_with_ai', return_value=mock_intent):
        with patch('app.rag.entity_extractor.RuleBasedEntityExtractor._extract_with_ai', return_value=mock_entities):
            with patch('app.rag.normalizer.RuleBasedNormalizer._normalize_with_ai', return_value=mock_normalized):
                qu = QuestionUnderstanding()
                result = qu.understand("Quy trình tuyển sinh như thế nào?")
                
                assert result.language == "vi"
                assert "language_detection" in result.metadata["processing_steps"]


def test_question_understanding_with_metadata():
    """Test that metadata is properly collected."""
    # Mock AI calls to avoid actual API calls
    mock_intent = Intent(
        label="ask_tuition_fee",
        confidence=0.9,
        metadata={"reasoning": "User asking about tuition", "language": "en", "method": "ai_based"}
    )
    mock_entities = [
        Entity(type="tuition_fee", value="tuition fee", confidence=0.9, start_pos=12, end_pos=24)
    ]
    mock_normalized = "What is the tuition fee?"

    with patch('app.rag.intent_detector.RuleBasedIntentDetector._detect_with_ai', return_value=mock_intent):
        with patch('app.rag.entity_extractor.RuleBasedEntityExtractor._extract_with_ai', return_value=mock_entities):
            with patch('app.rag.normalizer.RuleBasedNormalizer._normalize_with_ai', return_value=mock_normalized):
                qu = QuestionUnderstanding()
                original_question = "What is the tuition fee?"
                result = qu.understand(original_question)
                
                # Check metadata structure
                assert "original_length" in result.metadata
                assert "normalized_length" in result.metadata
                assert "processing_steps" in result.metadata
                assert "entities_count" in result.metadata
                
                # Verify lengths
                assert result.metadata["original_length"] == len(original_question)
                assert result.metadata["normalized_length"] == len(result.normalized_question)
                assert result.metadata["normalized_length"] >= result.metadata["original_length"]
                
                # Verify entities
                assert result.metadata["entities_count"] >= 0
                if result.metadata["entities_count"] > 0:
                    assert len(result.entities) == result.metadata["entities_count"]
                    # Verify at least one entity is related to tuition
                    tuition_entities = [e for e in result.entities if e.type == "tuition_fee"]
                    assert len(tuition_entities) > 0

def test_question_understanding_repr():
    """Test string representation for debugging."""
    qu = QuestionUnderstanding()
    
    repr_str = repr(qu)
    
    # Should contain class name
    assert "QuestionUnderstanding" in repr_str
    
    # With default initialization, all components are created (not None)
    # So they should all be True
    assert "intent_detector=True" in repr_str
    assert "entity_extractor=True" in repr_str
    assert "normalizer=True" in repr_str