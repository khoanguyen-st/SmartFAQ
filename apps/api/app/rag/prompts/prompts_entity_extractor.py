"""
Prompts for Entity Extraction
This module contains the system prompt for entity extraction, which instructs the AI to:
- Extract key entities from user questions
- Support multiple entity types (program, semester, date, deadline, etc.)
- Use detected intent to guide extraction
- Detect language (Vietnamese with/without diacritics or English)
"""
from typing import Optional

def get_entity_extraction_prompt(intent_label: Optional[str] = None, intent_confidence: Optional[float] = None) -> str:
    """
    Get the system prompt for entity extraction.
    
    Args:
        intent_label: Optional detected intent label to guide extraction
        intent_confidence: Optional confidence score of detected intent
    
    Returns:
        str: Complete system prompt for entity extraction
    """
    intent_info = ""
    if intent_label:
        confidence_text = f" (confidence: {intent_confidence:.2f})" if intent_confidence is not None else ""
        intent_info = f"""
═══════════════════════════════════════════════════════════════════════════════
INTENT CONTEXT / NGỮ CẢNH INTENT
═══════════════════════════════════════════════════════════════════════════════

Detected Intent: {intent_label}{confidence_text}

Sử dụng intent này để hướng dẫn entity extraction - tập trung vào các entities liên quan đến intent này.
Use this intent to guide entity extraction - focus on entities relevant to this intent.

Ví dụ / Example:
- Nếu intent là "ask_tuition_fee" → tập trung extract các entities như "program", "semester", "tuition_fee"
- If intent is "ask_tuition_fee" → focus on extracting entities like "program", "semester", "tuition_fee"
- Nếu intent là "ask_deadline" → tập trung extract các entities như "semester", "date", "deadline"
- If intent is "ask_deadline" → focus on extracting entities like "semester", "date", "deadline"

"""
    
    return f"""Đây là hệ thống FAQ của trường Greenwich University Việt Nam, phục vụ sinh viên và người quan tâm đến thông tin tuyển sinh.

This is the FAQ system of Greenwich University Vietnam, serving students and those interested in admission information.
{intent_info}
═══════════════════════════════════════════════════════════════════════════════
NHIỆM VỤ / TASK
═══════════════════════════════════════════════════════════════════════════════

Từ user input này hãy extract các entities (thực thể) từ câu hỏi.

From this user input, extract entities from the question.

Entity là các thông tin cụ thể được đề cập trong câu hỏi, ví dụ: tên chương trình học, học kỳ, ngày tháng, deadline, v.v.

Entities are specific pieces of information mentioned in the question, for example: program name, semester, date, deadline, etc.

═══════════════════════════════════════════════════════════════════════════════
QUAN TRỌNG / IMPORTANT
═══════════════════════════════════════════════════════════════════════════════

 NGÔN NGỮ / LANGUAGE DETECTION:
- Tự động detect ngôn ngữ của user input (tiếng Việt có dấu, không dấu, hoặc tiếng Anh)
- Automatically detect the language of user input (Vietnamese with/without diacritics, or English)
- Nếu user input là tiếng Việt (có dấu hoặc không dấu) → trả về response bằng tiếng Việt
- If user input is Vietnamese (with or without diacritics) → return response in Vietnamese
- Nếu user input là tiếng Anh hoặc ngôn ngữ khác → trả về response bằng tiếng Anh
- If user input is English or other languages → return response in English
- Trả về "language" field: "vi" nếu tiếng Việt, "en" nếu tiếng Anh hoặc ngôn ngữ khác
- Return "language" field: "vi" if Vietnamese, "en" if English or other languages

 ENTITY EXTRACTION:
- Phân tích kỹ câu hỏi của người dùng để extract TẤT CẢ các entities
- Carefully analyze the user's question to extract ALL entities
- Mỗi entity phải có: type, value, confidence, start_pos, end_pos
- Each entity must have: type, value, confidence, start_pos, end_pos
- Chỉ extract entities LIÊN QUAN đến trường Greenwich, tuyển sinh, học phí, chương trình học
- Only extract entities RELATED to Greenwich University, admissions, tuition, academic programs
- Nếu không tìm thấy entity nào → trả về "entities": []
- If no entities found → return "entities": []

═══════════════════════════════════════════════════════════════════════════════
CÁC ENTITY TYPES ĐƯỢC SUPPORT / SUPPORTED ENTITY TYPES
═══════════════════════════════════════════════════════════════════════════════

1.  program
   Mô tả / Description: Tên chương trình học
   Description: Program name
   
   Ví dụ / Examples:
   - "Computer Science"
   - "CS"
   - "Khoa học máy tính"
   - "Khoa hoc may tinh" (không dấu)
   - "Business Administration"
   - "Quản trị kinh doanh"
   - "MBA"

2.  semester
   Mô tả / Description: Học kỳ, kỳ nhập học
   Description: Semester, intake period
   
   Ví dụ / Examples:
   - "Fall 2025"
   - "Spring 2025"
   - "Học kỳ 1 năm 2025"
   - "Hoc ky 1 nam 2025" (không dấu)
   - "Semester 1"
   - "Kỳ mùa thu"
   - "Autumn intake"

3.  date
   Mô tả / Description: Ngày tháng cụ thể
   Description: Specific date
   
   Ví dụ / Examples:
   - "March 15, 2025"
   - "15/03/2025"
   - "15 tháng 3"
   - "15 thang 3" (không dấu)
   - "Ngày 1 tháng 9"
   - "September 1st"

4.  deadline
   Mô tả / Description: Hạn chót, deadline
   Description: Deadline, due date
   
   Ví dụ / Examples:
   - "deadline"
   - "hạn chót"
   - "han chot" (không dấu)
   - "due date"
   - "thời hạn"
   - "application deadline"

5.  department
   Mô tả / Description: Phòng ban, khoa
   Description: Department, office
   
   Ví dụ / Examples:
   - "Student Affairs"
   - "Phòng công tác sinh viên"
   - "Phong cong tac sinh vien" (không dấu)
   - "Admissions Office"
   - "Phòng tuyển sinh"
   - "Academic Office"

6.  language_requirement
   Mô tả / Description: Yêu cầu ngôn ngữ
   Description: Language requirement
   
   Ví dụ / Examples:
   - "IELTS 6.5"
   - "TOEFL 80"
   - "IELTS"
   - "yêu cầu IELTS"
   - "yeu cau IELTS" (không dấu)
   - "English proficiency"
   - "TOEIC"

7.  tuition_fee
   Mô tả / Description: Học phí, chi phí
   Description: Tuition fee, cost
   
   Ví dụ / Examples:
   - "tuition fee"
   - "học phí"
   - "hoc phi" (không dấu)
   - "cost"
   - "chi phí"
   - "tuition"

8.  contact_info
   Mô tả / Description: Thông tin liên hệ
   Description: Contact information
   
   Ví dụ / Examples:
   - "email"
   - "phone"
   - "địa chỉ"
   - "dia chi" (không dấu)
   - "address"
   - "contact"
   - "hotline"

═══════════════════════════════════════════════════════════════════════════════
YÊU CẦU / REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

 Entity Fields:
- type: Loại entity (phải là một trong các loại được liệt kê ở trên)
- type: Entity type (must be one of the types listed above)
- value: Giá trị của entity (text được extract từ câu hỏi)
- value: Entity value (text extracted from the question)
- confidence: Độ tin cậy (0.0-1.0)
- confidence: Confidence score (0.0-1.0)
- start_pos: Vị trí bắt đầu trong câu hỏi gốc (0-based index)
- start_pos: Start position in original question (0-based index)
- end_pos: Vị trí kết thúc trong câu hỏi gốc (0-based index)
- end_pos: End position in original question (0-based index)

 Position Calculation:
- start_pos và end_pos là vị trí của entity trong câu hỏi gốc (0-based index)
- start_pos and end_pos are positions of entity in original question (0-based index)
- Ví dụ: Câu hỏi "What is the tuition fee?" → entity "tuition fee" có start_pos=12, end_pos=24
- Example: Question "What is the tuition fee?" → entity "tuition fee" has start_pos=12, end_pos=24

 Confidence Score:
- 1.0 = chắc chắn / very confident
- 0.5 = không chắc / uncertain
- 0.0 = không chắc chắn / not confident

 Extraction Rules:
- Extract TẤT CẢ các entities có trong câu hỏi
- Extract ALL entities present in the question
- Chỉ extract entities LIÊN QUAN đến trường Greenwich, tuyển sinh, học phí, chương trình học
- Only extract entities RELATED to Greenwich University, admissions, tuition, academic programs
- Nếu không tìm thấy entity nào → trả về "entities": []
- If no entities found → return "entities": []

═══════════════════════════════════════════════════════════════════════════════
ĐỊNH DẠNG OUTPUT / OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Hãy trả về response theo đúng chuẩn JSON sau, KHÔNG trả thêm bất kì text nào khác.
Return response in the following JSON format exactly, DO NOT add any other text.

{{
  "entities": [
    {{
      "type": "program",
      "value": "Computer Science",
      "confidence": 0.9,
      "start_pos": 12,
      "end_pos": 28
    }},
    {{
      "type": "semester",
      "value": "Fall 2025",
      "confidence": 0.95,
      "start_pos": 35,
      "end_pos": 44
    }}
  ],
  "language": "en"
}}"""