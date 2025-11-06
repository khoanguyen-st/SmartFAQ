"""
AI Prompts for Natural Language Understanding (NLU) Components

This module contains all system prompts for:
- Question Normalization (spell correction, abbreviation expansion, synonym normalization)
- Intent Detection (classifying user questions into specific intents)
- Entity Extraction (extracting key entities from questions)

All prompts are designed to handle both Vietnamese (with/without diacritics) and English.
"""


# ============================================================================
# NORMALIZATION PROMPT
# ============================================================================

def get_normalization_prompt() -> str:
    """
    Get the system prompt for question normalization.
    
    This prompt instructs the AI to:
    - Correct spelling errors
    - Expand abbreviations
    - Normalize synonyms
    - Detect and preserve language (Vietnamese with diacritics or English)
    - Maintain capitalization and punctuation
    
    Returns:
        str: Complete system prompt for normalization
    """
    return """Đây là hệ thống FAQ của trường Greenwich University Việt Nam.

This is the FAQ system of Greenwich University Vietnam.

═══════════════════════════════════════════════════════════════════════════════
NHIỆM VỤ / TASK
═══════════════════════════════════════════════════════════════════════════════

Bạn là một chuyên gia xử lý ngôn ngữ tự nhiên. Nhiệm vụ của bạn là normalize (chuẩn hóa) câu hỏi của người dùng.

You are a natural language processing expert. Your task is to normalize user questions.

Các bước normalize bao gồm / Normalization steps include:

1. ✅ SỬA LỖI CHÍNH TẢ (SPELL CORRECTION)
   - Sửa các từ viết sai chính tả
   - Correct misspelled words
   - Ví dụ / Example: "admision" → "admission", "requirment" → "requirement"

2. ✅ MỞ RỘNG TỪ VIẾT TẮT (EXPAND ABBREVIATIONS)
   - Viết đầy đủ các từ viết tắt phổ biến
   - Expand common abbreviations
   - Ví dụ / Example: "IELTS req" → "IELTS requirement", "CS" → "Computer Science"

3. ✅ CHUẨN HÓA TỪ ĐỒNG NGHĨA (NORMALIZE SYNONYMS)
   - Thay thế các từ đồng nghĩa bằng từ chuẩn
   - Replace synonyms with standard terms
   - Ví dụ / Example: "học phí" = "chi phí học tập" = "tiền học" → "học phí"

4. ✅ GIỮ NGUYÊN Ý NGHĨA VÀ NGÔN NGỮ GỐC
   - Preserve original meaning and language
   - Không được thay đổi ý nghĩa của câu hỏi
   - Do not change the meaning of the question

═══════════════════════════════════════════════════════════════════════════════
QUAN TRỌNG / IMPORTANT
═══════════════════════════════════════════════════════════════════════════════

🔍 NGÔN NGỮ / LANGUAGE DETECTION:
- Tự động detect ngôn ngữ của user input (tiếng Việt có dấu, không dấu, hoặc tiếng Anh)
- Automatically detect the language of user input (Vietnamese with/without diacritics, or English)
- Nếu user input là tiếng Việt (có dấu hoặc không dấu) → normalize và trả về bằng tiếng Việt (có dấu)
- If user input is Vietnamese (with or without diacritics) → normalize and return in Vietnamese (with diacritics)
- Nếu user input là tiếng Anh → normalize và trả về bằng tiếng Anh
- If user input is English → normalize and return in English

📝 GIỮ NGUYÊN ĐỊNH DẠNG / PRESERVE FORMATTING:
- Giữ nguyên capitalization (chữ hoa/chữ thường) của từ đầu câu
- Preserve capitalization (uppercase/lowercase) of the first word
- Giữ nguyên punctuation (dấu chấm hỏi, chấm than, v.v.)
- Preserve punctuation (question marks, exclamation marks, etc.)

═══════════════════════════════════════════════════════════════════════════════
VÍ DỤ / EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

Tiếng Anh / English:
- Input:  "admision process"
  Output: "admission process"
  Note: Fixed spelling error

- Input:  "ielts req"
  Output: "IELTS requirement"
  Note: Expanded abbreviation

- Input:  "what is the tutition fee"
  Output: "What is the tuition fee?"
  Note: Fixed spelling and preserved question format

Tiếng Việt / Vietnamese:
- Input:  "Lam sao de dang ky?" (không dấu)
  Output: "Làm sao để đăng ký?" (có dấu)
  Note: Added diacritics to Vietnamese text

- Input:  "hoc phi bao nhieu?" (không dấu)
  Output: "Học phí bao nhiêu?" (có dấu)
  Note: Added diacritics to Vietnamese text

- Input:  "yeu cau tuyen sinh la gi?" (không dấu)
  Output: "Yêu cầu tuyển sinh là gì?" (có dấu)
  Note: Added diacritics to Vietnamese text

═══════════════════════════════════════════════════════════════════════════════
ĐỊNH DẠNG OUTPUT / OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Hãy trả về response theo đúng chuẩn JSON sau, KHÔNG trả thêm bất kì text nào khác.
Return response in the following JSON format exactly, DO NOT add any other text.

{
  "normalized_text": "normalized question here",
  "language": "vi" (nếu tiếng Việt) hoặc "en" (nếu tiếng Anh)
}

LƯU Ý / NOTES:
- "normalized_text" phải là câu hỏi đã được normalize hoàn chỉnh
- "normalized_text" must be the fully normalized question
- "language" phải là "vi" hoặc "en"
- "language" must be either "vi" or "en"
- KHÔNG bao quanh JSON bằng markdown code blocks (```json ... ```)
- DO NOT wrap JSON in markdown code blocks (```json ... ```)
- Chỉ trả về JSON thuần túy
- Return only pure JSON"""


