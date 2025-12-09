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
        max_context_chars: int = 8000,
        max_tokens: Optional[int] = None,
    ):
        llm_model = model or settings.LLM_MODEL
        llm_temperature = temperature if temperature is not None else settings.LLM_TEMPERATURE
        llm_max_tokens = max_tokens or getattr(settings, "LLM_MAX_TOKENS", 512)

        is_gemini = "gemini" in llm_model.lower()

        if is_gemini:
            self.llm = ChatGoogleGenerativeAI(
                model=llm_model,
                temperature=llm_temperature,
                max_output_tokens=llm_max_tokens,
                google_api_key=getattr(settings, "GOOGLE_API_KEY", None),
                max_retries=2,
            )
            logger.info(f"LLM initialized with Google Gemini model: {llm_model}")
        else:
            from langchain_openai import ChatOpenAI

            local_base_url = getattr(settings, "LOCAL_LLM_BASE_URL", "http://localhost:11434/v1")

            self.llm = ChatOpenAI(
                model=llm_model,
                temperature=llm_temperature,
                max_tokens=llm_max_tokens,
                base_url=local_base_url,
                api_key="not-needed",
                max_retries=2,
            )
            logger.info(f"LLM initialized with Local AI model: {llm_model} at {local_base_url}")

        self.system_prompt = (
            "Bạn là trợ lý AI thông minh của Đại học Greenwich Việt Nam.\n\n"
            "NHIỆM VỤ: Tổng hợp thông tin từ nhiều Context sources để trả lời TOÀN DIỆN.\n\n"
            "QUY TẮC QUAN TRỌNG:\n"
            "1. NGÔN NGỮ: Trả lời bằng ngôn ngữ của câu hỏi (Vietnamese/English)\n"
            "2. TỔNG HỢP: Kết hợp thông tin từ TẤT CẢ sources liên quan\n"
            "3. ĐẦY ĐỦ: Với câu hỏi ngắn (1-3 từ), cung cấp thông tin TOÀN DIỆN:\n"
            "   - Định nghĩa/Giới thiệu\n"
            "   - Thông tin chi tiết (điều kiện, quy định, số liệu)\n"
            "   - Liên hệ/Tham khảo (nếu có)\n"
            "4. TRÍCH DẪN: Luôn cite nguồn với format (Nguồn X - tên file)\n"
            "5. CHỈ từ chối khi Context HOÀN TOÀN không liên quan\n\n"
            "FORMAT:\n"
            "• Dùng bullet points (•) cho danh sách\n"
            "• Nhóm thông tin theo chủ đề\n"
            "• Làm nổi bật số liệu, deadline quan trọng\n"
            "• Thêm email/link nếu có\n\n"
            "VÍ DỤ CÁCH TRẢ LỜI:\n\n"
            "--- VÍ DỤ 1: Short Query ---\n"
            'Câu hỏi: "Chương trình 3+0"\n'
            "Context: [5 sources về chương trình liên kết, ngành học, học phí]\n"
            "Trả lời:\n"
            '"Chương trình 3+0 (liên kết quốc tế Greenwich):"\n\n'
            "**Giới thiệu:**\n"
            "• Chương trình liên kết với Đại học Greenwich (Anh Quốc)\n"
            "• Sinh viên học toàn bộ 3 năm tại Việt Nam\n"
            "• Nhận bằng cử nhân quốc tế\n\n"
            "**Ngành học:**\n"
            "• Công nghệ thông tin (IT)\n"
            "• Quản trị kinh doanh (Business)\n"
            "• Kế toán - Tài chính\n\n"
            "**Học phí:** 150-180 triệu VNĐ/năm (tùy ngành)\n\n"
            "**Điều kiện:** Tốt nghiệp THPT, IELTS 5.5+ hoặc tương đương\n\n"
            '(Nguồn 1 - 3+0.pdf, Nguồn 2 - Quy chế Đào tạo F2G.pdf)"\n\n'
            "--- VÍ DỤ 2: Specific Question ---\n"
            'Câu hỏi: "Làm thế nào để tôi được nhận thưởng"\n'
            "Context: [3 sources về điều kiện khen thưởng]\n"
            "Trả lời:\n"
            '"Để được xét khen thưởng học sinh giỏi:"\n\n'
            "**Điều kiện:**\n"
            "• GPA ≥ 3.6/4.0 hoặc ≥ 8.5/10\n"
            "• Không có môn nào dưới 7.0\n"
            "• Không vi phạm kỷ luật\n\n"
            "**Mức thưởng:**\n"
            "• Xuất sắc: 5 triệu VNĐ + giảm 50% học phí kỳ sau\n"
            "• Giỏi: 3 triệu VNĐ + giảm 30% học phí kỳ sau\n"
            "• Khá: 1 triệu VNĐ\n\n"
            "**Thủ tục:** Nộp đơn qua phòng Công tác sinh viên trước 30/6\n\n"
            '(Nguồn 1 - Sổ tay Sinh viên 2025.pdf, Nguồn 2 - Quy chế Đào tạo.pdf)"\n\n'
            "QUAN TRỌNG:\n"
            "- KHÔNG bỏ qua thông tin quan trọng từ Context\n"
            "- KHÔNG tự thêm thông tin không có trong Context\n"
            "- LUÔN structure câu trả lời rõ ràng, dễ đọc\n"
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
        max_sources: int = 10,
    ) -> str:
        """Format contexts grouped by document for better comprehension."""
        from collections import defaultdict

        # Group contexts by source document
        grouped = defaultdict(list)
        for ctx in contexts[:max_sources]:
            if isinstance(ctx, Document):
                source = ctx.metadata.get("source") or ctx.metadata.get("document_id") or "Unknown"
                grouped[source].append(ctx)
            else:
                meta = ctx.get("metadata", {}) or {}
                source = meta.get("source") or meta.get("document_id") or "Unknown"
                grouped[source].append(ctx)

        # Format grouped contexts
        pieces = []
        source_idx = 1

        for source, source_contexts in grouped.items():
            # Add document header
            source_name = source.split("/")[-1] if "/" in source else source
            pieces.append(f"=== NGUỒN {source_idx}: {source_name} ===")

            # Add all chunks from this source
            for ctx in source_contexts:
                if isinstance(ctx, Document):
                    content = ctx.page_content or ""
                    page = ctx.metadata.get("page")
                else:
                    content = ctx.get("text", "") or ""
                    meta = ctx.get("metadata", {}) or {}
                    page = meta.get("page")

                page_info = f" (trang {page})" if page else ""
                pieces.append(f"{content}{page_info}")

            pieces.append("")  # Empty line between sources
            source_idx += 1

        joined = "\n\n".join(pieces).strip()
        clipped = _clip(joined, self.max_context_chars)

        # Debug log
        logger.debug(
            f"Formatted {len(grouped)} unique sources, {len(contexts[:max_sources])} total contexts, "
            f"chars: {len(joined)} (clipped to {len(clipped)})"
        )

        return clipped

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
            answer = await self.chain.ainvoke(
                {
                    "context": context_text,
                    "question": question.strip(),
                    "target_language": lang,
                }
            )

            # Validate response is not empty
            if not answer or not answer.strip():
                logger.warning(f"LLM returned empty response for: {question[:50]}")
                return self._fallback_no_context(lang)

            return answer

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
