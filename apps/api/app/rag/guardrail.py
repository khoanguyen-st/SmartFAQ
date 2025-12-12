from __future__ import annotations

import logging
from typing import Dict

from app.rag.llm import LLMWrapper
from app.rag.prompts import get_guardrail_prompt

logger = logging.getLogger(__name__)

REFUSAL_MESSAGES = {
    "competitor": {
        "vi": "Xin lỗi, tôi chỉ hỗ trợ thông tin về Đại học Greenwich Việt Nam, không hỗ trợ thông tin về các trường khác.",
        "en": "I only support inquiries related to Greenwich University Vietnam, not other institutions.",
    },
    "system_management": {
        "vi": "Xin lỗi, tôi không thể truy cập danh sách tài liệu hoặc dữ liệu hệ thống. Tôi chỉ trả lời câu hỏi dựa trên nội dung tài liệu. Để quản lý tài liệu, vui lòng liên hệ bộ phận IT.",
        "en": "Sorry, I cannot access document lists or system data. I only answer questions based on document content. For document management, please contact IT department.",
    },
    "irrelevant": {
        "vi": "Xin lỗi, câu hỏi này nằm ngoài phạm vi hỗ trợ của tôi. Tôi chỉ trả lời những câu hỏi liên quan đến Đại học Greenwich.",
        "en": "Sorry, this question is outside my scope. I only answer questions related to Greenwich University.",
    },
    "toxic": {
        "vi": "Vui lòng sử dụng ngôn ngữ lịch sự.",
        "en": "Please use polite language.",
    },
    "wrong_language": {
        "vi": "Xin lỗi, tôi chỉ hỗ trợ Tiếng Việt và Tiếng Anh.",
        "en": "Sorry, I only support Vietnamese and English.",
    },
    "system_fail": {
        "vi": "Hệ thống đang bận, vui lòng thử lại sau.",
        "en": "The system is busy, please try again later.",
    },
}


class GuardrailService:
    def __init__(self, llm_wrapper: LLMWrapper):
        self.llm = llm_wrapper

    def _quick_check_system_management(self, question: str) -> bool:
        """Quick regex-based check for system management queries before LLM call."""
        import re

        q_lower = question.lower()

        # Pattern 1: show/list/view + all + document/file
        if re.search(r"(show|list|view).*(all|tất cả).*(document|file|tài liệu)", q_lower):
            return True

        # Pattern 2: show/list + uploaded/draft
        if re.search(r"(show|list|view).*(uploaded|draft|đã upload|bản nháp)", q_lower):
            return True

        # Pattern 3: how many documents uploaded/database
        if re.search(
            r"(how many|bao nhiêu).*(document|file|tài liệu).*(uploaded|database|hệ thống)", q_lower
        ):
            return True

        return False

    async def check_safety(self, question: str) -> Dict[str, str]:
        # Quick pre-check for system management
        if self._quick_check_system_management(question):
            logger.info(f"Quick check blocked system_management: {question[:100]}")
            return self._create_response("system_management")

        try:
            prompt = get_guardrail_prompt()
            result = await self.llm.invoke_json(prompt, question)
            print(f"DEBUG GUARDRAIL: {result}")
        except Exception as e:
            logger.error(f"Guardrail check failed: {e}")
            return self._create_response("system_fail")

        if not result or not isinstance(result, dict):
            logger.error(f"Guardrail returned invalid format: {result}")
            return self._create_response("system_fail")

        status = result.get("status", "allowed")
        reason_code = result.get("reason") or result.get("reason_code") or "default"

        if status == "blocked":
            return self._create_response(reason_code)

        return {"status": "allowed"}

    def _create_response(self, code: str) -> Dict[str, str]:
        if code in ["profanity", "insult", "hate_speech", "harassment"]:
            code = "toxic"

        msgs = REFUSAL_MESSAGES.get(code, REFUSAL_MESSAGES["irrelevant"])

        return {"status": "blocked", "vi": msgs["vi"], "en": msgs["en"]}

    async def is_question_appropriate(self, question: str) -> bool:
        """
        Quick check if question is appropriate for FAQ suggestions.
        Returns True if allowed, False if blocked.
        """
        result = await self.check_safety(question)
        return result.get("status") == "allowed"
