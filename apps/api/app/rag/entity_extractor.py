from __future__ import annotations
import re
import logging
from typing import Dict, List, Optional, Tuple
from app.rag.question_understanding import Entity, EntityExtractor, Intent
logger = logging.getLogger(__name__)

class RuleBasedEntityExtractor(EntityExtractor):    
    def __init__(self):
        self.program_names: List[str] = [
            "computer science", "cs", "computer engineering", "ce",
            "software engineering", "information technology", "it",
            "data science", "artificial intelligence", "ai",
            "cybersecurity", "network engineering",
            "business administration", "business", "mba",
            "accounting", "finance", "marketing", "management",
            "international business", "ib",
            "engineering", "electrical engineering", "mechanical engineering",
            "civil engineering",
            "design", "graphic design", "fashion design",
            "education", "psychology", "english",
            "khoa học máy tính", "công nghệ thông tin", "cntt",
            "quản trị kinh doanh", "qtkd", "kế toán", "tài chính",
        ]
        self.semester_patterns: List[Tuple[str, str]] = [
            (r'\b(fall|autumn)\s+(\d{4})\b', 'semester'),
            (r'\b(spring|summer|winter)\s+(\d{4})\b', 'semester'), 
            (r'\b(intake|intake\s+period)\s+(\d{4})\b', 'semester'),  
            (r'\b(\d{4})\s+(fall|autumn|spring|summer|winter)\b', 'semester'), 
            (r'\bfall\s+(\d{4})\b', 'semester'),  
            (r'\bspring\s+(\d{4})\b', 'semester'), 
            (r'\b(học\s+kỳ|học\s+kì)\s+(\d+)\b', 'semester'),  
            (r'\b(mùa|kỳ)\s+(thu|đông|xuân|hè)\s+(\d{4})\b', 'semester'),  
        ]
        self.date_patterns: List[Tuple[str, str]] = [
            (r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b', 'date'),  
            (r'\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b', 'date'),
            (r'\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})\b', 'date'),
            (r'\b(today|tomorrow|next\s+week|next\s+month|next\s+year)\b', 'date'),
            (r'\b(deadline|due\s+date|closing\s+date)\b', 'deadline_keyword'),
            (r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b', 'date'), 
            (r'\b(ngày|hạn\s+chót|hạn\s+nộp)\s+(\d{1,2})\s+(tháng|ngày)\s+(\d{1,2})\b', 'date'),
        ]
        self.department_names: List[str] = [
            "student affairs", "student affairs department", "student affairs office",
            "admissions", "admissions office", "admissions department",
            "academic affairs", "academic department",
            "financial aid", "finance department",
            "registrar", "registrar office",
            "international office", "international department",
            "phòng công tác sinh viên", "ctsv", "phòng tài chính",
            "phòng tuyển sinh", "phòng đào tạo",
        ]
        self.language_requirements: List[str] = [
            "ielts", "toefl", "toeic", "cambridge",
            "ielts score", "toefl score", "ielts requirement", "toefl requirement",
            "ielts 6.0", "toefl 80", "ielts 6.5", "toefl 90",
            "chứng chỉ ielts", "chứng chỉ toefl", "điểm ielts", "điểm toefl",
        ]
        self.domain_terms: Dict[str, List[str]] = {
            "scholarship": ["scholarship", "học bổng", "financial aid", "trợ cấp"],
            "gpa": ["gpa", "grade point average", "điểm trung bình"],
            "credit": ["credit", "tín chỉ"],
            "tuition": ["tuition", "tuition fee", "học phí"],
        }
    
    def extract(self, question: str, intent: Optional[Intent] = None) -> List[Entity]:
        if question is None:
            logger.warning("None question received in entity extractor")
            return []
        if not question or not question.strip():
            logger.debug("Empty question received in entity extractor")
            return []
        try:
            normalized_q = question.lower()
            entities: List[Entity] = []
            used_positions: set = set()
            if intent:
                if intent.label == "ask_admission_process":
                    entities.extend(self._extract_programs(normalized_q, question, used_positions))
                    entities.extend(self._extract_semesters(normalized_q, question, used_positions))
                    entities.extend(self._extract_departments(normalized_q, question, used_positions))
                elif intent.label == "ask_tuition_fee":
                    entities.extend(self._extract_programs(normalized_q, question, used_positions))
                    entities.extend(self._extract_semesters(normalized_q, question, used_positions))
                    entities.extend(self._extract_domain_terms(normalized_q, question, used_positions, ["tuition"]))
                elif intent.label == "ask_deadline":
                    entities.extend(self._extract_dates(normalized_q, question, used_positions))
                    entities.extend(self._extract_semesters(normalized_q, question, used_positions))
                elif intent.label == "ask_requirements":
                    entities.extend(self._extract_language_requirements(normalized_q, question, used_positions))
                    entities.extend(self._extract_programs(normalized_q, question, used_positions))
                    entities.extend(self._extract_domain_terms(normalized_q, question, used_positions, ["gpa", "scholarship"]))
                elif intent.label == "ask_schedule":
                    entities.extend(self._extract_semesters(normalized_q, question, used_positions))
                    entities.extend(self._extract_dates(normalized_q, question, used_positions))
                elif intent.label == "ask_contact":
                    entities.extend(self._extract_departments(normalized_q, question, used_positions))
                else:
                    entities.extend(self._extract_all_entities(normalized_q, question, used_positions))
            else:
                entities.extend(self._extract_all_entities(normalized_q, question, used_positions))
            unique_entities = self._deduplicate_entities(entities)
            return unique_entities
        except Exception as e:
            logger.error(f"Entity extraction error: {e}", exc_info=True)
            return []
    
    def _extract_all_entities(
        self, 
        normalized_q: str, 
        original_q: str, 
        used_positions: set
    ) -> List[Entity]:
        entities = []
        entities.extend(self._extract_programs(normalized_q, original_q, used_positions))
        entities.extend(self._extract_semesters(normalized_q, original_q, used_positions))
        entities.extend(self._extract_dates(normalized_q, original_q, used_positions))
        entities.extend(self._extract_departments(normalized_q, original_q, used_positions))
        entities.extend(self._extract_language_requirements(normalized_q, original_q, used_positions))
        entities.extend(self._extract_domain_terms(normalized_q, original_q, used_positions))
        return entities
    
    def _extract_programs(
        self, 
        normalized_q: str, 
        original_q: str, 
        used_positions: set
    ) -> List[Entity]:
        entities = []
        for program in self.program_names:
            pattern = r'\b' + re.escape(program.lower()) + r'\b'
            matches = list(re.finditer(pattern, normalized_q, re.IGNORECASE))
            for match in matches:
                start, end = match.span()
                position_key = (start, end, "program")
                if position_key in used_positions:
                    continue
                value = original_q[start:end]
                confidence = 0.8 if len(program.split()) == 1 else 1.0
                entities.append(Entity(
                    type="program",
                    value=value,
                    confidence=confidence,
                    start_pos=start,
                    end_pos=end,
                ))
                used_positions.add(position_key)
        return entities
    
    def _extract_semesters(
        self, 
        normalized_q: str, 
        original_q: str, 
        used_positions: set
    ) -> List[Entity]:
        entities = []
        for pattern, entity_type in self.semester_patterns:
            matches = list(re.finditer(pattern, normalized_q, re.IGNORECASE))
            for match in matches:
                start, end = match.span()
                position_key = (start, end, entity_type)
                if position_key in used_positions:
                    continue
                value = original_q[start:end]
                normalized_value = ' '.join(word.capitalize() for word in value.split())
                entities.append(Entity(
                    type="semester",
                    value=normalized_value,
                    confidence=0.9,
                    start_pos=start,
                    end_pos=end,
                ))
                used_positions.add(position_key)
        return entities
    
    def _extract_dates(
        self, 
        normalized_q: str, 
        original_q: str, 
        used_positions: set
    ) -> List[Entity]:
        entities = []
        for pattern, entity_type in self.date_patterns:
            matches = list(re.finditer(pattern, normalized_q, re.IGNORECASE))
            for match in matches:
                start, end = match.span()
                position_key = (start, end, entity_type)
                if position_key in used_positions:
                    continue
                value = original_q[start:end]
                if entity_type == "deadline_keyword":
                    entity_type = "deadline"
                    confidence = 0.7  
                else:
                    entity_type = "date"
                    confidence = 0.9
                entities.append(Entity(
                    type=entity_type,
                    value=value,
                    confidence=confidence,
                    start_pos=start,
                    end_pos=end,
                ))
                used_positions.add(position_key)
        return entities
    
    def _extract_departments(
        self, 
        normalized_q: str, 
        original_q: str, 
        used_positions: set
    ) -> List[Entity]:
        entities = []
        for dept in self.department_names:
            pattern = r'\b' + re.escape(dept.lower()) + r'\b'
            matches = list(re.finditer(pattern, normalized_q, re.IGNORECASE))
            for match in matches:
                start, end = match.span()
                position_key = (start, end, "department")
                if position_key in used_positions:
                    continue
                value = original_q[start:end]
                entities.append(Entity(
                    type="department",
                    value=value,
                    confidence=0.85,
                    start_pos=start,
                    end_pos=end,
                ))
                used_positions.add(position_key)
        return entities
    
    def _extract_language_requirements(
        self, 
        normalized_q: str, 
        original_q: str, 
        used_positions: set
    ) -> List[Entity]:
        entities = []
        for lang_req in self.language_requirements:
            pattern = r'\b' + re.escape(lang_req.lower()) + r'\b'
            matches = list(re.finditer(pattern, normalized_q, re.IGNORECASE))
            for match in matches:
                start, end = match.span()
                position_key = (start, end, "language_requirement")
                if position_key in used_positions:
                    continue
                value = original_q[start:end]
                confidence = 0.95 if re.search(r'\d+', value) else 0.85
                entities.append(Entity(
                    type="language_requirement",
                    value=value,
                    confidence=confidence,
                    start_pos=start,
                    end_pos=end,
                ))
                used_positions.add(position_key)
        return entities
    
    def _extract_domain_terms(
        self, 
        normalized_q: str, 
        original_q: str, 
        used_positions: set,
        term_types: Optional[List[str]] = None
    ) -> List[Entity]:
        entities = []
        if term_types is None:
            term_types = list(self.domain_terms.keys())
        for term_type in term_types:
            if term_type not in self.domain_terms:
                continue
            for term in self.domain_terms[term_type]:
                pattern = r'\b' + re.escape(term.lower()) + r'\b'
                matches = list(re.finditer(pattern, normalized_q, re.IGNORECASE))
                for match in matches:
                    start, end = match.span()
                    position_key = (start, end, term_type)
                    if position_key in used_positions:
                        continue
                    value = original_q[start:end]
                    entities.append(Entity(
                        type=term_type,
                        value=value,
                        confidence=0.8,
                        start_pos=start,
                        end_pos=end,
                    ))
                    used_positions.add(position_key)
        return entities
    
    def _deduplicate_entities(self, entities: List[Entity]) -> List[Entity]:
        seen = set()
        unique = []
        for entity in entities:
            key = (entity.type.lower(), entity.value.lower().strip())
            if key not in seen:
                seen.add(key)
                unique.append(entity)
        return unique
    
    def get_supported_entity_types(self) -> List[str]:
        return [
            "program",
            "semester",
            "date",
            "deadline",
            "department",
            "language_requirement",
            "scholarship",
            "gpa",
            "credit",
            "tuition",
        ]