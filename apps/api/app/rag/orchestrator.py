from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from app.rag.guardrail import GuardrailService
from app.rag.language import detect_language_enhanced
from app.rag.llm import LLMWrapper
from app.rag.prompts import get_greeting_intent_prompt
from app.rag.retriever import Retriever

try:
    from app.rag.normalizer import UnifiedNormalizer
except Exception:
    UnifiedNormalizer = None


class RAGOrchestrator:
    def __init__(
        self,
        retriever: Optional[Retriever] = None,
        llm_wrapper: Optional[LLMWrapper] = None,
    ):
        self.retriever = retriever or Retriever()
        self.llm = llm_wrapper or LLMWrapper()
        self.guardrail = GuardrailService(self.llm)

        try:
            self.normalizer = UnifiedNormalizer(self.llm)
        except Exception:
            self.normalizer = None

    async def _detect_greeting_llm(self, text: str) -> bool:
        cleaned = (text or "").strip()
        if not cleaned:
            return False

        prompt = get_greeting_intent_prompt()
        try:
            data = await self.llm.invoke_json(prompt, cleaned)
        except Exception:
            return False

        if isinstance(data, dict):
            return bool(data.get("is_greeting", False))
        return False

    async def _rewrite_with_context(
        self,
        history: List[Dict[str, str]],
        question: str,
        target_lang: str,
    ) -> str:
        """
        Dùng LLM để rewrite câu hỏi thành câu độc lập, dùng history để resolve
        'nó', 'đó', 'it', 'that', ...
        history: list các dict {"role": "user"/"assistant", "text": "..."}
        """

        if not history:
            return question

        # chỉ lấy vài message gần nhất cho gọn prompt
        recent = history[-6:]

        history_lines: List[str] = []
        for msg in recent:
            role = (msg.get("role") or "").lower()
            text = (msg.get("text") or "").strip()
            if not text:
                continue
            if role == "user":
                history_lines.append(f"User: {text}")
            elif role == "assistant":
                history_lines.append(f"Assistant: {text}")
            else:
                history_lines.append(f"Other: {text}")

        if not history_lines:
            return question

        history_block = "\n".join(history_lines)

        prompt = (
            "You are a helper that rewrites user questions into standalone questions for a RAG system.\n"
            "Use the conversation history to resolve pronouns like 'nó', 'đó', 'cái đó', 'it', 'that', etc.\n"
            f"The target language is '{target_lang}' ('vi' for Vietnamese, 'en' for English).\n"
            "Return ONLY JSON with a single key 'rewritten_question'.\n"
        )

        payload = (
            f"Conversation history:\n{history_block}\n\n"
            f"New user question:\n{question}\n\n"
            "Rewrite the new user question into a standalone, fully specified question.\n"
        )

        try:
            data: Any = await self.llm.invoke_json(prompt, payload)
            if isinstance(data, dict):
                rq = data.get("rewritten_question")
                if isinstance(rq, str) and rq.strip():
                    return rq.strip()
        except Exception:
            # Nếu có lỗi thì fallback dùng nguyên câu gốc
            return question

        return question

    async def query(
        self,
        question: str,
        top_k: int = 5,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict:
        t0 = time.time()
        raw_q = (question or "").strip()
        if not raw_q:
            return {
                "answer": "Please input a valid question.",
                "confidence": 0,
                "sources": [],
                "fallback_triggered": True,
                "latency_ms": int((time.time() - t0) * 1000),
            }

        # Ngôn ngữ: chỉ hỗ trợ vi/en
        lang = detect_language_enhanced(raw_q, llm_wrapper=self.llm)
        if lang not in {"vi", "en"}:
            return {
                "answer": "please in put Vietnamese or English",
                "confidence": 0,
                "fallback_triggered": True,
                "sources": [],
                "latency_ms": int((time.time() - t0) * 1000),
            }
        target_lang = "vi" if lang == "vi" else "en"

        # Guardrail
        gr = await self.guardrail.check_safety(raw_q)
        if gr.get("status") == "blocked":
            return {
                "answer": gr[target_lang],
                "confidence": 1,
                "fallback_triggered": False,
                "sources": [],
                "latency_ms": int((time.time() - t0) * 1000),
            }

        # Greeting
        is_greeting = await self._detect_greeting_llm(raw_q)
        if is_greeting:
            ans = (
                "Chào bạn, tôi có thể hỗ trợ gì cho bạn?"
                if target_lang == "vi"
                else "Hello! How can I assist you today?"
            )
            return {
                "answer": ans,
                "confidence": 1,
                "fallback_triggered": False,
                "sources": [],
                "latency_ms": int((time.time() - t0) * 1000),
            }

        # Kiểm tra retriever có tài liệu không
        try:
            if hasattr(self.retriever, "is_empty") and self.retriever.is_empty():
                fb = (
                    "Hiện hệ thống chưa có tài liệu nào để trả lời."
                    if target_lang == "vi"
                    else "The system does not have any documents yet."
                )
                return {
                    "answer": fb,
                    "confidence": 0,
                    "fallback_triggered": True,
                    "sources": [],
                    "latency_ms": int((time.time() - t0) * 1000),
                }
        except Exception:
            pass

        # Rewrite query với history (nếu có)
        rewritten_q = await self._rewrite_with_context(history or [], raw_q, target_lang)

        # Normalizer (nếu có) chạy trên câu đã rewrite
        if self.normalizer:
            try:
                norm = await self.normalizer.understand(rewritten_q)
                nq = norm.get("normalized_text", rewritten_q)
            except Exception:
                nq = rewritten_q
        else:
            nq = rewritten_q

        try:
            contexts = self.retriever.retrieve(nq, top_k=top_k, with_score=True)
        except Exception:
            return {
                "answer": "System Error",
                "confidence": 0,
                "fallback_triggered": True,
                "sources": [],
                "latency_ms": int((time.time() - t0) * 1000),
            }

        if not contexts:
            fb = (
                "Tôi không tìm thấy thông tin."
                if target_lang == "vi"
                else "I could not find information."
            )
            return {
                "answer": fb,
                "confidence": 0,
                "fallback_triggered": True,
                "sources": [],
                "latency_ms": int((time.time() - t0) * 1000),
            }

        conf = self.retriever.calculate_confidence(contexts)
        if conf < 0.65:
            fb = (
                "Tôi không tìm thấy thông tin."
                if target_lang == "vi"
                else "I could not find information."
            )
            return {
                "answer": fb,
                "confidence": conf,
                "fallback_triggered": True,
                "sources": [],
                "latency_ms": int((time.time() - t0) * 1000),
            }

        ans = await self.llm.generate_answer_async(
            nq,
            contexts,
            target_language=target_lang,
        )
        source_payload = [
            {
                "source": c.get("source") or c["metadata"].get("source"),
                "page": c.get("page") or c["metadata"].get("page"),
                "chunk_id": c.get("chunk_id"),
                "text_preview": c.get("text_preview"),
                "score": c.get("score"),
            }
            for c in contexts
        ]

        return {
            "answer": ans,
            "confidence": conf,
            "fallback_triggered": False,
            "sources": source_payload,
            "latency_ms": int((time.time() - t0) * 1000),
        }
