from __future__ import annotations

import logging
import time
import uuid
from typing import Dict, List, Optional

from google.api_core import exceptions as google_exceptions

from app.rag.guardrail import GuardrailService
from app.rag.llm import LLMWrapper
from app.rag.metrics import ErrorType, RAGMetrics
from app.rag.normalizer import UnifiedNormalizer
from app.rag.prompts import (
    get_master_analyzer_prompt,
    get_rewrite_question_prompt,
)
from app.rag.query_expander import QueryExpander
from app.rag.retriever import Retriever
from app.rag.types import MasterAnalysis

logger = logging.getLogger(__name__)


class RAGOrchestrator:
    def __init__(
        self, retriever: Optional[Retriever] = None, llm_wrapper: Optional[LLMWrapper] = None
    ):
        self.retriever = retriever or Retriever()
        self.llm = llm_wrapper or LLMWrapper()
        self.guardrail = GuardrailService(self.llm)
        self.normalizer = UnifiedNormalizer(self.llm)
        self.query_expander = QueryExpander(self.llm)

    async def query(
        self,
        question: str,
        top_k: int = 5,
        history: Optional[List[Dict]] = None,
        language: Optional[str] = None,
    ) -> Dict:
        # Initialize metrics tracking
        request_id = str(uuid.uuid4())[:8]
        metrics = RAGMetrics(request_id=request_id, question=question)

        t0 = time.time()
        raw_q = (question or "").strip()

        logger.info(
            f"[{request_id}] Query Start: '{raw_q[:100]}' | History: {len(history) if history else 0}"
        )

        if not raw_q:
            metrics.error_type = ErrorType.UNKNOWN
            metrics.error_message = "Empty question"
            metrics.finalize()
            logger.warning(f"{metrics}")
            return self._response("Please input a valid question.", [], 0, t0, True, metrics)

        final_search_query = raw_q

        # Contextualization stage
        if history and self._should_contextualize(raw_q, history):
            try:
                metrics.start_stage("contextualize")
                history_subset = history[-2:]
                history_text = "\n".join(
                    f"{h.get('role','user')}: {h.get('text','')}" for h in history_subset
                )

                rewrite_system = get_rewrite_question_prompt()
                rewrite_input = f"Chat History:\n{history_text}\n\nFollow-up Question: {raw_q}"

                rewrite_result = await self.llm.invoke_json(rewrite_system, rewrite_input)

                if isinstance(rewrite_result, dict):
                    standalone = (rewrite_result.get("standalone_question") or "").strip()
                    if standalone:
                        final_search_query = standalone

                if final_search_query != raw_q:
                    logger.info(
                        f"[{request_id}] Contextualized: '{raw_q}' -> '{final_search_query}'"
                    )
            except Exception as e:
                logger.error(f"[{request_id}] Contextualization error: {e}")
                final_search_query = raw_q

        # Normalization stage
        metrics.start_stage("normalize")
        try:
            norm_result = await self.normalizer.understand(final_search_query)
            detected_lang = norm_result["language"]
            refined_q = norm_result["normalized_text"]
            metrics.normalization_ms = metrics.end_stage("normalize")
            metrics.language = detected_lang

            logger.info(f"[{request_id}] Normalized: '{refined_q}' | Lang: {detected_lang}")
        except Exception as e:
            metrics.normalization_ms = metrics.end_stage("normalize")
            metrics.error_type = ErrorType.NORMALIZATION_FAILED
            metrics.error_message = str(e)
            logger.error(f"[{request_id}] Normalization failed: {e}")
            refined_q = final_search_query
            detected_lang = "en"
            metrics.language = detected_lang

        if detected_lang in ["vi", "en"]:
            target_lang = detected_lang
        else:
            target_lang = language or "en"

        # Master analysis stage
        metrics.start_stage("analyze")
        try:
            analysis_dict = await self.llm.invoke_json(get_master_analyzer_prompt(), refined_q)
            if isinstance(analysis_dict, dict):
                analysis = MasterAnalysis(**analysis_dict)
            else:
                analysis = MasterAnalysis(status="valid", sub_questions=[refined_q])
            metrics.analysis_ms = metrics.end_stage("analyze")
        except Exception as e:
            metrics.analysis_ms = metrics.end_stage("analyze")
            metrics.error_type = ErrorType.ANALYSIS_FAILED
            logger.warning(f"[{request_id}] Master Analysis Failed: {e}. Using fallback.")
            analysis = MasterAnalysis(status="valid", sub_questions=[refined_q])

        logger.info(
            f"[{request_id}] Analysis: {analysis.status} | Sub-questions: {len(analysis.sub_questions or [])}"
        )

        if analysis.status == "blocked":
            msg = self._get_blocked_msg(analysis.reason, target_lang)
            metrics.finalize()
            logger.info(f"{metrics}")
            return self._response(msg, [], 1.0, t0, False, metrics)

        if analysis.status == "greeting":
            msg = self._get_greeting_msg(target_lang)
            metrics.finalize()
            logger.info(f"{metrics}")
            return self._response(msg, [], 1.0, t0, False, metrics)

        # Retrieval stage with query expansion
        sub_qs = analysis.sub_questions or [refined_q]
        sub_qs = sub_qs[:3]

        # Expand queries for better coverage (especially for short queries)
        expanded_queries = []
        for sq in sub_qs:
            expansions = self.query_expander.expand_query(sq, max_expansions=2)
            expanded_queries.extend(expansions)
            logger.debug(f"[{request_id}] Query '{sq}' expanded to: {expansions}")

        # Deduplicate
        seen = set()
        unique_queries = []
        for q in expanded_queries:
            q_lower = q.lower().strip()
            if q_lower not in seen:
                seen.add(q_lower)
                unique_queries.append(q)

        metrics.num_sub_queries = len(unique_queries)

        metrics.start_stage("retrieve")
        all_docs = []
        for sq in unique_queries:
            try:
                # Use higher top_k for expanded queries to ensure coverage
                docs = self.retriever.retrieve(sq, top_k=5)
                all_docs.extend(docs)
            except Exception as e:
                logger.error(f"[{request_id}] Retrieval error for '{sq}': {e}")
                metrics.error_type = ErrorType.RETRIEVAL_FAILED
                metrics.error_message = str(e)

        metrics.retrieval_ms = metrics.end_stage("retrieve")
        unique_docs = self._deduplicate(all_docs)
        metrics.num_contexts = len(unique_docs)
        metrics.num_unique_docs = len(
            set(d.get("document_id") for d in unique_docs if d.get("document_id"))
        )

        logger.info(
            f"[{request_id}] Retrieved {metrics.num_contexts} contexts from {metrics.num_unique_docs} docs"
        )

        if not unique_docs:
            fb = (
                "Tôi không tìm thấy thông tin phù hợp trong tài liệu."
                if target_lang == "vi"
                else "I could not find information in the documents."
            )
            metrics.error_type = ErrorType.RETRIEVAL_EMPTY
            metrics.fallback_triggered = True
            metrics.finalize()
            logger.warning(f"{metrics}")
            return self._response(fb, [], 0, t0, True, metrics)

        # Generation stage
        metrics.start_stage("generate")
        try:
            logger.info(f"[{request_id}] Generating answer in '{target_lang}'...")
            ans = await self.llm.generate_answer_async(
                refined_q, unique_docs, target_language=target_lang
            )
            metrics.generation_ms = metrics.end_stage("generate")

            # Calculate confidence with num_sub_queries context
            conf = self.retriever.calculate_confidence(
                unique_docs, num_sub_queries=metrics.num_sub_queries
            )
            metrics.confidence = conf

            metrics.finalize()
            logger.info(f"{metrics}")
            return self._response(ans, self._fmt_sources(unique_docs), conf, t0, False, metrics)

        except google_exceptions.ResourceExhausted as e:
            metrics.generation_ms = metrics.end_stage("generate")
            metrics.error_type = ErrorType.LLM_QUOTA
            metrics.error_message = "API quota exceeded"
            metrics.fallback_triggered = True
            metrics.finalize()

            logger.error(f"{metrics}")
            logger.error(f"[{request_id}] Gemini API quota exceeded: {e}")

            fallback_msg = (
                "Hệ thống đang quá tải. Vui lòng thử lại sau vài phút."
                if target_lang == "vi"
                else "The system is currently overloaded. Please try again in a few minutes."
            )
            return self._response(fallback_msg, [], 0, t0, True, metrics)

        except Exception as e:
            metrics.generation_ms = metrics.end_stage("generate")
            metrics.error_type = ErrorType.UNKNOWN
            metrics.error_message = str(e)
            metrics.fallback_triggered = True
            metrics.finalize()

            logger.error(f"{metrics}")
            logger.exception(f"[{request_id}] Error during answer generation")

            error_msg = (
                "Đã xảy ra lỗi hệ thống. Vui lòng thử lại."
                if target_lang == "vi"
                else "A system error occurred. Please try again."
            )
            return self._response(error_msg, [], 0, t0, True, metrics)

    def _should_contextualize(self, question: str, history: Optional[List[Dict]]) -> bool:
        """
        Detect follow-up questions using natural-language heuristics.
        No prefix lists. Clean & minimal.
        """
        if not history:
            return False

        q = (question or "").strip().lower()
        if not q:
            return False

        words = q.split()

        if len(words) <= 3:
            return True

        interrogatives = [
            "là",
            "làm",
            "bao",
            "bao nhiêu",
            "mấy",
            "gì",
            "như thế nào",
            "sao",
            "vì sao",
            "ở đâu",
            "khi nào",
        ]
        if not any(token in q for token in interrogatives):
            return True

        if "?" not in q:
            return True

        return False

    def _response(self, ans, srcs, conf, t0, fb, metrics: Optional[RAGMetrics] = None):
        response = {
            "answer": ans,
            "sources": srcs,
            "confidence": conf,
            "fallback_triggered": fb,
            "latency_ms": int((time.time() - t0) * 1000),
        }

        # Include metrics for debugging/monitoring if available
        if metrics:
            response["request_id"] = metrics.request_id
            response["metrics"] = {
                "num_sub_queries": metrics.num_sub_queries,
                "num_contexts": metrics.num_contexts,
                "num_unique_docs": metrics.num_unique_docs,
                "language": metrics.language,
            }

        return response

    def _deduplicate(self, docs):
        """
        Deduplicate documents while preserving diversity.
        Keeps best score for each unique chunk.
        """
        seen = {}
        for d in docs:
            chunk_id = d.get("chunk_id")
            if chunk_id:
                # If we've seen this chunk, keep the one with higher score
                if chunk_id in seen:
                    if d.get("score", 0) > seen[chunk_id].get("score", 0):
                        seen[chunk_id] = d
                else:
                    seen[chunk_id] = d
            else:
                # No chunk_id, use text preview as fallback
                text_key = d.get("text", "")[:100]
                if text_key not in seen:
                    seen[text_key] = d

        # Sort by score (highest first) and return
        result = list(seen.values())
        result.sort(key=lambda x: x.get("score", 0), reverse=True)
        return result

    def _fmt_sources(self, docs):
        return [
            {"source": d.get("source"), "page": d.get("page"), "score": d.get("score")}
            for d in docs
        ]

    def _get_blocked_msg(self, reason, lang):
        msgs = {
            "vi": {
                "toxic": "Vui lòng sử dụng ngôn ngữ lịch sự.",
                "competitor": "Tôi chỉ hỗ trợ thông tin về Đại học Greenwich Việt Nam.",
                "irrelevant": "Câu hỏi nằm ngoài phạm vi hỗ trợ.",
                "wrong_language": "Xin lỗi, tôi chỉ hỗ trợ Tiếng Việt và Tiếng Anh.",
            },
            "en": {
                "toxic": "Please use polite language.",
                "competitor": "I only support inquiries related to Greenwich University Vietnam.",
                "irrelevant": "This question is outside my scope.",
                "wrong_language": "Sorry, I only support Vietnamese and English.",
            },
        }
        return msgs.get(lang, msgs["en"]).get(reason, msgs[lang]["irrelevant"])

    def _get_greeting_msg(self, lang):
        return (
            "Xin chào! Tôi là trợ lý ảo Greenwich. Tôi có thể giúp gì cho bạn?"
            if lang == "vi"
            else "Hello! I am the Greenwich AI Assistant. How can I help you?"
        )
