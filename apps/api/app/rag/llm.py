# llm.py
from __future__ import annotations

import logging
from typing import Any, Dict, Optional, Sequence, Union

from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import settings

logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)


def _clip(text: str, max_chars: int) -> str:
    """Cắt chuỗi nếu vượt quá giới hạn ký tự, thêm '...' ở cuối."""
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 3] + "..."


def _doc_to_text(doc: Union[Document, Dict[str, Any]], idx: int) -> str:
    """
    Chuyển một Document hoặc dict thành đoạn text có thông tin nguồn.
    Hỗ trợ dict dạng {"text": "...", "metadata": {...}} để tương thích.
    """
    if isinstance(doc, Document):
        content = doc.page_content or ""
        meta = doc.metadata or {}
    else:
        content = doc.get("text", "") or ""
        meta = doc.get("metadata", {}) or {}

    source = meta.get("source") or meta.get("uri") or meta.get("url") or "N/A"
    page = meta.get("page")
    page_info = f" (trang {page})" if page else ""
    return f"[Nguồn {idx} - {source}{page_info}]\n{content}"


class LLMWrapper:
    """
    Wrapper cho Google Gemini LLM (thông qua thư viện `langchain-google-genai`).
    - Xây prompt system cố định để trả lời bằng tiếng Việt và chỉ dùng context.
    - Cung cấp cả API sync/async và các alias tương thích.
    - Hỗ trợ cả tham số `contexts` lẫn `history` (tên khác nhau ở caller).
    """

    def __init__(
        self,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_context_chars: int = 8000,
        max_tokens: Optional[int] = None,
    ):
        llm_model = model or settings.LLM_MODEL
        llm_temperature = temperature if temperature is not None else settings.LLM_TEMPERATURE
        llm_max_tokens = max_tokens or settings.LLM_MAX_TOKENS

        if not getattr(settings, "GOOGLE_API_KEY", None):
            logger.warning(
                "GOOGLE_API_KEY is not set in settings. LLM calls will fail if required."
            )

        # Khởi tạo Gemini LLM client (langchain-google-genai)
        try:
            self.llm = ChatGoogleGenerativeAI(
                model=llm_model,
                temperature=llm_temperature,
                max_output_tokens=llm_max_tokens,
                google_api_key=settings.GOOGLE_API_KEY,
            )
        except Exception as exc:
            # Không raise quá sớm; để caller thấy lỗi khi invoke nếu muốn.
            logger.exception("Failed to initialize ChatGoogleGenerativeAI: %s", exc)
            raise

        # System prompt: quy tắc trả lời
        self.system_prompt = (
            "Bạn là trợ lý AI của Đại học Greenwich Việt Nam.\n"
            "Nhiệm vụ: Trả lời câu hỏi của sinh viên dựa trên thông tin được cung cấp.\n\n"
            "Quy tắc:\n"
            "1. LUÔN trả lời bằng tiếng Việt.\n"
            "2. CHỈ sử dụng thông tin từ context được cung cấp.\n"
            '3. Nếu không tìm thấy thông tin, trả lời: "Tôi không tìm thấy thông tin về vấn đề này".\n'
            "4. Trả lời ngắn gọn, rõ ràng, thân thiện.\n"
            "5. Nếu có link/email/số điện thoại trong context, hãy đưa vào câu trả lời.\n"
        )

        # Prompt template: system + context + user question
        self.prompt = ChatPromptTemplate.from_messages(
            [
                ("system", self.system_prompt),
                ("system", "Context:\n{context}"),
                ("human", "{question}"),
            ]
        )

        # Chain composition: prompt -> llm -> parser
        self.parser = StrOutputParser()
        self.chain = self.prompt | self.llm | self.parser

        self.max_context_chars = max_context_chars

    def format_contexts(
        self,
        contexts: Sequence[Union[Document, Dict[str, Any]]],
        max_sources: int = 8,
    ) -> str:
        """
        Nối các context thành một chuỗi đưa vào prompt. Giữ tối đa `max_sources` nguồn.
        Trả về chuỗi đã clip để không vượt quá giới hạn token/context.
        """
        pieces = []
        for i, ctx in enumerate(contexts[:max_sources], start=1):
            pieces.append(_doc_to_text(ctx, i))
        joined = "\n\n".join(pieces).strip()
        return _clip(joined, self.max_context_chars)

    def _fallback_no_context(self) -> str:
        return "Tôi không tìm thấy thông tin về vấn đề này"

    # -------------------------
    # Internal helper: normalize parameter names
    # -------------------------
    @staticmethod
    def _normalize_contexts_param(
        contexts: Optional[Sequence[Union[Document, Dict[str, Any]]]],
        history: Optional[Sequence[Union[Document, Dict[str, Any]]]],
    ) -> Sequence[Union[Document, Dict[str, Any]]]:
        """
        Trả về contexts thực tế theo thứ tự ưu tiên:
        - contexts nếu có
        - history nếu contexts None
        - [] nếu cả hai None
        """
        if contexts is not None:
            return contexts
        if history is not None:
            return history
        return []

    # -------------------------
    # Sync API
    # -------------------------
    def generate_answer(
        self,
        question: str,
        contexts: Optional[Sequence[Union[Document, Dict[str, Any]]]] = None,
        *,
        history: Optional[Sequence[Union[Document, Dict[str, Any]]]] = None,
    ) -> str:
        """
        Sinh câu trả lời đồng bộ.
        Hỗ trợ cả tham số contexts hoặc history (tùy caller).
        """
        real_contexts = self._normalize_contexts_param(contexts, history)
        if not real_contexts:
            return self._fallback_no_context()

        context_text = self.format_contexts(real_contexts)
        if not context_text.strip():
            return self._fallback_no_context()

        try:
            result = self.chain.invoke(
                {
                    "context": context_text,
                    "question": question.strip(),
                }
            )
            if not isinstance(result, str) or not result.strip():
                logger.warning("LLM chain.invoke returned empty result for question=%s", question)
                return self._fallback_no_context()
            return result
        except Exception as exc:
            logger.exception("Error during generate_answer (sync): %s", exc)
            raise

    # -------------------------
    # Async API
    # -------------------------
    async def generate_answer_async(
        self,
        question: str,
        contexts: Optional[Sequence[Union[Document, Dict[str, Any]]]] = None,
        *,
        history: Optional[Sequence[Union[Document, Dict[str, Any]]]] = None,
    ) -> str:
        """
        Sinh câu trả lời bất đồng bộ.
        Hỗ trợ cả tham số contexts hoặc history (tùy caller).
        """
        real_contexts = self._normalize_contexts_param(contexts, history)
        if not real_contexts:
            return self._fallback_no_context()

        context_text = self.format_contexts(real_contexts)
        if not context_text.strip():
            return self._fallback_no_context()

        try:
            result = await self.chain.ainvoke(
                {
                    "context": context_text,
                    "question": question.strip(),
                }
            )
            if not isinstance(result, str) or not result.strip():
                logger.warning("LLM chain.ainvoke returned empty result for question=%s", question)
                return self._fallback_no_context()
            return result
        except Exception as exc:
            logger.exception("Error during generate_answer_async: %s", exc)
            raise

    # -------------------------
    # Compatibility aliases
    # Một số phần code cũ hoặc code khác có thể gọi các tên phương thức khác nhau.
    # Thêm alias để tránh AttributeError khi đổi tên phương thức ở các module khác.
    # Các alias này cũng hỗ trợ cả `history` keyword cho backward compatibility.
    # -------------------------
    def generate_direct_answer(
        self,
        question: str,
        contexts: Optional[Sequence[Union[Document, Dict[str, Any]]]] = None,
        *,
        history: Optional[Sequence[Union[Document, Dict[str, Any]]]] = None,
    ) -> str:
        """Alias sync -> delegate to generate_answer."""
        return self.generate_answer(question=question, contexts=contexts, history=history)

    async def generate_direct_answer_async(
        self,
        question: str,
        contexts: Optional[Sequence[Union[Document, Dict[str, Any]]]] = None,
        *,
        history: Optional[Sequence[Union[Document, Dict[str, Any]]]] = None,
    ) -> str:
        """Alias async -> delegate to generate_answer_async."""
        return await self.generate_answer_async(
            question=question, contexts=contexts, history=history
        )

    def generate(
        self,
        question: str,
        contexts: Optional[Sequence[Union[Document, Dict[str, Any]]]] = None,
        *,
        history: Optional[Sequence[Union[Document, Dict[str, Any]]]] = None,
    ) -> str:
        """Generic sync alias."""
        return self.generate_answer(question=question, contexts=contexts, history=history)

    async def generate_async(
        self,
        question: str,
        contexts: Optional[Sequence[Union[Document, Dict[str, Any]]]] = None,
        *,
        history: Optional[Sequence[Union[Document, Dict[str, Any]]]] = None,
    ) -> str:
        """Generic async alias."""
        return await self.generate_answer_async(
            question=question, contexts=contexts, history=history
        )
