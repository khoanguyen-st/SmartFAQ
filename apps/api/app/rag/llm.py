from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional, Sequence, Union

from google.api_core import exceptions as google_exceptions
from langchain_core.documents import Document
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import settings

logger = logging.getLogger(__name__)


def _clip(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 3] + "..."


def _doc_to_text(doc: Union[Document, Dict[str, Any]], idx: int) -> str:
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
    def __init__(
        self,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_context_chars: int = 4000,
        max_tokens: Optional[int] = None,
    ):
        llm_model = model or settings.LLM_MODEL
        llm_temperature = temperature if temperature is not None else settings.LLM_TEMPERATURE
        llm_max_tokens = max_tokens or getattr(settings, "LLM_MAX_TOKENS", 512)

        self.llm = ChatGoogleGenerativeAI(
            model=llm_model,
            temperature=llm_temperature,
            max_output_tokens=llm_max_tokens,
            google_api_key=getattr(settings, "GOOGLE_API_KEY", None),
            max_retries=2,
        )

        logger.info(f"LLM initialized with model: {llm_model}")

        self.system_prompt = (
            "Bạn là trợ lý AI của Đại học Greenwich Việt Nam.\n"
            "Nhiệm vụ: Trả lời câu hỏi của sinh viên dựa trên thông tin được cung cấp.\n\n"
            "Quy tắc:\n"
            "1. Trả lời bằng cùng ngôn ngữ với câu hỏi của người dùng.\n"
            "2. CHỈ sử dụng thông tin từ context được cung cấp để trả lời nội dung chính.\n"
            '3. Nếu context không chứa thông tin phù hợp, trả lời: "Tôi không tìm thấy thông tin về vấn đề này" bằng ngôn ngữ của người dùng.\n'
            "4. Khi có context, trả lời rõ ràng, không chung chung; ưu tiên gạch đầu dòng, nêu số liệu/tên/mốc thời gian/điều kiện quan trọng.\n"
            "5. Nếu có link/email/số điện thoại trong context, hãy đưa vào câu trả lời.\n"
            "6. Nếu câu hỏi mang tính chào hỏi hoặc xã giao, hãy đáp lại lịch sự và đề nghị hỗ trợ thêm.\n"
        )

        self.prompt = ChatPromptTemplate.from_messages(
            [
                ("system", self.system_prompt),
                ("system", "REQUIRED OUTPUT LANGUAGE: {target_language}"),
                ("system", "Context:\n{context}"),
                ("human", "{question}"),
            ]
        )
        self.direct_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", "You are a helpful AI Assistant of Greenwich Vietnam."),
                ("system", "REQUIRED OUTPUT LANGUAGE: {target_language}"),
                MessagesPlaceholder(variable_name="history"),
                ("human", "{question}"),
            ]
        )

        self.parser = StrOutputParser()
        self.chain = self.prompt | self.llm | self.parser
        self.direct_chain = self.direct_prompt | self.llm | self.parser
        self.max_context_chars = max_context_chars

    def format_contexts(
        self,
        contexts: Sequence[Union[Document, Dict[str, Any]]],
        max_sources: int = 4,
    ) -> str:
        pieces = []
        for i, ctx in enumerate(contexts[:max_sources], start=1):
            pieces.append(_doc_to_text(ctx, i))
        joined = "\n\n".join(pieces).strip()
        return _clip(joined, self.max_context_chars)

    @staticmethod
    def _resolve_language(language: Optional[str] = None) -> str:
        if language is None:
            return "en"

        if isinstance(language, (tuple, list)) and language:
            lang = language[0]
        else:
            lang = language

        if not isinstance(lang, str):
            return "en"

        c = lang.strip().lower()
        if c.startswith("vi"):
            return "vi"
        if c.startswith("en"):
            return "en"
        return "en"

    def _fallback_no_context(self, language: str | None = None) -> str:
        code = self._resolve_language(language)
        if code == "vi":
            return "Tôi không tìm thấy thông tin về vấn đề này trong tài liệu."
        return "I could not find information about this topic in the documents."

    async def generate_answer_async(
        self,
        question: str,
        contexts: Sequence[Union[Document, Dict[str, Any]]],
        *,
        target_language: str | None = None,
    ) -> str:
        lang = self._resolve_language(target_language)
        if not contexts:
            return self._fallback_no_context(lang)

        context_text = self.format_contexts(contexts)
        if not context_text.strip():
            return self._fallback_no_context(lang)

        try:
            return await self.chain.ainvoke(
                {
                    "context": context_text,
                    "question": question.strip(),
                    "target_language": lang,
                }
            )
        except google_exceptions.ResourceExhausted as e:
            logger.error(f"Gemini API quota exceeded: {e}")
            raise RuntimeError("API quota exceeded.") from e
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            raise

    async def generate_direct_answer_async(
        self,
        question: str,
        history: Optional[Sequence[BaseMessage | Dict[str, Any] | str]] = None,
        *,
        target_language: str | None = None,
    ) -> str:
        lang = self._resolve_language(target_language)
        clean_question = question.strip()
        if not clean_question:
            return self._fallback_no_context(lang)

        formatted_history: list[BaseMessage] = []
        if history:
            for item in history:
                message: BaseMessage | None = None
                if isinstance(item, BaseMessage):
                    message = item
                elif isinstance(item, dict):
                    role = str(item.get("role", "")).lower()
                    content = item.get("content") or item.get("text") or ""
                    if not content:
                        continue
                    if role == "assistant":
                        message = AIMessage(content=content)
                    else:
                        message = HumanMessage(content=content)
                elif isinstance(item, str):
                    message = HumanMessage(content=item)
                if message is not None:
                    formatted_history.append(message)

        try:
            return await self.direct_chain.ainvoke(
                {
                    "history": formatted_history,
                    "question": clean_question,
                    "target_language": lang,
                }
            )
        except Exception as e:
            logger.error(f"Error generating direct answer: {e}")
            raise

    async def invoke_json(self, system_prompt: str, user_input: str) -> Optional[Dict[str, Any]]:
        p = ChatPromptTemplate.from_messages([("system", system_prompt), ("human", "{input}")])
        c = p | self.llm | self.parser
        try:
            raw = await c.ainvoke({"input": user_input})
            clean = raw.strip().replace("```json", "").replace("```", "")
            return json.loads(clean)
        except Exception as e:
            logger.error(f"JSON Invoke Error: {e}")
            return None
