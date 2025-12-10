from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional, Sequence, Union

from google.api_core import exceptions as google_exceptions
from google.genai import Client  # ✅ v1.54.0
from langchain_core.documents import Document
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompt_values import ChatPromptValue
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import Runnable, RunnableConfig
from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import settings

logger = logging.getLogger(__name__)


def _clip(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 3] + "..."


class GemmaWrapper(Runnable):
    """Native wrapper for Gemma models using google-genai v1.54.0"""

    def __init__(self, model: str, temperature: float, max_output_tokens: int, api_key: str):
        super().__init__()
        # ✅ Initialize Google GenAI client v1.54.0
        self.client = Client(api_key=api_key)
        self.model_name = model
        self.temperature = temperature
        self.max_output_tokens = max_output_tokens

        logger.info(f"GemmaWrapper initialized with google-genai v1.54.0, model: {model}")

    def _format_messages_to_prompt(self, messages: list) -> str:
        """Convert LangChain messages to a single prompt string"""
        prompt_parts = []

        for msg in messages:
            if isinstance(msg, SystemMessage):
                # System messages go directly into the prompt
                prompt_parts.append(msg.content)
            elif isinstance(msg, HumanMessage):
                # Human messages are the questions
                prompt_parts.append(f"\nQuestion: {msg.content}")
            elif isinstance(msg, AIMessage):
                # AI messages are previous responses
                prompt_parts.append(f"\nAssistant: {msg.content}")
            elif isinstance(msg, tuple):
                role, content = msg
                if role == "system":
                    prompt_parts.append(f"{content}")
                elif role == "human":
                    prompt_parts.append(f"\nQuestion: {content}")
            elif isinstance(msg, dict):
                role = msg.get("role", "")
                content = msg.get("content", "")
                if role == "system":
                    prompt_parts.append(f"{content}")
                elif role in ["human", "user"]:
                    prompt_parts.append(f"\nQuestion: {content}")

        result = "\n\n".join(prompt_parts)

        # Ensure we never send empty prompt
        if not result.strip():
            logger.warning(f"[GemmaWrapper] Empty prompt generated from {len(messages)} messages!")
            logger.warning(f"[GemmaWrapper] Message types: {[type(m).__name__ for m in messages]}")
            result = "Hello"  # Fallback to prevent empty prompt

        return result

    async def ainvoke(
        self, input: Any, config: Optional[RunnableConfig] = None, **kwargs: Any
    ) -> AIMessage:
        """Async invoke compatible with LangChain interface"""
        # Debug logging
        logger.info(f"[GemmaWrapper] ainvoke input type: {type(input)}")
        logger.info(
            f"[GemmaWrapper] ainvoke input: {input if not isinstance(input, list) else f'List with {len(input)} items'}"
        )

        # Handle ChatPromptValue from ChatPromptTemplate
        if isinstance(input, ChatPromptValue):
            messages = input.to_messages()
            logger.info(f"[GemmaWrapper] Extracted {len(messages)} messages from ChatPromptValue")
            for i, msg in enumerate(messages):
                logger.info(f"  Message {i}: {type(msg).__name__} - {str(msg.content)[:100]}")
        elif isinstance(input, list):
            messages = input
            logger.info(f"[GemmaWrapper] Processing {len(messages)} messages")
            for i, msg in enumerate(messages):
                logger.info(f"  Message {i}: {type(msg).__name__} - {str(msg)[:100]}")
        elif isinstance(input, dict):
            # Fallback for dict input
            messages = input.get("messages", [])
            logger.info(f"[GemmaWrapper] Extracted {len(messages)} messages from dict")
        else:
            messages = [input]
            logger.warning("[GemmaWrapper] Unknown input type, wrapped into list")

        prompt = self._format_messages_to_prompt(messages)

        logger.info(f"[GemmaWrapper] Formatted prompt (first 500 chars): {prompt[:500]}")

        try:
            # ✅ v1.54.0 API - async generation
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={
                    "temperature": self.temperature,
                    "max_output_tokens": self.max_output_tokens,
                    "top_p": 0.95,
                    "top_k": 40,
                },
            )

            # ✅ Extract text from response (v1.54.0)
            text = ""
            if hasattr(response, "text") and response.text:
                text = response.text
            elif hasattr(response, "candidates") and response.candidates:
                if len(response.candidates) > 0:
                    candidate = response.candidates[0]
                    if hasattr(candidate, "content"):
                        if hasattr(candidate.content, "parts") and candidate.content.parts:
                            text = candidate.content.parts[0].text
                        elif hasattr(candidate.content, "text"):
                            text = candidate.content.text

            logger.info(f"[GemmaWrapper] Generated response (first 200 chars): {text[:200]}")
            return AIMessage(content=text)

        except Exception as e:
            logger.error(f"Gemma generation error: {e}", exc_info=True)
            raise

    def invoke(
        self, input: Any, config: Optional[RunnableConfig] = None, **kwargs: Any
    ) -> AIMessage:
        """Sync invoke (fallback)"""
        # Handle ChatPromptValue from ChatPromptTemplate
        if isinstance(input, ChatPromptValue):
            messages = input.to_messages()
            logger.info(f"[GemmaWrapper] Extracted {len(messages)} messages from ChatPromptValue")
        elif isinstance(input, list):
            messages = input
        elif isinstance(input, dict):
            # Fallback for dict input
            messages = input.get("messages", [])
        else:
            messages = [input]
            logger.warning("[GemmaWrapper] Unknown input type, wrapped into list")

        prompt = self._format_messages_to_prompt(messages)

        logger.info(f"[GemmaWrapper] Formatted prompt (first 500 chars): {prompt[:500]}")

        try:
            # ✅ v1.54.0 API - sync generation
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={
                    "temperature": self.temperature,
                    "max_output_tokens": self.max_output_tokens,
                    "top_p": 0.95,
                    "top_k": 40,
                },
            )

            # Extract text from response
            text = ""
            if hasattr(response, "text") and response.text:
                text = response.text
            elif hasattr(response, "candidates") and response.candidates:
                if len(response.candidates) > 0:
                    candidate = response.candidates[0]
                    if hasattr(candidate, "content"):
                        if hasattr(candidate.content, "parts") and candidate.content.parts:
                            text = candidate.content.parts[0].text
                        elif hasattr(candidate.content, "text"):
                            text = candidate.content.text

            return AIMessage(content=text)

        except Exception as e:
            logger.error(f"Gemma generation error: {e}", exc_info=True)
            raise


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
        api_key = getattr(settings, "GOOGLE_API_KEY", None)

        # Detect if using Gemma model
        self.is_gemma = "gemma" in llm_model.lower()

        if self.is_gemma:
            # ✅ Use native wrapper for Gemma with google-genai v1.54.0
            logger.info(f"Using GemmaWrapper (google-genai v1.54.0) for model: {llm_model}")
            self.llm = GemmaWrapper(
                model=llm_model,
                temperature=llm_temperature,
                max_output_tokens=llm_max_tokens,
                api_key=api_key,
            )
        else:
            # ✅ Use LangChain wrapper for Gemini
            logger.info(f"Using ChatGoogleGenerativeAI for model: {llm_model}")
            self.llm = ChatGoogleGenerativeAI(
                model=llm_model,
                temperature=llm_temperature,
                max_output_tokens=llm_max_tokens,
                google_api_key=api_key,
            )

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
            "⚠️ FORMAT BẮT BUỘC (MARKDOWN):\n"
            "• Dùng markdown list syntax: `- ` (dấu gạch ngang + khoảng trắng) cho bullet points\n"
            "• MỖI list item PHẢI trên một dòng riêng biệt\n"
            "• Thêm một dòng trống giữa các sections\n"
            "• Dùng **text** cho in đậm, *text* cho in nghiêng\n"
            "• Làm nổi bật số liệu, deadline quan trọng\n\n"
            "VÍ DỤ CÁCH TRẢ LỜI:\n\n"
            "--- VÍ DỤ 1: Short Query ---\n"
            'Câu hỏi: "Chương trình 3+0"\n'
            "Context: [5 sources về chương trình liên kết, ngành học, học phí]\n"
            "Trả lời:\n"
            "Chương trình 3+0 (liên kết quốc tế Greenwich):\n\n"
            "**Giới thiệu:**\n"
            "- Chương trình liên kết với Đại học Greenwich (Anh Quốc)\n"
            "- Sinh viên học toàn bộ 3 năm tại Việt Nam\n"
            "- Nhận bằng cử nhân quốc tế\n\n"
            "**Ngành học:**\n"
            "- Công nghệ thông tin (IT)\n"
            "- Quản trị kinh doanh (Business)\n"
            "- Kế toán - Tài chính\n\n"
            "**Học phí:** 150-180 triệu VNĐ/năm (tùy ngành)\n\n"
            "**Điều kiện:** Tốt nghiệp THPT, IELTS 5.5+ hoặc tương đương\n\n"
            "(Nguồn 1 - 3+0.pdf, Nguồn 2 - Quy chế Đào tạo F2G.pdf)\n\n"
            "--- VÍ DỤ 2: Specific Question ---\n"
            'Câu hỏi: "Làm thế nào để tôi được nhận thưởng"\n'
            "Context: [3 sources về điều kiện khen thưởng]\n"
            "Trả lời:\n"
            "Để được xét khen thưởng học sinh giỏi:\n\n"
            "**Điều kiện:**\n"
            "- GPA ≥ 3.6/4.0 hoặc ≥ 8.5/10\n"
            "- Không có môn nào dưới 7.0\n"
            "- Không vi phạm kỷ luật\n\n"
            "**Mức thưởng:**\n"
            "- Xuất sắc: 5 triệu VNĐ + giảm 50% học phí kỳ sau\n"
            "- Giỏi: 3 triệu VNĐ + giảm 30% học phí kỳ sau\n"
            "- Khá: 1 triệu VNĐ\n\n"
            "**Thủ tục:** Nộp đơn qua phòng Công tác sinh viên trước 30/6\n\n"
            "(Nguồn 1 - Sổ tay Sinh viên 2025.pdf, Nguồn 2 - Quy chế Đào tạo.pdf)\n\n"
            "--- VÍ DỤ 3: Multiple Bullet Points ---\n"
            'Câu hỏi: "Điều kiện bị đuổi học"\n'
            "Trả lời:\n"
            "Các trường hợp bị buộc thôi học:\n\n"
            "- Vi phạm kỷ luật tới mức đình chỉ học tập\n"
            "- Vượt quá thời hạn tối đa được phép học\n"
            "- Không hoàn thành nghĩa vụ tài chính\n"
            "- Không nộp bài ở giai đoạn chuyên ngành\n"
            "- Bị kỷ luật ở mức buộc thôi học\n\n"
            "(Nguồn 1 - Quy chế Đào tạo.pdf)\n\n"
            "⚠️ QUAN TRỌNG - MARKDOWN SYNTAX:\n"
            "- Dùng `- ` (dash + space) cho mỗi list item, KHÔNG dùng • hoặc bullet character\n"
            "- Mỗi list item trên MỘT dòng riêng\n"
            "- SAI: • Item 1 • Item 2 • Item 3\n"
            "- ĐÚNG:\n"
            "  - Item 1\n"
            "  - Item 2\n"
            "  - Item 3\n\n"
            "QUAN TRỌNG:\n"
            "- KHÔNG bỏ qua thông tin quan trọng từ Context\n"
            "- KHÔNG tự thêm thông tin không có trong Context\n"
            "- LUÔN structure câu trả lời rõ ràng, dễ đọc\n"
        )

        # ✅ Unified prompt templates
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

        grouped = defaultdict(list)
        for ctx in contexts[:max_sources]:
            if isinstance(ctx, Document):
                source = ctx.metadata.get("source") or ctx.metadata.get("document_id") or "Unknown"
                grouped[source].append(ctx)
            else:
                meta = ctx.get("metadata", {}) or {}
                source = meta.get("source") or meta.get("document_id") or "Unknown"
                grouped[source].append(ctx)

        pieces = []
        source_idx = 1

        for source, source_contexts in grouped.items():
            source_name = source.split("/")[-1] if "/" in source else source
            pieces.append(f"=== NGUỒN {source_idx}: {source_name} ===")

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

            pieces.append("")
            source_idx += 1

        joined = "\n\n".join(pieces).strip()
        clipped = _clip(joined, self.max_context_chars)

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

            if not answer or not answer.strip():
                logger.warning(f"LLM returned empty response for: {question[:50]}")
                return self._fallback_no_context(lang)

            return answer

        except google_exceptions.ResourceExhausted as e:
            logger.error(f"API quota exceeded: {e}")
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

    async def evaluate_answer_confidence(
        self,
        question: str,
        answer: str,
        contexts: Optional[Sequence[Union[Document, Dict[str, Any]]]] = None,
    ) -> float:
        """Evaluate confidence of generated answer using LLM self-evaluation."""
        evaluation_prompt = """You are an expert evaluator assessing the quality of AI-generated answers.

Evaluate the following answer on a scale of 0.0 to 1.0 based on these criteria:

1. **Relevance** (0.0-0.3): Does the answer directly address the question?
2. **Completeness** (0.0-0.3): Does it provide comprehensive information?
3. **Accuracy** (0.0-0.2): Is the information presented correctly?
4. **Clarity** (0.0-0.2): Is it well-structured and easy to understand?

**IMPORTANT GUIDELINES:**
- Start from 0.8 baseline for comprehensive answers
- Detailed answers with multiple sections are GOOD, not bad
- Reward citations from multiple sources (+0.05 per source, max +0.15)
- Reward clear structure with bullet points/sections (+0.05)
- Only penalize if answer is actually wrong, irrelevant, or incomplete
- Score range: Use 0.7-1.0 for good answers, 0.4-0.7 for partial, 0.0-0.4 for poor

Return ONLY a JSON object with this format:
{{
    "confidence": <float between 0.0 and 1.0>,
    "reasoning": "<brief explanation in 1 sentence>"
}}"""

        try:
            result = await self.invoke_json(
                evaluation_prompt, f"Question: {question}\n\nAnswer: {answer}"
            )

            if result and "confidence" in result:
                conf = float(result["confidence"])
                reasoning = result.get("reasoning", "N/A")
                conf = max(0.0, min(1.0, conf))
                logger.info(f"Answer evaluation: {conf:.2f} - {reasoning}")
                return conf
            else:
                logger.warning("LLM evaluation returned invalid format, defaulting to 0.7")
                return 0.7

        except Exception as e:
            logger.error(f"Error evaluating answer confidence: {e}")
            return 0.7
