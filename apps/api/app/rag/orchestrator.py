from __future__ import annotations

import logging
import time
from typing import Dict, List, Optional

from app.rag.guardrail import GuardrailService
from app.rag.language import detect_language_enhanced
from app.rag.llm import LLMWrapper
from app.rag.normalizer import UnifiedNormalizer
from app.rag.prompts import get_master_analyzer_prompt
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

    async def query(
        self,
        question: str,
        top_k: int = 5,
        history: Optional[List[Dict]] = None,
        language: Optional[str] = None,
    ) -> Dict:
        t0 = time.time()
        raw_q = (question or "").strip()

        if not raw_q:
            return self._response("Please input a valid question.", [], 0, t0, True)

        logger.info(f" [Input] Raw: '{raw_q}' | History Len: {len(history) if history else 0}")

        final_search_query = raw_q
        if history and len(history) > 0:
            try:
                history_text = "\n".join(
                    [f"{h.get('role', 'user')}: {h.get('text', '')}" for h in history[-4:]]
                )
                rewrite_system = 'You are a query rewriter. Rewrite the follow-up question into a standalone question based on the history. Keep the language of the follow-up question. Output JSON: {{"standalone_question": "..."}}'
                rewrite_input = f"Chat History:\n{history_text}\n\nFollow-up Question: {raw_q}"

                rewrite_result = await self.llm.invoke_json(rewrite_system, rewrite_input)
                if rewrite_result and "standalone_question" in rewrite_result:
                    final_search_query = rewrite_result["standalone_question"]
                    logger.info(f" [Contextualizer] '{raw_q}' -> '{final_search_query}'")
                else:
                    logger.warning(f" [Contextualizer] Failed to rewrite, keeping raw: '{raw_q}'")
            except Exception as e:
                logger.error(f" [Contextualizer] Error: {e}")

        safety_check = await self.guardrail.check_safety(final_search_query)
        logger.info(
            f" [Guardrail] Checking: '{final_search_query}' -> Status: {safety_check.get('status')}"
        )

        if safety_check["status"] == "blocked":
            temp_lang = language if language else detect_language_enhanced(final_search_query)
            msg = safety_check.get("vi") if temp_lang == "vi" else safety_check.get("en")
            return self._response(msg or "Request rejected.", [], 1.0, t0, False)

        if not language:
            norm_result = await self.normalizer.understand(final_search_query)
            target_lang = norm_result["language"]
            refined_q = norm_result["normalized_text"]
            logger.info(
                f" [Normalizer] '{final_search_query}' -> '{refined_q}' | Lang: '{target_lang}'"
            )
        else:
            target_lang = language
            refined_q = final_search_query

        try:
            analysis_dict = await self.llm.invoke_json(get_master_analyzer_prompt(), refined_q)
            if isinstance(analysis_dict, dict):
                analysis = MasterAnalysis(**analysis_dict)
            else:
                analysis = MasterAnalysis(status="valid", sub_questions=[refined_q])
        except Exception:
            analysis = MasterAnalysis(status="valid", sub_questions=[refined_q])

        if analysis.status == "blocked":
            msg = self._get_blocked_msg(analysis.reason, target_lang)
            return self._response(msg, [], 1.0, t0, False)

        if analysis.status == "greeting":
            msg = self._get_greeting_msg(target_lang)
            return self._response(msg, [], 1.0, t0, False)

        sub_qs = analysis.sub_questions if analysis.sub_questions else [refined_q]
        sub_qs = sub_qs[:3]

        all_docs = []
        for q in sub_qs:
            try:
                docs = self.retriever.retrieve(q, top_k=3)
                all_docs.extend(docs)
            except Exception:
                pass

        unique_docs = self._deduplicate(all_docs)

        if not unique_docs:
            fb = (
                "Tôi không tìm thấy thông tin phù hợp trong tài liệu."
                if target_lang == "vi"
                else "I could not find information in the documents."
            )
            return self._response(fb, [], 0.0, t0, True)

        try:
            ans = await self.llm.generate_answer_async(
                refined_q, unique_docs, target_language=target_lang
            )
            conf = self.retriever.calculate_confidence(unique_docs)
            return self._response(ans, self._fmt_sources(unique_docs), conf, t0, False)
        except Exception:
            return self._response("System Error", [], 0, t0, True)

    def _response(self, ans, srcs, conf, t0, fb):
        return {
            "answer": ans,
            "sources": srcs,
            "confidence": conf,
            "fallback_triggered": fb,
            "latency_ms": int((time.time() - t0) * 1000),
        }

    def _deduplicate(self, docs):
        seen, res = set(), []
        for d in docs:
            k = d.get("chunk_id") or d.get("text_preview", "")[:50]
            if k not in seen:
                seen.add(k)
                res.append(d)
        return res

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
