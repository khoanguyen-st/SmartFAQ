from __future__ import annotations
import logging
from typing import Dict
from app.rag.llm import LLMWrapper
from app.rag.prompts import get_guardrail_prompt

logger = logging.getLogger(__name__)

class GuardrailService:
    def __init__(self, llm_wrapper: LLMWrapper):
        self.llm = llm_wrapper

    async def check_safety(self, question: str) -> Dict[str, str]:
        prompt = get_guardrail_prompt()
        result = await self.llm.invoke_json(prompt, question)

        if not result: return self._get_refusal("system_fail")

        status = result.get("status", "allowed")
        reason = result.get("reason_code")

        if status == "blocked":
            return self._get_refusal(reason)
        return {"status": "allowed"}

    def _get_refusal(self, code: str) -> Dict[str, str]:
        if code == "competitor":
            return {"status": "blocked", "vi": "Xin lỗi, tôi chỉ hỗ trợ thông tin về Đại học Greenwich Việt Nam.", "en": "I only support inquiries related to Greenwich University Vietnam."}
        if code == "toxic":
            return {"status": "blocked", "vi": "Vui lòng sử dụng ngôn ngữ lịch sự.", "en": "Please use polite language."}
        if code == "system_fail":
            return {"status": "blocked", "vi": "Hệ thống an toàn không thể xác minh câu hỏi. Vui lòng thử lại.", "en": "The safety system failed to verify the question. Please try again."}
        return {"status": "blocked", "vi": "Câu hỏi nằm ngoài phạm vi hỗ trợ.", "en": "This question is outside my scope."}
