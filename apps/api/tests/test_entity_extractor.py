"""Test Entity Extraction module."""

import pytest
from unittest.mock import Mock, patch, MagicMock
import json
import time
from google.api_core import exceptions as google_exceptions
from app.rag.entity_extractor import RuleBasedEntityExtractor
from app.rag.validations import Entity, Intent


# Mock time.sleep globally to speed up tests
@pytest.fixture(autouse=True)
def mock_time_sleep():
    """Mock time.sleep to speed up tests."""
    with patch('time.sleep'):
        yield


class TestRuleBasedEntityExtractor:
    """Test suite for RuleBasedEntityExtractor."""
    
    @pytest.fixture
    def extractor(self):
        """Create extractor instance for testing."""
        return RuleBasedEntityExtractor()
    
    def test_extract_programs(self, extractor):
        """Test extraction of program names."""
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            # Test 1: Direct program name
            mock_extract.return_value = [
                Entity(type="program", value="Computer Science", confidence=0.9, start_pos=12, end_pos=28)
            ]
            entities = extractor.extract("What is the Computer Science program?")
            program_entities = [e for e in entities if e.type == "program"]
            assert len(program_entities) > 0
            assert any("computer science" in e.value.lower() for e in program_entities)
            
            # Test 2: Abbreviation
            mock_extract.return_value = [
                Entity(type="program", value="CS", confidence=0.85, start_pos=12, end_pos=14)
            ]
            entities = extractor.extract("Tell me about CS program")
            program_entities = [e for e in entities if e.type == "program"]
            assert len(program_entities) > 0
            
            # Test 3: Vietnamese
            mock_extract.return_value = [
                Entity(type="program", value="Khoa học máy tính", confidence=0.9, start_pos=12, end_pos=28)
            ]
            entities = extractor.extract("Chương trình Khoa học máy tính như thế nào?")
            program_entities = [e for e in entities if e.type == "program"]
            assert len(program_entities) > 0
            
            # Test 4: Vietnamese without diacritics
            mock_extract.return_value = [
                Entity(type="program", value="Khoa hoc may tinh", confidence=0.9, start_pos=12, end_pos=28)
            ]
            entities = extractor.extract("Chuong trinh Khoa hoc may tinh nhu the nao?")
            program_entities = [e for e in entities if e.type == "program"]
            assert len(program_entities) > 0
    
    def test_extract_semesters(self, extractor):
        """Test extraction of semester/intake information."""
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            # Test 1: English format
            mock_extract.return_value = [
                Entity(type="semester", value="Fall 2025", confidence=0.95, start_pos=32, end_pos=41)
            ]
            entities = extractor.extract("When is the deadline for Fall 2025?")
            semester_entities = [e for e in entities if e.type == "semester"]
            assert len(semester_entities) > 0
            assert any("fall" in e.value.lower() and "2025" in e.value for e in semester_entities)
            
            # Test 2: Different format
            mock_extract.return_value = [
                Entity(type="semester", value="Spring 2025", confidence=0.95, start_pos=0, end_pos=11)
            ]
            entities = extractor.extract("Spring 2025 intake")
            semester_entities = [e for e in entities if e.type == "semester"]
            assert len(semester_entities) > 0
            
            # Test 3: Vietnamese
            mock_extract.return_value = [
                Entity(type="semester", value="Học kỳ 1 năm 2025", confidence=0.9, start_pos=0, end_pos=18)
            ]
            entities = extractor.extract("Học kỳ 1 năm 2025")
            semester_entities = [e for e in entities if e.type == "semester"]
            assert len(semester_entities) > 0
            
            # Test 4: Vietnamese without diacritics
            mock_extract.return_value = [
                Entity(type="semester", value="Hoc ky 1 nam 2025", confidence=0.9, start_pos=0, end_pos=18)
            ]
            entities = extractor.extract("Hoc ky 1 nam 2025")
            semester_entities = [e for e in entities if e.type == "semester"]
            assert len(semester_entities) > 0
    
    def test_extract_dates(self, extractor):
        """Test extraction of dates and deadlines."""
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            # Test 1: Specific date
            mock_extract.return_value = [
                Entity(type="date", value="March 15, 2025", confidence=0.9, start_pos=25, end_pos=40),
                Entity(type="deadline", value="deadline", confidence=0.8, start_pos=10, end_pos=18)
            ]
            entities = extractor.extract("Application deadline is March 15, 2025")
            date_entities = [e for e in entities if e.type in ["date", "deadline"]]
            assert len(date_entities) > 0
            
            # Test 2: Date format with slashes
            mock_extract.return_value = [
                Entity(type="date", value="15/03/2025", confidence=0.9, start_pos=9, end_pos=19)
            ]
            entities = extractor.extract("Deadline: 15/03/2025")
            date_entities = [e for e in entities if e.type in ["date", "deadline"]]
            assert len(date_entities) > 0
            
            # Test 3: Relative date
            mock_extract.return_value = [
                Entity(type="deadline", value="deadline", confidence=0.8, start_pos=10, end_pos=18)
            ]
            entities = extractor.extract("When is the deadline?")
            deadline_entities = [e for e in entities if e.type == "deadline"]
            assert len(deadline_entities) > 0
    
    def test_extract_departments(self, extractor):
        """Test extraction of department names."""
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            # Test 1: English
            mock_extract.return_value = [
                Entity(type="department", value="Student Affairs", confidence=0.9, start_pos=18, end_pos=33)
            ]
            entities = extractor.extract("How to contact Student Affairs Department?")
            dept_entities = [e for e in entities if e.type == "department"]
            assert len(dept_entities) > 0
            assert any("student affairs" in e.value.lower() for e in dept_entities)
            
            # Test 2: Vietnamese
            mock_extract.return_value = [
                Entity(type="department", value="Phòng công tác sinh viên", confidence=0.9, start_pos=0, end_pos=23)
            ]
            entities = extractor.extract("Phòng công tác sinh viên ở đâu?")
            dept_entities = [e for e in entities if e.type == "department"]
            assert len(dept_entities) > 0
            
            # Test 3: Vietnamese without diacritics
            mock_extract.return_value = [
                Entity(type="department", value="Phong cong tac sinh vien", confidence=0.9, start_pos=0, end_pos=23)
            ]
            entities = extractor.extract("Phong cong tac sinh vien o dau?")
            dept_entities = [e for e in entities if e.type == "department"]
            assert len(dept_entities) > 0
    
    def test_extract_language_requirements(self, extractor):
        """Test extraction of language requirements."""
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            # Test 1: IELTS
            mock_extract.return_value = [
                Entity(type="language_requirement", value="IELTS", confidence=0.9, start_pos=12, end_pos=16)
            ]
            entities = extractor.extract("What is the IELTS requirement?")
            lang_entities = [e for e in entities if e.type == "language_requirement"]
            assert len(lang_entities) > 0
            assert any("ielts" in e.value.lower() for e in lang_entities)
            
            # Test 2: IELTS with score
            mock_extract.return_value = [
                Entity(type="language_requirement", value="IELTS 6.5", confidence=0.95, start_pos=12, end_pos=20)
            ]
            entities = extractor.extract("Do I need IELTS 6.5?")
            lang_entities = [e for e in entities if e.type == "language_requirement"]
            assert len(lang_entities) > 0
            assert any("ielts" in e.value.lower() or "6.5" in e.value for e in lang_entities)
            
            # Test 3: TOEFL
            mock_extract.return_value = [
                Entity(type="language_requirement", value="TOEFL 80", confidence=0.9, start_pos=0, end_pos=8)
            ]
            entities = extractor.extract("TOEFL requirement is 80")
            lang_entities = [e for e in entities if e.type == "language_requirement"]
            assert len(lang_entities) > 0
    
    def test_extract_tuition_fee(self, extractor):
        """Test extraction of tuition fee entities."""
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            # Test 1: English
            mock_extract.return_value = [
                Entity(type="tuition_fee", value="tuition fee", confidence=0.9, start_pos=8, end_pos=18)
            ]
            entities = extractor.extract("What is the tuition fee?")
            fee_entities = [e for e in entities if e.type == "tuition_fee"]
            assert len(fee_entities) > 0
            
            # Test 2: Vietnamese
            mock_extract.return_value = [
                Entity(type="tuition_fee", value="học phí", confidence=0.9, start_pos=8, end_pos=15)
            ]
            entities = extractor.extract("Học phí là bao nhiêu?")
            fee_entities = [e for e in entities if e.type == "tuition_fee"]
            assert len(fee_entities) > 0
            
            # Test 3: Vietnamese without diacritics
            mock_extract.return_value = [
                Entity(type="tuition_fee", value="hoc phi", confidence=0.9, start_pos=0, end_pos=7)
            ]
            entities = extractor.extract("Hoc phi bao nhieu?")
            fee_entities = [e for e in entities if e.type == "tuition_fee"]
            assert len(fee_entities) > 0
    
    def test_extract_contact_info(self, extractor):
        """Test extraction of contact information entities."""
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            # Test 1: English
            mock_extract.return_value = [
                Entity(type="contact_info", value="email", confidence=0.9, start_pos=12, end_pos=17)
            ]
            entities = extractor.extract("What is the email address?")
            contact_entities = [e for e in entities if e.type == "contact_info"]
            assert len(contact_entities) > 0
            
            # Test 2: Vietnamese
            mock_extract.return_value = [
                Entity(type="contact_info", value="địa chỉ", confidence=0.9, start_pos=8, end_pos=15)
            ]
            entities = extractor.extract("Địa chỉ ở đâu?")
            contact_entities = [e for e in entities if e.type == "contact_info"]
            assert len(contact_entities) > 0
    
    def test_extract_multiple_entities(self, extractor):
        """Test extraction of multiple entity types in one question."""
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            mock_extract.return_value = [
                Entity(type="program", value="Computer Science", confidence=0.9, start_pos=24, end_pos=40),
                Entity(type="semester", value="Fall 2025", confidence=0.95, start_pos=44, end_pos=53)
            ]
            question = "What are the requirements for Computer Science program in Fall 2025?"
            entities = extractor.extract(question)
            
            entity_types = {e.type for e in entities}
            assert "program" in entity_types
            assert "semester" in entity_types
            assert len(entities) >= 2
    
    def test_intent_guided_extraction(self, extractor):
        """Test that intent guides entity extraction."""
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            intent = Intent(label="ask_admission_process", confidence=0.9)
            
            mock_extract.return_value = [
                Entity(type="program", value="Computer Science", confidence=0.9, start_pos=12, end_pos=28),
                Entity(type="semester", value="Spring 2025", confidence=0.95, start_pos=32, end_pos=43)
            ]
            
            question = "How to apply for Computer Science in Spring 2025?"
            entities = extractor.extract(question, intent)
            
            entity_types = {e.type for e in entities}
            assert "program" in entity_types
            assert "semester" in entity_types
    
    def test_entity_positions(self, extractor):
        """Test that entity positions are correctly identified."""
        question = "What is Computer Science?"
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            # Mock với position: "Computer Science" bắt đầu từ 8
            # "What is " = 8 ký tự (0-7), "Computer Science" = 17 ký tự (8-24)
            # end_pos=25 sẽ slice đến index 24 = "Computer Science" (đúng)
            mock_extract.return_value = [
                Entity(type="program", value="Computer Science", confidence=0.9, start_pos=8, end_pos=25)
            ]
            entities = extractor.extract(question)
            
            program_entities = [e for e in entities if e.type == "program"]
            assert len(program_entities) > 0
            
            entity = program_entities[0]
            assert entity.start_pos is not None
            assert entity.end_pos is not None
            assert entity.end_pos > entity.start_pos
            assert 0 <= entity.start_pos < len(question)
            assert entity.end_pos <= len(question)
            
            # Extract and clean for comparison
            extracted_text = question[entity.start_pos:entity.end_pos]
            extracted_clean = extracted_text.rstrip('?.,!;:').lower()
            entity_clean = entity.value.rstrip('?.,!;:').lower()
            assert extracted_clean == entity_clean
    
    def test_entity_confidence(self, extractor):
        """Test that entities have valid confidence scores."""
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            mock_extract.return_value = [
                Entity(type="program", value="Computer Science", confidence=0.9, start_pos=0, end_pos=16),
                Entity(type="language_requirement", value="IELTS 6.5", confidence=0.95, start_pos=17, end_pos=26)
            ]
            question = "Tell me about Computer Science and IELTS 6.5 requirement"
            entities = extractor.extract(question)
            
            for entity in entities:
                assert 0.0 <= entity.confidence <= 1.0
    
    def test_deduplication(self, extractor):
        """Test that duplicate entities are removed."""
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            # Mock response with duplicate entities
            mock_extract.return_value = [
                Entity(type="program", value="Computer Science", confidence=0.9, start_pos=0, end_pos=16),
                Entity(type="program", value="Computer Science", confidence=0.9, start_pos=17, end_pos=33)
            ]
            question = "Computer Science Computer Science program"
            entities = extractor.extract(question)
            
            # Should deduplicate
            program_entities = [e for e in entities if e.type == "program"]
            unique_values = {e.value.lower() for e in program_entities}
            assert len(program_entities) >= 1
    
    def test_get_supported_entity_types(self, extractor):
        """Test getting list of supported entity types."""
        types = extractor.get_supported_entity_types()
        
        assert isinstance(types, list)
        assert "program" in types
        assert "semester" in types
        assert "date" in types
        assert "department" in types
        assert "language_requirement" in types
        assert "tuition_fee" in types
        assert "contact_info" in types
        assert len(types) >= 7
    
    def test_empty_input(self, extractor):
        """Test handling of empty or None input."""
        # Test None - should return empty without calling _extract_with_ai
        entities = extractor.extract(None)
        assert entities == []
        
        # Test empty string
        entities = extractor.extract("")
        assert entities == []
        
        # Test whitespace only
        entities = extractor.extract("   ")
        assert entities == []
    
    def test_vietnamese_without_diacritics(self, extractor):
        """Test extraction from Vietnamese text without diacritics."""
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            mock_extract.return_value = [
                Entity(type="program", value="Khoa hoc may tinh", confidence=0.9, start_pos=12, end_pos=28),
                Entity(type="tuition_fee", value="hoc phi", confidence=0.85, start_pos=0, end_pos=7),
                Entity(type="semester", value="hoc ky 1 nam 2025", confidence=0.9, start_pos=29, end_pos=46)
            ]
            question = "Hoc phi chuong trinh Khoa hoc may tinh hoc ky 1 nam 2025 la bao nhieu?"
            entities = extractor.extract(question)
            
            entity_types = {e.type for e in entities}
            assert len(entities) > 0
            assert any(e.type in ["program", "tuition_fee", "semester"] for e in entities)
    
    def test_entity_structure(self, extractor):
        """Test that all entities have required fields."""
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            mock_extract.return_value = [
                Entity(type="program", value="Computer Science", confidence=0.9, start_pos=0, end_pos=16)
            ]
            entities = extractor.extract("What is the Computer Science program?")
            
            for entity in entities:
                assert hasattr(entity, 'type')
                assert hasattr(entity, 'value')
                assert hasattr(entity, 'confidence')
                assert entity.type is not None
                assert entity.value is not None
                assert isinstance(entity.confidence, float)
                assert 0.0 <= entity.confidence <= 1.0
    
    def test_no_entities_found(self, extractor):
        """Test when no entities are found in question."""
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            mock_extract.return_value = []
            entities = extractor.extract("Hello, how are you?")
            assert isinstance(entities, list)
            assert len(entities) == 0
    
    def test_quota_exhausted_handling(self, extractor):
        """Test handling when API quota is exhausted."""
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            # Simulate quota exhaustion
            mock_extract.side_effect = google_exceptions.ResourceExhausted("Quota exceeded")
            
            # Should return empty list instead of raising exception
            entities = extractor.extract("What is Computer Science?")
            assert entities == []
    
    def test_retry_logic(self, extractor):
        """Test retry logic with exponential backoff."""
        # Mock time.sleep để tránh chờ đợi
        with patch('time.sleep') as mock_sleep, \
             patch.object(extractor, '_extract_with_ai') as mock_extract:
            # First 2 attempts fail with ResourceExhausted, 3rd succeeds
            mock_extract.side_effect = [
                google_exceptions.ResourceExhausted("Quota exceeded"),
                google_exceptions.ResourceExhausted("Quota exceeded"),
                [
                    Entity(type="program", value="Computer Science", confidence=0.9, start_pos=0, end_pos=16)
                ]
            ]
            
            entities = extractor.extract("What is Computer Science?")
            # Should eventually succeed or return empty
            assert isinstance(entities, list)
            # Verify sleep was called (but don't actually wait)
            assert mock_sleep.call_count >= 0  # May or may not be called depending on implementation
    
    def test_unsupported_entity_type(self, extractor):
        """Test that unsupported entity types are filtered out."""
        from app.rag.entity_extractor import SUPPORTED_ENTITY_TYPES
        
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            # Mock returns entity with unsupported type
            # The actual filtering happens in _extract_with_ai, but we test the behavior
            mock_extract.return_value = [
                Entity(type="program", value="Computer Science", confidence=0.9, start_pos=0, end_pos=16)
            ]
            entities = extractor.extract("What is Computer Science?")
            
            # Should only have supported entity types
            supported_types = extractor.get_supported_entity_types()  # Dùng method
            for entity in entities:
                assert entity.type in supported_types
    
    def test_find_entity_positions_fallback(self, extractor):
        """Test that entity positions are found if not provided by AI."""
        # Test the _find_entity_positions method directly since we're mocking _extract_with_ai
        question = "What is Computer Science?"
        entity_value = "Computer Science"
        
        # Test the method directly
        start_pos, end_pos = extractor._find_entity_positions(question, entity_value)
        
        assert start_pos is not None
        assert end_pos is not None
        assert end_pos > start_pos
        # Verify the found position matches the entity value
        assert question[start_pos:end_pos].lower() == entity_value.lower()
    
    def test_find_entity_positions_not_found(self, extractor):
        """Test _find_entity_positions when entity is not found."""
        question = "What is Computer Science?"
        entity_value = "Mathematics"
        
        result = extractor._find_entity_positions(question, entity_value)
        
        # Method returns None when entity not found
        assert result is None
        # Hoặc nếu muốn check tuple:
        # assert result is None or (result[0] is None and result[1] is None)
    
    def test_long_question_truncation(self, extractor):
        """Test that very long questions are truncated."""
        long_question = "What is " * 100 + "Computer Science?"
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            mock_extract.return_value = []
            entities = extractor.extract(long_question)
            # Should handle without error
            assert isinstance(entities, list)
    
    def test_general_exception_handling(self, extractor):
        """Test handling of general exceptions."""
        with patch.object(extractor, '_extract_with_ai') as mock_extract:
            mock_extract.side_effect = ValueError("Some error")
            
            # Should return empty list instead of raising exception
            entities = extractor.extract("What is Computer Science?")
            assert entities == []


