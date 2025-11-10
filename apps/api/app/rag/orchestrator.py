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
        search_type: str = "similarity",  # or "mmr"
        return_top_sources: int = 3,
    ) -> Dict[str, Any]:
        """
        Main RAG pipeline:
        - retrieve -> score/ confidence -> LLM or fallback
        """
        t0 = time.time()

        # 1) Retrieve
        contexts = self.retriever.retrieve(
            query=question,
            top_k=top_k,
            where=where,
            with_score=True,
        )

        # 2) Confidence
        confidence = self.retriever.calculate_confidence(contexts)

        # 3) Decision policy
        fallback_triggered = False
        if not contexts:
            answer = "Tôi không tìm thấy thông tin về vấn đề này"
            fallback_triggered = True
        elif confidence >= settings.CONFIDENCE_THRESHOLD:
            # confident → trả lời bình thường
            answer = await self.llm_wrapper.generate_answer_async(question, contexts)
        else:
            # medium/low confidence → vẫn gọi LLM nhưng báo “không chắc chắn”
            # (Nếu muốn strict: comment 2 dòng dưới và dùng fallback cứng)
            cautious_prefix = "Mình chưa chắc chắn lắm, nhưng dựa trên thông tin hiện có: "
            try:
                raw = await self.llm_wrapper.generate_answer_async(question, contexts)
            except Exception as e:
                logger.error(f"LLM generation failed: {e}")
                return {
                    "answer": "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
                    "confidence": 0.0,
                    "fallback_triggered": True,
                    "error": str(e),
                }
            answer = cautious_prefix + raw
            # fallback mềm, vẫn set cờ để front-end biết hiển thị banner
            fallback_triggered = True

        # 4) sources gợi ý cho UI
        sources = []
        for c in contexts[:return_top_sources]:
            md = c.get("metadata", {})
            sources.append(
                {
                    "document_id": md.get("document_id"),
                    "chunk_id": md.get("chunk_id"),
                    "chunk_index": md.get("chunk_index"),
                    "source": md.get("source"),
                    "page": md.get("page"),
                    "score": c.get("score"),
                }
            )

        latency_ms = int((time.time() - t0) * 1000)
        return {
            "answer": answer,
            "confidence": round(confidence, 3),
            "sources": sources,
            "fallback_triggered": fallback_triggered,
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
        """
        LCEL chain: retrieve → format → prompt → LLM → parse
        Cho phép filter & mmr từ đầu.
        """
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