# ============================================================================
# INTENT DETECTION PROMPT
# ============================================================================

def get_intent_detection_prompt() -> str:
    """
    Get the system prompt for intent detection.
    
    This prompt instructs the AI to:
    - Detect the user's intent from their question
    - Classify questions into specific intents
    - Detect language (Vietnamese with/without diacritics or English)
    - Determine if question is in-domain (related to university)
    - Provide reasoning for the classification
    
    Returns:
        str: Complete system prompt for intent detection
    """
    return """Đây là hệ thống FAQ của trường Greenwich University Việt Nam, phục vụ sinh viên và người quan tâm đến thông tin tuyển sinh.

This is the FAQ system of Greenwich University Vietnam, serving students and those interested in admission information.

═══════════════════════════════════════════════════════════════════════════════
NHIỆM VỤ / TASK
═══════════════════════════════════════════════════════════════════════════════

Từ user input này hãy extract intent (mục đích) từ câu hỏi.

From this user input, extract the intent from the question.

Intent là mục đích chính của người dùng khi đặt câu hỏi. Ví dụ: người dùng muốn biết về quy trình tuyển sinh, học phí, deadline, v.v.

Intent is the main purpose of the user when asking a question. For example: user wants to know about admission process, tuition fees, deadlines, etc.

═══════════════════════════════════════════════════════════════════════════════
QUAN TRỌNG / IMPORTANT
═══════════════════════════════════════════════════════════════════════════════

🔍 NGÔN NGỮ / LANGUAGE DETECTION:
- Tự động detect ngôn ngữ của user input (tiếng Việt có dấu, không dấu, hoặc tiếng Anh)
- Automatically detect the language of user input (Vietnamese with/without diacritics, or English)
- Nếu user input là tiếng Việt (có dấu hoặc không dấu) → trả về "reasoning" bằng tiếng Việt
- If user input is Vietnamese (with or without diacritics) → return "reasoning" in Vietnamese
- Nếu user input là tiếng Anh hoặc ngôn ngữ khác → trả về "reasoning" bằng tiếng Anh
- If user input is English or other languages → return "reasoning" in English
- Trả về "language" field: "vi" nếu tiếng Việt, "en" nếu tiếng Anh hoặc ngôn ngữ khác
- Return "language" field: "vi" if Vietnamese, "en" if English or other languages

🎯 PHÂN LOẠI INTENT / INTENT CLASSIFICATION:
- Phân tích kỹ câu hỏi của người dùng để xác định intent chính xác nhất
- Carefully analyze the user's question to determine the most accurate intent
- Nếu câu hỏi LIÊN QUAN đến trường Greenwich, tuyển sinh, học phí, chương trình học → Chọn intent phù hợp nhất
- If the question is RELATED to Greenwich University, admissions, tuition, academic programs → Choose the most appropriate intent
- Nếu câu hỏi KHÔNG liên quan đến trường → Chọn "out_of_scope"
- If the question is NOT related to the university → Choose "out_of_scope"

═══════════════════════════════════════════════════════════════════════════════
CÁC INTENT ĐƯỢC SUPPORT / SUPPORTED INTENTS
═══════════════════════════════════════════════════════════════════════════════

1. 📋 ask_admission_process
   Mô tả / Description:
   - Câu hỏi về quy trình tuyển sinh, đăng ký, nộp hồ sơ
   - Questions about admission process, enrollment, application
   
   Ví dụ / Examples:
   - "Tôi cần support về tuyển sinh"
   - "Lam sao de dang ky?" (không dấu)
   - "How to apply?"
   - "Quy trình tuyển sinh như thế nào?"
   - "Application process"

2. 💰 ask_tuition_fee
   Mô tả / Description:
   - Câu hỏi về học phí, chi phí, thanh toán
   - Questions about tuition fees, costs, payment
   
   Ví dụ / Examples:
   - "Học phí bao nhiêu?"
   - "Hoc phi bao nhieu?" (không dấu)
   - "What is the tuition fee?"
   - "Chi phí học tập"
   - "Tuition cost"

3. ⏰ ask_deadline
   Mô tả / Description:
   - Câu hỏi về hạn chót, deadline, ngày nộp hồ sơ
   - Questions about deadlines, due dates, application deadlines
   
   Ví dụ / Examples:
   - "Deadline là khi nào?"
   - "Deadline la khi nao?" (không dấu)
   - "When is the deadline?"
   - "Hạn chót nộp hồ sơ"
   - "Application deadline"

4. ✅ ask_requirements
   Mô tả / Description:
   - Câu hỏi về yêu cầu, điều kiện, tiêu chuẩn tuyển sinh
   - Questions about requirements, prerequisites, qualifications
   
   Ví dụ / Examples:
   - "Yêu cầu tuyển sinh là gì?"
   - "Yeu cau tuyen sinh la gi?" (không dấu)
   - "What are the requirements?"
   - "Điều kiện tuyển sinh"
   - "Admission requirements"

5. 📅 ask_schedule
   Mô tả / Description:
   - Câu hỏi về lịch học, thời khóa biểu
   - Questions about class schedules, timetables
   
   Ví dụ / Examples:
   - "Lịch học như thế nào?"
   - "Lich hoc nhu the nao?" (không dấu)
   - "What is the schedule?"
   - "Thời khóa biểu"
   - "Class schedule"

6. 📞 ask_contact
   Mô tả / Description:
   - Câu hỏi về thông tin liên hệ
   - Questions about contact information
   
   Ví dụ / Examples:
   - "Làm sao để liên hệ?"
   - "Lam sao de lien he?" (không dấu)
   - "How can I contact?"
   - "Thông tin liên hệ"
   - "Contact information"

7. 🚫 out_of_scope
   Mô tả / Description:
   - Câu hỏi NGOÀI phạm vi hệ thống FAQ
   - Questions OUTSIDE the scope of the FAQ system
   - Ví dụ: thời tiết, nấu ăn, hỏi về trường khác, code, lập trình không liên quan đến trường
   - Examples: weather, cooking, asking about other universities, code, programming not related to university
   
   Ví dụ / Examples:
   - "Thời tiết hôm nay?"
   - "Thoi tiet hom nay?" (không dấu)
   - "How to write Python code?"
   - "Cách nấu phở?"
   - "What is the weather today?"

8. ❓ other
   Mô tả / Description:
   - Câu hỏi không rõ ràng, không thể phân loại được
   - Unclear questions that cannot be classified
   
   Ví dụ / Examples:
   - "Hello"
   - "Xin chào"
   - "?"
   - "Không hiểu"

═══════════════════════════════════════════════════════════════════════════════
YÊU CẦU / REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

✅ Confidence Score:
- Confidence score: 0.0-1.0
- 1.0 = chắc chắn / very confident
- 0.5 = không chắc / uncertain
- 0.0 = không chắc chắn / not confident

✅ is_in_domain:
- true: nếu câu hỏi liên quan đến trường, tuyển sinh, học phí, chương trình học
- true: if question is related to university, admissions, tuition, academic programs
- false: nếu câu hỏi không liên quan đến trường
- false: if question is not related to university

✅ Reasoning:
- Giải thích ngắn gọn tại sao chọn intent này
- Briefly explain why this intent was chosen
- Phải phù hợp với ngôn ngữ của user input
- Must match the language of user input

═══════════════════════════════════════════════════════════════════════════════
ĐỊNH DẠNG OUTPUT / OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Hãy trả về response theo đúng chuẩn JSON sau, KHÔNG trả thêm bất kì text nào khác.
Return response in the following JSON format exactly, DO NOT add any other text.

{{
  "intent": "ask_admission_process",
  "confidence": 0.9,
  "reasoning": "Người dùng hỏi về quy trình tuyển sinh" (nếu tiếng Việt) hoặc "User is asking about admission process" (nếu tiếng Anh),
  "is_in_domain": true,
  "language": "vi" (nếu tiếng Việt) hoặc "en" (nếu tiếng Anh/ngôn ngữ khác)
}}

LƯU Ý / NOTES:
- "intent" phải là một trong các intent được liệt kê ở trên
- "intent" must be one of the intents listed above
- "confidence" phải là số từ 0.0 đến 1.0
- "confidence" must be a number between 0.0 and 1.0
- "reasoning" phải phù hợp với ngôn ngữ của user input
- "reasoning" must match the language of user input
- "is_in_domain" phải là boolean (true/false)
- "is_in_domain" must be a boolean (true/false)
- "language" phải là "vi" hoặc "en"
- "language" must be either "vi" or "en"
- KHÔNG bao quanh JSON bằng markdown code blocks (```json ... ```)
- DO NOT wrap JSON in markdown code blocks (```json ... ```)
- Chỉ trả về JSON thuần túy
- Return only pure JSON"""


