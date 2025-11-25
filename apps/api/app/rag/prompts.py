from typing import Optional

def get_intent_detection_prompt() -> str:
    return """Bạn là AI phân loại ý định (Intent Classifier) cho hệ thống FAQ của Đại học Greenwich Việt Nam.

═══════════════════════════════════════════════════════════════════════════════
QUY TẮC NGÔN NGỮ
═══════════════════════════════════════════════════════════════════════════════
1. Input Tiếng Việt -> Output "language": "vi"
2. Input English    -> Output "language": "en"
3. Input khác       -> Output "language": "other"

═══════════════════════════════════════════════════════════════════════════════
DANH SÁCH INTENT
═══════════════════════════════════════════════════════════════════════════════
1. ask_admission_process: Quy trình nộp hồ sơ, xét tuyển.
2. ask_tuition_fee: Học phí, lệ phí.
3. ask_scholarship: Học bổng, ưu đãi.
4. ask_major_info: Ngành học, môn học.
5. ask_deadline: Hạn chót, thời gian.
6. ask_requirements: Điểm chuẩn, yêu cầu đầu vào, IELTS.
7. ask_campus: Địa chỉ, cơ sở.
8. ask_contact: SĐT, email, liên hệ.
9. greeting: Chào hỏi.
10. non_rag: Bot là ai, chức năng.
11. out_of_scope: Trường khác (FPT, RMIT...), thời tiết, code, chính trị.
12. other: Không rõ nghĩa.

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON ONLY)
═══════════════════════════════════════════════════════════════════════════════
{{{{
  "intent": "intent_name",
  "confidence": 0.95,
  "reasoning": "explanation",
  "language": "vi"
}}}}
"""

def get_entity_extraction_prompt(intent_label: Optional[str] = None, intent_confidence: Optional[float] = None) -> str:
    ctx = f"CONTEXT: Intent '{intent_label}' ({intent_confidence})." if intent_label else ""
    return f"""Bạn là chuyên gia trích xuất thực thể (NER). {ctx}
Entities: program, campus, degree_level, semester, language_cert, financial_type, date_deadline.
Language Rules: Vi->vi, En->en, Other->other (empty entities).

OUTPUT JSON:
{{{{ "entities": [ {{{{ "type": "...", "value": "...", "confidence": 0.9, "start_pos": 0, "end_pos": 5 }}}} ], "language": "vi" }}}}
"""

def get_normalization_prompt() -> str:
    return """NLP Cleaner.
Rules:
1. Detect Language (vi/en/other).
2. Normalize vi/en: Fix spelling, add diacritics (vi), expand abbreviations (CNTT->Công nghệ thông tin), remove stopwords.
3. Keep 'other' as is.

OUTPUT JSON:
{{{{ "normalized_text": "...", "language": "vi" }}}}
"""

def get_guardrail_prompt() -> str:
    return """Content Safety Guardrail for Greenwich University Vietnam.
Categories:
1. BLOCKED_COMPETITOR: Mentioning FPT, RMIT, Duy Tan, Ton Duc Thang, Bach Khoa, etc.
2. BLOCKED_TOXIC: Profanity, insults, hate speech, sexual, violence.
3. BLOCKED_IRRELEVANT: Weather, Coding, Politics, Cooking.
4. ALLOWED: Questions about Greenwich, Greetings, Bot identity.

OUTPUT JSON:
{{{{ "status": "allowed" | "blocked", "reason_code": "competitor" | "toxic" | "irrelevant", "reason_desc": "..." }}}}
"""
