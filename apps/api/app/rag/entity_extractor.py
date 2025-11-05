from __future__ import annotations
import json
import re
import logging
import time
from typing import Dict, List, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from google.api_core import exceptions as google_exceptions
from app.rag.question_understanding import Entity, EntityExtractor, Intent
from app.core.config import settings

logger = logging.getLogger(__name__)

# Supported entity types
SUPPORTED_ENTITY_TYPES = [
    "program",
    "semester",
    "date",
    "deadline",
    "department",
    "language_requirement",
    "tuition_fee",
    "contact_info",
]

class RuleBasedEntityExtractor(EntityExtractor):
    def __init__(self):
        # Initialize AI components
        try:
            self.ai_llm = ChatGoogleGenerativeAI(
                model=settings.LLM_MODEL,
                temperature=0.1,  # Lower temperature for more consistent entity extraction
                max_output_tokens=1024,
                google_api_key=settings.GOOGLE_API_KEY,
            )
            self.ai_parser = StrOutputParser()
        except Exception as e:
            logger.warning(f"Failed to initialize AI components: {e}. Will use fallback only.")
            self.ai_llm = None
            self.ai_parser = None
    
    def extract(self, question: str, intent: Optional[Intent] = None) -> List[Entity]:
        # Input validation
        if not question or not question.strip():
            logger.debug("Empty question received in entity extractor")
            return []
        
        # Try AI-based extraction first
        try:
            ai_entities = self._extract_with_ai(question, intent)
            if ai_entities is not None:
                return ai_entities
        except google_exceptions.ResourceExhausted as e:
            logger.warning(f"Quota exhausted in entity extraction: {e}")
            return []
        except Exception as e:
            logger.warning(f"AI-based entity extraction failed: {e}. Returning empty list.")
        
        # Fallback: return empty list
        return []
    
    def _extract_with_ai(self, question: str, intent: Optional[Intent] = None) -> Optional[List[Entity]]:
        """Extract entities using Gemini AI with retry logic."""
        if not self.ai_llm or not self.ai_parser:
            return None
        
        max_retries = 3
        base_delay = 1.0
        
        for attempt in range(max_retries):
            try:
                # Build prompt
                prompt = self._build_unified_prompt(intent)
                prompt_template = ChatPromptTemplate.from_messages([
                    ("system", prompt),
                    ("human", "{question}"),
                ])
                
                # Build chain
                chain = prompt_template | self.ai_llm | self.ai_parser
                
                # Invoke
                response = chain.invoke({"question": question})
                
                # Parse JSON response
                response = response.strip()
                # Remove markdown code blocks if present
                if response.startswith("```json"):
                    response = response[7:]
                if response.startswith("```"):
                    response = response[3:]
                if response.endswith("```"):
                    response = response[:-3]
                response = response.strip()
                
                # Parse JSON
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
                
                # Parse entities
                entities_data = result.get("entities", [])
                if not isinstance(entities_data, list):
                    logger.warning(f"Expected list of entities, got {type(entities_data)}")
                    return []
                
                entities = []
                for entity_data in entities_data:
                    if not isinstance(entity_data, dict):
                        continue
                    
                    entity_type = entity_data.get("type", "").lower()
                    if entity_type not in SUPPORTED_ENTITY_TYPES:
                        logger.debug(f"Skipping unsupported entity type: {entity_type}")
                        continue
                    
                    value = entity_data.get("value", "").strip()
                    if not value:
                        continue
                    
                    confidence = float(entity_data.get("confidence", 0.5))
                    confidence = max(0.0, min(1.0, confidence))
                    
                    start_pos = entity_data.get("start_pos")
                    end_pos = entity_data.get("end_pos")
                    
                    # If positions are missing or invalid, try to find them
                    if start_pos is None or end_pos is None or start_pos < 0 or end_pos > len(question):
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
                
                # Deduplicate entities
                unique_entities = self._deduplicate_entities(entities)
                return unique_entities
                
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
                logger.error(f"AI entity extraction error (attempt {attempt + 1}/{max_retries}): {e}", exc_info=True)
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    time.sleep(delay)
                    continue
                else:
                    return None
        
        return None
    
    def _find_entity_positions(self, question: str, entity_value: str) -> Optional[tuple]:
        """Fallback method to find entity positions if AI doesn't provide them."""
        if not entity_value:
            return None
        
        # Try exact match first (case-insensitive)
        pattern = re.escape(entity_value)
        matches = list(re.finditer(pattern, question, re.IGNORECASE))
        if matches:
            match = matches[0]
            return (match.start(), match.end())
        
        # Try to find substring match
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
        intent_info = ""
        if intent:
            intent_info = f"\nDetected Intent: {intent.label} (confidence: {intent.confidence})\nUse this intent to guide entity extraction - focus on entities relevant to this intent."
        
        # Build prompt without using f-string or .format() to avoid LangChain parsing issues
        prompt_parts = [
            "Đây là hệ thống FAQ của trường Greenwich University Việt Nam, phục vụ sinh viên và người quan tâm đến thông tin tuyển sinh.",
            "",
            "This is the FAQ system of Greenwich University Vietnam, serving students and those interested in admission information.",
            "",
            "Từ user input này hãy extract các entities (thực thể) từ câu hỏi.",
            "",
            "From this user input, extract entities from the question.",
            "",
            "QUAN TRỌNG / IMPORTANT:",
            "- Tự động detect ngôn ngữ của user input (tiếng Việt có dấu, không dấu, hoặc tiếng Anh)",
            "- Automatically detect the language of user input (Vietnamese with/without diacritics, or English)",
            "- Nếu user input là tiếng Việt (có dấu hoặc không dấu) → trả về response bằng tiếng Việt",
            "- If user input is Vietnamese (with or without diacritics) → return response in Vietnamese",
            "- Nếu user input là tiếng Anh hoặc ngôn ngữ khác → trả về response bằng tiếng Anh",
            "- If user input is English or other languages → return response in English",
            '- Trả về "language" field: "vi" nếu tiếng Việt, "en" nếu tiếng Anh hoặc ngôn ngữ khác',
            '- Return "language" field: "vi" if Vietnamese, "en" if English or other languages',
            intent_info,
            "Các entity types được support là / Supported entity types are:",
            "",
            '1. program: Tên chương trình học / Program name',
            '   Example: "Computer Science", "CS", "Khoa học máy tính", "Khoa hoc may tinh" (không dấu), "Business Administration", "Quản trị kinh doanh"',
            "",
            '2. semester: Học kỳ, kỳ nhập học / Semester, intake period',
            '   Example: "Fall 2025", "Spring 2025", "Học kỳ 1 năm 2025", "Hoc ky 1 nam 2025" (không dấu), "Semester 1", "Kỳ mùa thu"',
            "",
            '3. date: Ngày tháng cụ thể / Specific date',
            '   Example: "March 15, 2025", "15/03/2025", "15 tháng 3", "15 thang 3" (không dấu)',
            "",
            '4. deadline: Hạn chót, deadline / Deadline, due date',
            '   Example: "deadline", "hạn chót", "han chot" (không dấu), "due date", "thời hạn"',
            "",
            '5. department: Phòng ban, khoa / Department, office',
            '   Example: "Student Affairs", "Phòng công tác sinh viên", "Phong cong tac sinh vien" (không dấu), "Admissions Office", "Phòng tuyển sinh"',
            "",
            '6. language_requirement: Yêu cầu ngôn ngữ / Language requirement',
            '   Example: "IELTS 6.5", "TOEFL 80", "IELTS", "yêu cầu IELTS", "yeu cau IELTS" (không dấu)',
            "",
            '7. tuition_fee: Học phí, chi phí / Tuition fee, cost',
            '   Example: "tuition fee", "học phí", "hoc phi" (không dấu), "cost", "chi phí"',
            "",
            '8. contact_info: Thông tin liên hệ / Contact information',
            '   Example: "email", "phone", "địa chỉ", "dia chi" (không dấu), "address", "contact"',
            "",
            "Yêu cầu / Requirements:",
            "- Phân tích kỹ câu hỏi của người dùng / Carefully analyze the user's question",
            "- Extract TẤT CẢ các entities có trong câu hỏi / Extract ALL entities present in the question",
            "- Mỗi entity phải có: type, value, confidence, start_pos, end_pos",
            "- Each entity must have: type, value, confidence, start_pos, end_pos",
            "- start_pos và end_pos là vị trí của entity trong câu hỏi gốc (0-based index)",
            "- start_pos and end_pos are positions of entity in original question (0-based index)",
            "- Confidence score: 0.0-1.0 (1.0 = chắc chắn / very confident, 0.5 = không chắc / uncertain)",
            '- Nếu không tìm thấy entity nào → trả về "entities": []',
            '- If no entities found → return "entities": []',
            "- Chỉ extract entities LIÊN QUAN đến trường Greenwich, tuyển sinh, học phí, chương trình học",
            "- Only extract entities RELATED to Greenwich University, admissions, tuition, academic programs",
            "",
            "Hãy trả về response theo đúng chuẩn JSON sau, KHÔNG trả thêm bất kì text nào khác / Return response in the following JSON format exactly, DO NOT add any other text:",
            "",
            '{{',
            '  "entities": [',
            '    {{',
            '      "type": "program",',
            '      "value": "Computer Science",',
            '      "confidence": 0.9,',
            '      "start_pos": 12,',
            '      "end_pos": 28',
            '    }},',
            '    {{',
            '      "type": "semester",',
            '      "value": "Fall 2025",',
            '      "confidence": 0.95,',
            '      "start_pos": 35,',
            '      "end_pos": 44',
            '    }}',
            '  ],',
            '  "language": "en"',
            '}}'
        ]
        
        return "\n".join(part for part in prompt_parts if part)
    
    def get_supported_entity_types(self) -> List[str]:
        return SUPPORTED_ENTITY_TYPES