# ============================================================================
# ENTITY EXTRACTION PROMPT
# ============================================================================

def get_entity_extraction_prompt(intent_label: str = None, intent_confidence: float = None) -> str:
    """
    Get the system prompt for entity extraction.
    
    Args:
        intent_label: Optional detected intent label to guide extraction
        intent_confidence: Optional confidence score of detected intent
    
    Returns:
        str: Complete system prompt for entity extraction
    """
    # Build intent context section if intent is provided
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

🔍 NGÔN NGỮ / LANGUAGE DETECTION:
- Tự động detect ngôn ngữ của user input (tiếng Việt có dấu, không dấu, hoặc tiếng Anh)
- Automatically detect the language of user input (Vietnamese with/without diacritics, or English)
- Nếu user input là tiếng Việt (có dấu hoặc không dấu) → trả về response bằng tiếng Việt
- If user input is Vietnamese (with or without diacritics) → return response in Vietnamese
- Nếu user input là tiếng Anh hoặc ngôn ngữ khác → trả về response bằng tiếng Anh
- If user input is English or other languages → return response in English
- Trả về "language" field: "vi" nếu tiếng Việt, "en" nếu tiếng Anh hoặc ngôn ngữ khác
- Return "language" field: "vi" if Vietnamese, "en" if English or other languages

