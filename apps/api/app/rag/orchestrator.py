from __future__ import annotations

import logging
import time
import uuid
from typing import Dict, List, Optional

from google.api_core import exceptions as google_exceptions

from app.constants.chat import MISSING_INFO_PHRASES
from app.constants.departments import get_all_contacts_footer
from app.core.config import settings
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
from app.utils.logging_config import setup_rag_metrics_logger

logger = logging.getLogger(__name__)

rag_metrics_logger = setup_rag_metrics_logger("logs/rag_metrics.json")


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
        include_citations: bool = False,
    ) -> Dict:
        request_id = str(uuid.uuid4())[:8]
        metrics = RAGMetrics(request_id=request_id, question=question)

        t0 = time.time()
        raw_q = (question or "").strip()

        logger.info(
            f"[{request_id}] Query Start: '{raw_q[:100]}' | History: {len(history) if history else 0} | Citations: {include_citations}"
        )

        if not raw_q:
            metrics.error_type = ErrorType.UNKNOWN
            metrics.error_message = "Empty question"
            metrics.finalize()
            return self._response(
                "Please input a valid question.", [], 0, t0, True, metrics, query_fail=True
            )

        # Guardrail check first (includes regex pre-check)
        guardrail_result = await self.guardrail.check_safety(raw_q)
        if guardrail_result.get("status") == "blocked":
            target_lang = language if language in ["vi", "en"] else "vi"
            blocked_msg = guardrail_result.get(target_lang, guardrail_result.get("vi"))
            logger.info(f"[{request_id}] Blocked by guardrail: {guardrail_result}")
            metrics.error_type = ErrorType.BLOCKED_BY_GUARDRAIL
            metrics.finalize()
            return self._response(blocked_msg, [], 1.0, t0, False, metrics, query_fail=True)

        final_search_query = raw_q

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

        target_lang = detected_lang if detected_lang in ["vi", "en"] else (language or "en")

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

        if analysis.status == "blocked":
            msg = self._get_blocked_msg(analysis.reason, target_lang)
            metrics.finalize()
            return self._response(msg, [], 1.0, t0, False, metrics, query_fail=True)

        if analysis.status == "greeting":
            msg = self._get_greeting_msg(target_lang)
            metrics.finalize()
            return self._response(msg, [], 1.0, t0, False, metrics, query_fail=False)

        sub_qs = analysis.sub_questions or [refined_q]
        sub_qs = sub_qs[: settings.MAX_SUB_QUERIES]

        expanded_queries = []
        if settings.QUERY_EXPANSION_ENABLED:
            for sq in sub_qs:
                expansions = self.query_expander.expand_query(
                    sq, max_expansions=settings.QUERY_EXPANSION_MAX
                )
                expanded_queries.extend(expansions)
        else:
            expanded_queries = sub_qs

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
                docs = self.retriever.retrieve(sq, top_k=settings.TOP_K_PER_QUERY)
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

        if unique_docs:
            scores = [d.get("score", 0.0) for d in unique_docs if d.get("score") is not None]
            if scores:
                metrics.avg_retrieval_score = sum(scores) / len(scores)
                metrics.max_retrieval_score = max(scores)
                metrics.min_retrieval_score = min(scores)
                mean = metrics.avg_retrieval_score
                metrics.score_variance = sum((s - mean) ** 2 for s in scores) / len(scores)
            metrics.diversity_score = (
                metrics.num_unique_docs / metrics.num_contexts if metrics.num_contexts > 0 else 0.0
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
            return self._response(
                fb, [], 0, t0, True, metrics, query_fail=True, language=target_lang
            )

        metrics.start_stage("generate")
        try:
            logger.info(f"[{request_id}] Generating answer in '{target_lang}'...")
            ans = await self.llm.generate_answer_async(
                refined_q,
                unique_docs,
                target_language=target_lang,
                include_citations=include_citations,
            )

            # FORCE remove citations if disabled (Double safety net)
            if not include_citations:
                import re

                # Regex to match (Nguồn X - filename) or (Source X - filename) or (Nguồn X)
                # Patterns:
                # (Nguồn \d+.*?)
                # (Source \d+.*?)
                ans = re.sub(r"\((?:Nguồn|Source)\s+\d+.*?\)", "", ans, flags=re.IGNORECASE)
                # Cleanup double spaces (leftover from removal)
                ans = re.sub(r"\s{2,}", " ", ans)

            metrics.generation_ms = metrics.end_stage("generate")

            # Calculate retrieval quality (how good the retrieved documents are)
            retrieval_quality = self.retriever.calculate_retrieval_quality(
                unique_docs, num_sub_queries=metrics.num_sub_queries
            )
            logger.info(f"[{request_id}] Retrieval Quality: {retrieval_quality:.3f}")

            # Evaluate answer confidence (how confident the LLM is about the answer)
            answer_confidence = await self.llm.evaluate_answer_confidence(
                refined_q, ans, unique_docs
            )
            logger.info(f"[{request_id}] Answer Confidence: {answer_confidence:.3f}")

            # Combined confidence: average of both metrics
            final_confidence = (retrieval_quality + answer_confidence) / 2
            metrics.confidence = final_confidence

            logger.info(
                f"[{request_id}] Final Confidence: {final_confidence:.3f} "
                f"(retrieval={retrieval_quality:.3f}, answer={answer_confidence:.3f})"
            )

            # Force fallback footer if answer indicates missing info
            lower_ans = ans.lower()
            missing_info_triggered = any(p in lower_ans for p in MISSING_INFO_PHRASES)

            if final_confidence < settings.CONFIDENCE_THRESHOLD or missing_info_triggered:
                logger.info(
                    f"[{metrics.request_id}] CONF < THRESHOLD ({final_confidence:.3f} < {settings.CONFIDENCE_THRESHOLD}) OR MISSING INFO DETECTED → FALLBACK"
                )
                metrics.fallback_triggered = True

                dept_counts: Dict[int, int] = {}
                for d in unique_docs:
                    dept_id = d.get("department_id")
                    if dept_id is None:
                        continue
                    try:
                        d_id = int(dept_id)
                        dept_counts[d_id] = dept_counts.get(d_id, 0) + 1
                    except (TypeError, ValueError):
                        continue

                # dominant_dept_id: Optional[int] = None
                # if dept_counts:
                #     dominant_dept_id = max(dept_counts.items(), key=lambda x: x[1])[0]

                # Get primary contact info based on dominant department
                # primary_contact = get_department_contact_info(dominant_dept_id, target_lang)

                # Get footer with all contacts
                contacts_footer = get_all_contacts_footer(target_lang)

                if target_lang == "vi":
                    ans = f"{ans}{contacts_footer}"
                else:
                    ans = f"{ans}{contacts_footer}"

            metrics.finalize()
            return self._response(
                ans,
                self._fmt_sources(unique_docs),
                final_confidence,
                t0,
                metrics.fallback_triggered,
                metrics,
                retrieval_quality=retrieval_quality,
                answer_confidence=answer_confidence,
                language=target_lang,
            )

        except google_exceptions.ResourceExhausted as e:
            metrics.generation_ms = metrics.end_stage("generate")
            metrics.error_type = ErrorType.LLM_QUOTA
            metrics.error_message = "API quota exceeded"
            metrics.fallback_triggered = True
            metrics.finalize()
            logger.error(f"[{request_id}] Gemini API quota exceeded: {e}")

            fallback_msg = (
                "Hệ thống đang quá tải. Vui lòng thử lại sau vài phút."
                if target_lang == "vi"
                else "The system is currently overloaded. Please try again in a few minutes."
            )
            contacts_footer = get_all_contacts_footer(target_lang)
            fallback_msg = f"{fallback_msg}{contacts_footer}"
            return self._response(fallback_msg, [], 0, t0, True, metrics)

        except Exception as e:
            metrics.generation_ms = metrics.end_stage("generate")
            metrics.error_type = ErrorType.UNKNOWN
            metrics.error_message = str(e)
            metrics.fallback_triggered = True
            metrics.finalize()
            logger.exception(f"[{request_id}] Error during answer generation")

            error_msg = (
                "Đã xảy ra lỗi hệ thống. Vui lòng thử lại."
                if target_lang == "vi"
                else "A system error occurred. Please try again."
            )
            contacts_footer = get_all_contacts_footer(target_lang)
            error_msg = f"{error_msg}{contacts_footer}"
            return self._response(error_msg, [], 0, t0, True, metrics)

    def _should_contextualize(self, question: str, history: Optional[List[Dict]]) -> bool:
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

    def _response(
        self,
        ans,
        srcs,
        conf,
        t0,
        fb,
        metrics: Optional[RAGMetrics] = None,
        retrieval_quality: Optional[float] = None,
        answer_confidence: Optional[float] = None,
        query_fail: bool = False,
        language: str = "en",
    ):
        response = {
            "answer": ans,
            "sources": srcs,
            "confidence": conf,
            "relevance": retrieval_quality,  # Add relevance (retrieval quality) to response
            "fallback_triggered": fb,
            "latency_ms": int((time.time() - t0) * 1000),
        }

        if metrics:
            response["request_id"] = metrics.request_id
            response["metrics"] = {
                "num_sub_queries": metrics.num_sub_queries,
                "num_contexts": metrics.num_contexts,
                "num_unique_docs": metrics.num_unique_docs,
                "language": metrics.language,
            }

            # Add detailed confidence breakdown if available
            if retrieval_quality is not None and answer_confidence is not None:
                response["metrics"]["retrieval_quality"] = retrieval_quality
                response["metrics"]["answer_confidence"] = answer_confidence

            rag_metrics_logger.info(
                "RAG request completed",
                extra={
                    "request_id": metrics.request_id,
                    "metrics": metrics.to_dict(),
                },
            )

        return response

    def _deduplicate(self, docs):
        seen = {}
        for d in docs:
            chunk_id = d.get("chunk_id")
            if chunk_id:
                if chunk_id in seen:
                    if d.get("score", 0) > seen[chunk_id].get("score", 0):
                        seen[chunk_id] = d
                else:
                    seen[chunk_id] = d
            else:
                text_key = d.get("text", "")[:100]
                if text_key not in seen:
                    seen[text_key] = d

        result = list(seen.values())
        result.sort(key=lambda x: x.get("score", 0), reverse=True)
        return result

    def _fmt_sources(self, docs):
        return [
            {
                "source": d.get(
                    "source"
                ),  # This maps to title in frontend if using ChatQueryResponse? No, Frontend uses ChatSource interface.
                # Wait, backend Pydantic model ChatQueryResponse expects `sources: list[ChatSource]`.
                # Pydantic will try to cast this dict to ChatSource.
                # ChatSource has `title`. `source` key here might need to be `title` to match Pydantic model?
                # Let's check ChatSource again. Yes, `title`.
                # If d.get("source") is the filename, we should map it to "title".
                "title": d.get("source"),
                "chunkId": d.get("chunk_id"),  # Alias chunkId
                "page": d.get("page"),
                "score": d.get("score"),
                "relevance": d.get("score"),
                "content": d.get("text"),  # Populating content
            }
            for d in docs
        ]

    def _get_blocked_msg(self, reason, lang):
        msgs = {
            "vi": {
                "toxic": "Vui lòng sử dụng ngôn ngữ lịch sự.",
                "system_management": "Xin lỗi, tôi không thể truy cập danh sách tài liệu hoặc dữ liệu hệ thống. Tôi chỉ trả lời câu hỏi dựa trên nội dung tài liệu. Để quản lý tài liệu, vui lòng liên hệ bộ phận IT.",
                "competitor": "Tôi chỉ hỗ trợ thông tin về Đại học Greenwich Việt Nam.",
                "irrelevant": "Câu hỏi nằm ngoài phạm vi hỗ trợ.",
                "wrong_language": "Xin lỗi, tôi chỉ hỗ trợ Tiếng Việt và Tiếng Anh.",
            },
            "en": {
                "toxic": "Please use polite language.",
                "system_management": "Sorry, I cannot access document lists or system data. I only answer questions based on document content. For document management, please contact IT department.",
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
