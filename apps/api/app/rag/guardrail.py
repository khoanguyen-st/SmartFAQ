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
    "default": {
        "vi": "Tôi không thể trả lời câu hỏi này.",
        "en": "I cannot answer this question.",
    },
}


class GuardrailService:
    def __init__(self, llm_wrapper: LLMWrapper):
        self.llm = llm_wrapper

    async def check_safety(self, question: str) -> Dict[str, str]:
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

        msgs = REFUSAL_MESSAGES.get(code, REFUSAL_MESSAGES["default"])

        return {"status": "blocked", "vi": msgs["vi"], "en": msgs["en"]}