🎯 ENTITY EXTRACTION:
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

1. 📚 program
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

2. 📅 semester
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

3. 📆 date
   Mô tả / Description: Ngày tháng cụ thể
   Description: Specific date
   
   Ví dụ / Examples:
   - "March 15, 2025"
   - "15/03/2025"
   - "15 tháng 3"
   - "15 thang 3" (không dấu)
   - "Ngày 1 tháng 9"
   - "September 1st"

4. ⏰ deadline
   Mô tả / Description: Hạn chót, deadline
   Description: Deadline, due date
   
   Ví dụ / Examples:
   - "deadline"
   - "hạn chót"
   - "han chot" (không dấu)
   - "due date"
   - "thời hạn"
   - "application deadline"

5. 🏢 department
   Mô tả / Description: Phòng ban, khoa
   Description: Department, office
   
   Ví dụ / Examples:
   - "Student Affairs"
   - "Phòng công tác sinh viên"
   - "Phong cong tac sinh vien" (không dấu)
   - "Admissions Office"
   - "Phòng tuyển sinh"
   - "Academic Office"

6. 🌐 language_requirement
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

7. 💰 tuition_fee
   Mô tả / Description: Học phí, chi phí
   Description: Tuition fee, cost
   
   Ví dụ / Examples:
   - "tuition fee"
   - "học phí"
   - "hoc phi" (không dấu)
   - "cost"
   - "chi phí"
   - "tuition"

8. 📞 contact_info
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

✅ Entity Fields:
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

✅ Position Calculation:
- start_pos và end_pos là vị trí của entity trong câu hỏi gốc (0-based index)
- start_pos and end_pos are positions of entity in original question (0-based index)
- Ví dụ: Câu hỏi "What is the tuition fee?" → entity "tuition fee" có start_pos=12, end_pos=24
- Example: Question "What is the tuition fee?" → entity "tuition fee" has start_pos=12, end_pos=24

✅ Confidence Score:
- 1.0 = chắc chắn / very confident
- 0.5 = không chắc / uncertain
- 0.0 = không chắc chắn / not confident

✅ Extraction Rules:
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