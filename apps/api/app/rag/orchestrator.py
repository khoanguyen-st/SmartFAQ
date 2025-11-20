# orchestrator.py
from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional, Sequence

from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

from app.core.config import settings
from app.rag.llm import LLMWrapper
from app.rag.retriever import Retriever

logger = logging.getLogger(__name__)


def _clip(text: str, max_chars: int = 8000) -> str:
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 3] + "..."


class RAGOrchestrator:
    def __init__(
        self, retriever: Optional[Retriever] = None, llm_wrapper: Optional[LLMWrapper] = None
    ):
        self.retriever = retriever or Retriever()
        self.llm_wrapper = llm_wrapper or LLMWrapper()

    async def query(
        self,
        question: str,
        user_id: Optional[str] = None,
        *,
        top_k: int = 5,
        where: Optional[Dict[str, Any]] = None,
        search_type: str = "similarity",
        return_top_sources: int = 3,
        response_language: str = "en",
    ) -> Dict[str, Any]:
        t0 = time.time()

        # 1) Retrieve
        try:
            contexts = self.retriever.retrieve(
                query=question,
                top_k=top_k,
                where=where,
                with_score=True,
            )
        except Exception as e:
            logger.exception("Retriever failed: %s", e)
            error_msg = (
                "Xin lỗi, hệ thống tìm kiếm tài liệu gặp lỗi. Vui lòng thử lại sau."
                if response_language == "vi"
                else "Sorry, the document search system failed. Please try again later."
            )
            return {
                "answer": error_msg,
                "confidence": 0.0,
                "sources": [],
                "fallback_triggered": True,
                "latency_ms": int((time.time() - t0) * 1000),
                "error": str(e),
            }

        if not isinstance(contexts, list):
            contexts = []

        logger.debug("Retrieved %d contexts for question=%s", len(contexts), question)

        # 2) Confidence (retriever-level)
        confidence = self.retriever.calculate_confidence(contexts)

        # threshold
        threshold = float(getattr(settings, "CONFIDENCE_THRESHOLD", 0.65))

        answer: str = ""
        fallback_triggered = False
        sources_to_return: List[Dict[str, Any]] = []

        is_vi = response_language == "vi"
        fallback_text = (
            "Tôi không tìm thấy thông tin về vấn đề này"
            if is_vi
            else "I could not find information about that."
        )
        error_text = (
            "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau."
            if is_vi
            else "Sorry, the system encountered an error. Please try again later."
        )

        if not contexts:
            logger.info("No contexts found for question=%s -> hard fallback", question)
            answer = fallback_text
            fallback_triggered = True
            sources_to_return = []
        else:
            logger.debug("Retriever confidence=%.4f threshold=%.4f", confidence, threshold)

            if confidence >= threshold:
                # confident: call LLM with explicit target language
                try:
                    raw = await self.llm_wrapper.generate_answer_async(
                        question, contexts, target_language=response_language
                    )
                except Exception as e:
                    logger.exception("LLM generation failed on confident path: %s", e)
                    return {
                        "answer": error_text,
                        "confidence": 0.0,
                        "sources": [],
                        "fallback_triggered": True,
                        "latency_ms": int((time.time() - t0) * 1000),
                        "error": str(e),
                    }
                answer = raw or ""
                sources_to_return = contexts[:return_top_sources]
            else:
                logger.info(
                    "Retriever confidence too low (%.4f < %.4f) for question=%s -> fallback (no sources)",
                    confidence,
                    threshold,
                    question,
                )
                answer = fallback_text
                fallback_triggered = True
                sources_to_return = []

        if is_vi:
            llm_fallback_markers = [
                "tôi không tìm thấy thông tin",
                "không tìm thấy thông tin",
            ]
        else:
            llm_fallback_markers = [
                "could not find",
                "no information",
                "i do not know",
                "i don't know",
            ]

        normalized_answer = (answer or "").strip().lower()
        if sources_to_return and (
            normalized_answer == ""
            or any(marker in normalized_answer for marker in llm_fallback_markers)
        ):
            logger.warning(
                "LLM returned fallback-like answer despite contexts present. question=%s retriever_confidence=%.4f top_context_preview=%s",
                question,
                confidence,
                (sources_to_return[0].get("text") or "")[:300] if sources_to_return else None,
            )
            fallback_triggered = True
            sources_to_return = []
            confidence = 0.0
            answer = fallback_text

        # Build sources payload
        sources_list: List[Dict[str, Any]] = []
        for c in sources_to_return or []:
            md = c.get("metadata", {}) or {}
            sources_list.append(
                {
                    "document_id": md.get("document_id"),
                    "chunk_id": md.get("chunk_id"),
                    "chunk_index": md.get("chunk_index"),
                    "source": md.get("source") or md.get("uri") or md.get("url"),
                    "page": md.get("page"),
                    "score": c.get("score"),
                    "text_preview": (c.get("text") or "")[:500],
                }
            )

        latency_ms = int((time.time() - t0) * 1000)
        return {
            "answer": answer,
            "confidence": round(float(confidence), 4),
            "sources": sources_list,
            "fallback_triggered": bool(fallback_triggered),
            "latency_ms": latency_ms,
        }

    def build_rag_chain(
        self,
        *,
        k: int = 5,
        where: Optional[Dict[str, Any]] = None,
        search_type: str = "similarity",
        max_context_chars: int = 8000,
    ):
        retriever = self.retriever.get_langchain_retriever(
            k=k, where=where, search_type=search_type
        )

        def format_docs(docs: Sequence[Document]) -> str:
            parts: List[str] = []
            for i, d in enumerate(docs, start=1):
                src = d.metadata.get("source") or "N/A"
                page = d.metadata.get("page")
                page_info = f" (trang {page})" if page else ""
                parts.append(f"[Nguồn {i} - {src}{page_info}]\n{d.page_content}")
            return _clip("\n\n".join(parts), max_chars=max_context_chars)

        rag_chain = (
            {
                "context": retriever | format_docs,
                "question": RunnablePassthrough(),
            }
            | self.llm_wrapper.prompt
            | self.llm_wrapper.llm
            | StrOutputParser()
        )
        return rag_chain
