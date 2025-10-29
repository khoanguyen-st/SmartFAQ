from __future__ import annotations

from typing import List, Dict, Any, Optional, Sequence, Union
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.core.config import settings


def _clip(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 3] + "..."


def _doc_to_text(doc: Union[Document, Dict[str, Any]], idx: int) -> str:
    # Hỗ trợ cả Document và dict {"text": "...", "metadata": {...}}
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
    Wrapper for Google Gemini LLM using LangChain v1.
    Uses langchain-google-genai for Gemini API integration.
    """
    def __init__(
        self,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_context_chars: int = 8000,
        max_tokens: Optional[int] = None
    ):
        # ---- Model init (Gemini via langchain-google-genai) ----
        llm_model = model or settings.LLM_MODEL
        llm_temperature = temperature if temperature is not None else settings.LLM_TEMPERATURE
        llm_max_tokens = max_tokens or settings.LLM_MAX_TOKENS
        
        # Initialize Gemini model
        # Make sure GOOGLE_API_KEY is set in environment
        self.llm = ChatGoogleGenerativeAI(
            model=llm_model,
            temperature=llm_temperature,
            max_output_tokens=llm_max_tokens,
            google_api_key=settings.GOOGLE_API_KEY,
            # Optional: add timeout if needed
            # timeout=30,
        )

        # ---- Prompt ----
        # Để context ở một message riêng -> dễ kiểm soát và thay thế
        self.system_prompt = (
            "Bạn là trợ lý AI của Đại học Greenwich Việt Nam.\n"
            "Nhiệm vụ: Trả lời câu hỏi của sinh viên dựa trên thông tin được cung cấp.\n\n"
            "Quy tắc:\n"
            "1. LUÔN trả lời bằng tiếng Việt.\n"
            "2. CHỈ sử dụng thông tin từ context được cung cấp.\n"
            "3. Nếu không tìm thấy thông tin, trả lời: \"Tôi không tìm thấy thông tin về vấn đề này\".\n"
            "4. Trả lời ngắn gọn, rõ ràng, thân thiện.\n"
            "5. Nếu có link/email/số điện thoại trong context, hãy đưa vào câu trả lời.\n"
        )

        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            ("system", "Context:\n{context}"),
            ("human", "{question}"),
        ])

        # ---- Chain ----
        self.parser = StrOutputParser()
        self.chain = self.prompt | self.llm | self.parser

        # ---- Params ----
        self.max_context_chars = max_context_chars

    def format_contexts(
        self,
        contexts: Sequence[Union[Document, Dict[str, Any]]],
        max_sources: int = 8,
    ) -> str:
        """
        Ghép context với nguồn, có clip để tránh vượt giới hạn.
        """
        # Chỉ lấy tối đa N nguồn để giữ prompt gọn
        pieces = []
        for i, ctx in enumerate(contexts[:max_sources], start=1):
            pieces.append(_doc_to_text(ctx, i))
        joined = "\n\n".join(pieces).strip()
        return _clip(joined, self.max_context_chars)

    def _fallback_no_context(self) -> str:
        return "Tôi không tìm thấy thông tin về vấn đề này"

    def generate_answer(
        self,
        question: str,
        contexts: Sequence[Union[Document, Dict[str, Any]]],
    ) -> str:
        if not contexts:
            return self._fallback_no_context()

        context_text = self.format_contexts(contexts)
        if not context_text.strip():
            return self._fallback_no_context()

        return self.chain.invoke({
            "context": context_text,
            "question": question.strip(),
        })

    async def generate_answer_async(
        self,
        question: str,
        contexts: Sequence[Union[Document, Dict[str, Any]]],
    ) -> str:
        if not contexts:
            return self._fallback_no_context()

        context_text = self.format_contexts(contexts)
        if not context_text.strip():
            return self._fallback_no_context()

        return await self.chain.ainvoke({
            "context": context_text,
            "question": question.strip(),
        })
