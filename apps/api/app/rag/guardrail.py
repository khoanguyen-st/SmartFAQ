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
        try:
            prompt = get_guardrail_prompt()
            result = await self.llm.invoke_json(prompt, question)
        except Exception:
            return self._refusal("system_fail", question)

        if not result or not isinstance(result, dict):
            return self._refusal("system_fail", question)

        status = result.get("status", "allowed")
        reason = result.get("reason_code")

        if status == "blocked":
            return self._refusal(reason, question)

        return {"status": "allowed"}

    def _refusal(self, code: str, question: str) -> Dict[str, str]:
        q = question.lower()

        if code == "competitor":
            if any(w in q for w in ["học phí", "hoc phi", "điểm chuẩn", "diem chuan", "admission", "major", "ngành"]):
                return {
                    "status": "blocked",
                    "vi": "Xin lỗi, tôi chỉ hỗ trợ thông tin về Đại học Greenwich Việt Nam.",
                    "en": "I only support inquiries related to Greenwich University Vietnam.",
                }
            return {"status": "allowed"}

        if code == "toxic":
            return {
                "status": "blocked",
                "vi": "Vui lòng sử dụng ngôn ngữ lịch sự.",
                "en": "Please use polite language.",
            }

        if code == "irrelevant":
            return {
                "status": "blocked",
                "vi": "Xin lỗi, tôi chỉ hỗ trợ thông tin về Đại học Greenwich Việt Nam.",
                "en": "I only support questions related to Greenwich University Vietnam.",
            }

        if code == "system_fail":
            return {
                "status": "blocked",
                "vi": "Hệ thống không thể xử lý yêu cầu. Vui lòng thử lại.",
                "en": "The system failed to process your request. Please try again.",
            }

        return {
            "status": "blocked",
            "vi": "Câu hỏi nằm ngoài phạm vi hỗ trợ.",
            "en": "This question is outside my scope.",
        }
