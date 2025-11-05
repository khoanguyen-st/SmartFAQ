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

logger = logging.getLogger(__name__)

# Supported intents
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
        # Initialize AI components
        try:
            self.ai_llm = ChatGoogleGenerativeAI(
                model=settings.LLM_MODEL,
                temperature=0.1,  # Lower temperature for more consistent intent detection
                max_output_tokens=512,
                google_api_key=settings.GOOGLE_API_KEY,
            )
            self.ai_parser = StrOutputParser()
            self.ai_chain = None  # Will be built dynamically with prompt
        except Exception as e:
            logger.warning(f"Failed to initialize AI components: {e}. Will use fallback only.")
            self.ai_llm = None
            self.ai_parser = None
            self.ai_chain = None
    
    def detect(self, question: str, context: Optional[Dict[str, Any]] = None) -> Intent:
        # Input validation
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
        
        # Try AI-based detection first
        try:
            ai_intent = self._detect_with_ai(question)
            if ai_intent:
                return ai_intent
        except Exception as e:
            logger.warning(f"AI-based intent detection failed: {e}. Falling back to simple fallback.")
        
        # Fallback: return "other" intent with low confidence
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
                # Build prompt
                prompt = self._build_unified_prompt()
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
                
                # Validate and create Intent
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
        return """Đây là hệ thống FAQ của trường Greenwich University Việt Nam, phục vụ sinh viên và người quan tâm đến thông tin tuyển sinh.

This is the FAQ system of Greenwich University Vietnam, serving students and those interested in admission information.

Từ user input này hãy extract intent từ câu hỏi.

From this user input, extract the intent from the question.

QUAN TRỌNG / IMPORTANT:
- Tự động detect ngôn ngữ của user input (tiếng Việt có dấu, không dấu, hoặc tiếng Anh)
- Automatically detect the language of user input (Vietnamese with/without diacritics, or English)
- Nếu user input là tiếng Việt (có dấu hoặc không dấu) → trả về "reasoning" bằng tiếng Việt
- If user input is Vietnamese (with or without diacritics) → return "reasoning" in Vietnamese
- Nếu user input là tiếng Anh hoặc ngôn ngữ khác → trả về "reasoning" bằng tiếng Anh
- If user input is English or other languages → return "reasoning" in English
- Trả về "language" field: "vi" nếu tiếng Việt, "en" nếu tiếng Anh hoặc ngôn ngữ khác
- Return "language" field: "vi" if Vietnamese, "en" if English or other languages

Các intent được support là / Supported intents are:

- ask_admission_process: Câu hỏi về quy trình tuyển sinh, đăng ký, nộp hồ sơ. / Questions about admission process, enrollment, application.
  Example: "Tôi cần support về tuyển sinh", "Lam sao de dang ky?" (không dấu), "How to apply?"

- ask_tuition_fee: Câu hỏi về học phí, chi phí, thanh toán. / Questions about tuition fees, costs, payment.
  Example: "Học phí bao nhiêu?", "Hoc phi bao nhieu?" (không dấu), "What is the tuition fee?"

- ask_deadline: Câu hỏi về hạn chót, deadline, ngày nộp hồ sơ. / Questions about deadlines, due dates, application deadlines.
  Example: "Deadline là khi nào?", "Deadline la khi nao?" (không dấu), "When is the deadline?"

- ask_requirements: Câu hỏi về yêu cầu, điều kiện, tiêu chuẩn tuyển sinh. / Questions about requirements, prerequisites, qualifications.
  Example: "Yêu cầu tuyển sinh là gì?", "Yeu cau tuyen sinh la gi?" (không dấu), "What are the requirements?"

- ask_schedule: Câu hỏi về lịch học, thời khóa biểu. / Questions about class schedules, timetables.
  Example: "Lịch học như thế nào?", "Lich hoc nhu the nao?" (không dấu), "What is the schedule?"

- ask_contact: Câu hỏi về thông tin liên hệ. / Questions about contact information.
  Example: "Làm sao để liên hệ?", "Lam sao de lien he?" (không dấu), "How can I contact?"

- out_of_scope: Câu hỏi NGOÀI phạm vi hệ thống FAQ (ví dụ: thời tiết, nấu ăn, hỏi về trường khác, code, lập trình không liên quan đến trường). / Questions OUTSIDE the scope of the FAQ system (e.g., weather, cooking, asking about other universities, code, programming not related to university).
  Example: "Thời tiết hôm nay?", "Thoi tiet hom nay?" (không dấu), "How to write Python code?"

- other: Câu hỏi không rõ ràng, không thể phân loại được. / Unclear questions that cannot be classified.

Yêu cầu / Requirements:
- Phân tích kỹ câu hỏi của người dùng / Carefully analyze the user's question
- Nếu câu hỏi LIÊN QUAN đến trường Greenwich, tuyển sinh, học phí, chương trình học → Chọn intent phù hợp nhất
- If the question is RELATED to Greenwich University, admissions, tuition, academic programs → Choose the most appropriate intent
- Nếu câu hỏi KHÔNG liên quan đến trường → Chọn "out_of_scope"
- If the question is NOT related to the university → Choose "out_of_scope"
- Confidence score: 0.0-1.0 (1.0 = chắc chắn / very confident, 0.5 = không chắc / uncertain)
- is_in_domain: true nếu câu hỏi liên quan đến trường, false nếu không
- is_in_domain: true if question is related to university, false if not

Hãy trả về response theo đúng chuẩn JSON sau, KHÔNG trả thêm bất kì text nào khác / Return response in the following JSON format exactly, DO NOT add any other text:

{{
  "intent": "ask_admission_process",
  "confidence": 0.9,
  "reasoning": "Người dùng hỏi về quy trình tuyển sinh" (nếu tiếng Việt) hoặc "User is asking about admission process" (nếu tiếng Anh),
  "is_in_domain": true,
  "language": "vi" (nếu tiếng Việt) hoặc "en" (nếu tiếng Anh/ngôn ngữ khác)
}}"""
    
    def get_available_intents(self) -> List[str]:
        return SUPPORTED_INTENTS