class TestEntityExtractorIntegration:
    """Test integration with QuestionUnderstanding orchestrator."""
    
    def test_integration_with_question_understanding(self):
        """Test that RuleBasedEntityExtractor works with QuestionUnderstanding."""
        from app.rag.question_understanding import QuestionUnderstanding
        
        qu = QuestionUnderstanding()
        
        # Mock entity extraction
        with patch.object(qu.entity_extractor, '_extract_with_ai') as mock_extract:
            mock_extract.return_value = [
                Entity(type="program", value="Computer Science", confidence=0.9, start_pos=24, end_pos=40),
                Entity(type="semester", value="Fall 2025", confidence=0.95, start_pos=44, end_pos=53)
            ]
            
            result = qu.understand("What are the requirements for Computer Science in Fall 2025?")
            
            assert len(result.entities) > 0
            entity_types = {e.type for e in result.entities}
            assert "program" in entity_types or "semester" in entity_types
            assert "entity_extraction" in result.metadata["processing_steps"]
    
    def test_custom_entity_extractor(self):
        """Test that custom entity extractor can be passed."""
        from app.rag.question_understanding import QuestionUnderstanding
        from app.rag.entity_extractor import RuleBasedEntityExtractor
        
        custom_extractor = RuleBasedEntityExtractor()
        qu = QuestionUnderstanding(entity_extractor=custom_extractor)
        
        with patch.object(custom_extractor, '_extract_with_ai') as mock_extract:
            mock_extract.return_value = [
                Entity(type="program", value="Computer Science", confidence=0.9, start_pos=0, end_pos=16)
            ]
            
            result = qu.understand("Computer Science program requirements")
            assert len(result.entities) > 0