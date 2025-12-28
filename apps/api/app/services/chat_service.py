from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Any, cast
from uuid import uuid4

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from ..constants.chat import FEEDBACK_MESSAGES
from ..core.config import settings
from ..core.input_validation import UnsafeInputError, ensure_safe_text
from ..core.mongo import get_chat_messages_collection, get_chat_sessions_collection
from ..models.chat import Channel, ChatRole, ChatSession
from ..rag.guardrail import REFUSAL_MESSAGES
from ..rag.language import detect_language
from ..rag.orchestrator import RAGOrchestrator
from ..repositories.chat_messages_repo import (
    find_history,
    find_message,
    insert_messages,
    update_message,
)
from ..repositories.chat_sessions_repo import add_session, get_session, update_session_timestamp
from ..schemas.chat import (
    ChatConfidenceResponse,
    ChatHistoryMessage,
    ChatHistoryResponse,
    ChatQuery,
    ChatQueryResponse,
    ChatSourcesResponse,
    FAQItem,
    FAQsResponse,
    FeedbackRequest,
    FeedbackResponse,
    NewSessionRequest,
    NewSessionResponse,
)
from ..utils.chat_input_utils import coerce_channel
from ..utils.chat_response_utils import (
    confidence_to_percent,
    format_sources,
    persistable_sources,
    safe_int,
)
from .faq_service import FAQService

logger = logging.getLogger(__name__)


class ChatServiceError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class ChatService:
    def __init__(self, db: AsyncSession, orchestrator: RAGOrchestrator):
        self.db = db
        self.orchestrator = orchestrator
        self.sessions_coll = get_chat_sessions_collection()
        self.messages_coll = get_chat_messages_collection()

        # Initialize FAQ Service with semantic grouping and question refinement
        self.faq_service = FAQService(
            self.messages_coll,
            use_semantic_grouping=True,  # Enable semantic similarity
            similarity_threshold=0.85,  # 85% similarity threshold
            refine_questions=True,  # Enable LLM-based question refinement
        )

    @staticmethod
    def _now() -> datetime:
        return datetime.now(timezone.utc)

    async def create_session(
        self, payload: NewSessionRequest, user_agent: str | None
    ) -> NewSessionResponse:
        session_id = str(uuid4())
        input_language = (payload.language or "").strip() or "en"
        language = detect_language(input_language)
        channel = coerce_channel(payload.channel)
        ua = (user_agent or "").strip() or "unknown"
        now = self._now()

        session = ChatSession(
            id=session_id,
            language=language,
            channel=channel,
            user_agent=ua,
            created_at=now,
            updated_at=now,
        )

        mongo_payload = {
            "_id": session_id,
            "language": language,
            "channel": channel,
            "user_agent": ua,
            "createdAt": now,
            "updatedAt": now,
        }

        mongo_inserted = False

        try:
            await self.sessions_coll.insert_one(mongo_payload)
            mongo_inserted = True
            await add_session(self.db, session)
            await self.db.commit()
        except Exception as exc:
            await self.db.rollback()
            if mongo_inserted:
                try:
                    await self.sessions_coll.delete_one({"_id": session_id})
                except Exception:
                    logger.exception("Failed to roll back Mongo chat session %s", session_id)
            logger.exception("Failed to create chat session", exc_info=exc)
            raise ChatServiceError(500, "Unable to create chat session.") from exc

        return NewSessionResponse(sessionId=session_id, message="New chat session started.")

    async def query_chat(self, payload: ChatQuery) -> ChatQueryResponse:
        # 1. Check for unsafe input (XSS/Injection)
        try:
            ensure_safe_text(payload.question)
        except UnsafeInputError:
            logger.warning(f"Unsafe input detected: {payload.question}")
            lang = payload.language or "vi"
            msg = REFUSAL_MESSAGES.get("toxic", {}).get(lang, "Vui lòng sử dụng ngôn ngữ lịch sự.")

            return ChatQueryResponse(
                answer=msg,
                sources=[],
                confidence=0,
                relevance=0,
                language=lang,
                fallback=True,
                chatId=str(uuid4()),
            )

        if not payload.session_id:
            raise ChatServiceError(400, "sessionId is required. Call /chat/new-session first.")

        # Check if Google API key is configured when using Gemini model
        current_model = settings.LLM_MODEL.lower()
        if "gemini" in current_model:
            if not settings.GOOGLE_API_KEY or settings.GOOGLE_API_KEY.strip() == "":
                raise ChatServiceError(
                    503,
                    "The Google API key is not configured. Please contact your administrator to update the API key in your system settings.",
                )

        session = await get_session(self.db, payload.session_id)
        if not session:
            raise ChatServiceError(404, "Session not found.")
        session.channel = coerce_channel(getattr(session, "channel", None))

        mongo_session = await self.sessions_coll.find_one({"_id": session.id})
        if mongo_session is None:
            raise ChatServiceError(404, "Session not found.")
        mongo_channel_raw = mongo_session.get("channel")
        mongo_channel = coerce_channel(mongo_channel_raw)
        if mongo_channel_raw and mongo_channel != session.channel:
            session.channel = mongo_channel

        # Auto-detect language from question if not explicitly provided
        detected_lang = detect_language(payload.question) if payload.question else "en"
        session.language = payload.language or detected_lang or session.language or "en"
        now = self._now()
        updates: dict[str, Any] = {"language": session.language, "updatedAt": now}
        if mongo_channel_raw != session.channel:
            updates["channel"] = session.channel

        try:
            await self.sessions_coll.update_one({"_id": session.id}, {"$set": updates})
        except Exception as exc:
            logger.exception("Failed to update Mongo chat session %s", session.id)
            raise ChatServiceError(500, "Failed to update chat session.") from exc

        try:
            t0 = time.perf_counter()
            # Use configurable history limit for context window management
            history_response = await self.get_history(session.id, limit=settings.CHAT_HISTORY_LIMIT)
            history = [{"role": msg.role, "text": msg.text} for msg in history_response.messages]
            # Enable citations only for STAFF/ADMIN channel
            include_citations = (
                session.channel == Channel.CHATSTAFF or session.channel == Channel.MANAGEMENT
            )

            rag_response = await self.orchestrator.query(
                question=payload.question,
                top_k=settings.TOP_K_RETRIEVAL,
                history=history,
                language=session.language,
                include_citations=include_citations,
            )
            latency_ms = int((time.perf_counter() - t0) * 1000)
        except Exception as exc:
            internal_id = str(uuid4())
            logger.exception("RAGOrchestrator.query failed [%s]", internal_id)
            raise ChatServiceError(
                500, f"Failed to generate answer. reference={internal_id}"
            ) from exc

        if not isinstance(rag_response, dict):
            internal_id = str(uuid4())
            logger.error("Invalid RAG response shape [%s]: %s", internal_id, str(rag_response))
            raise ChatServiceError(
                502, f"Invalid answer structure from RAG. reference={internal_id}"
            )

        answer = rag_response.get("answer", "")
        confidence_raw = rag_response.get("confidence", 0.0)
        relevance_raw = rag_response.get("relevance", 0.0)  # Get relevance (retrieval quality)
        fallback_triggered = bool(rag_response.get("fallback_triggered", False))
        sources: list[dict[str, Any]] = rag_response.get("sources", []) or []
        query_log = {
            "model": settings.LLM_MODEL,
            "latencyMs": safe_int(rag_response.get("latency_ms")) or latency_ms,
            "responseMs": safe_int(rag_response.get("response_ms")) or latency_ms,
            "tokensIn": safe_int(rag_response.get("tokens_in")),
            "tokensOut": safe_int(rag_response.get("tokens_out")),
            "fallback": fallback_triggered,
            "lang": session.language,
            "channel": session.channel,
            "userAgent": session.user_agent,
        }

        question_id = str(uuid4())
        response_id = str(uuid4())
        message_time = self._now()

        question_doc = {
            "_id": question_id,
            "sessionId": session.id,
            "role": ChatRole.USER.value,
            "text": payload.question,
            "createdAt": message_time,
        }
        response_doc = {
            "_id": response_id,
            "sessionId": session.id,
            "role": ChatRole.ASSISTANT.value,
            "text": answer,
            "confidence": float(confidence_raw) if confidence_raw is not None else None,
            "relevance": float(relevance_raw) if relevance_raw is not None else None,
            "sources": persistable_sources(sources),
            "queryLog": query_log,
            "fallback": fallback_triggered,
            "feedback": None,
            "createdAt": message_time,
        }

        try:
            await insert_messages(self.messages_coll, [question_doc, response_doc])
        except Exception as exc:
            logger.exception("Failed to persist chat data for session %s", session.id)
            raise ChatServiceError(500, "Failed to persist chat data.") from exc

        session.updated_at = message_time

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self.db.rollback()
            logger.exception("Failed to persist chat session updates for %s", session.id)
            raise ChatServiceError(500, "Failed to persist chat data.") from exc

        return ChatQueryResponse(
            answer=answer,
            sources=format_sources(cast(list[dict[str, Any]], sources)),
            confidence=confidence_to_percent(confidence_raw),
            relevance=confidence_to_percent(relevance_raw),
            language=session.language,
            fallback=fallback_triggered,
            chatId=response_id,
        )

    async def get_history(self, session_id: str, limit: int) -> ChatHistoryResponse:
        session = await get_session(self.db, session_id)
        if not session:
            raise ChatServiceError(404, "Session not found.")

        try:
            records = await find_history(self.messages_coll, session_id, limit)
        except Exception as exc:
            logger.exception("Failed to fetch chat history for session %s", session_id)
            raise ChatServiceError(500, "Failed to fetch chat history.") from exc

        messages: list[ChatHistoryMessage] = []
        for message in records:
            created_at = message.get("createdAt") or self._now()
            if isinstance(created_at, datetime) and created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            confidence_raw = message.get("confidence")
            confidence = (
                confidence_to_percent(confidence_raw) if confidence_raw is not None else None
            )
            relevance_raw = message.get("relevance")
            relevance = confidence_to_percent(relevance_raw) if relevance_raw is not None else None
            fallback_flag = None
            if message.get("role") == ChatRole.ASSISTANT.value:
                fallback_flag = message.get("fallback")
                if fallback_flag is None:
                    fallback_flag = message.get("queryLog", {}).get("fallback")
            entry = ChatHistoryMessage(
                role=str(message.get("role") or ""),
                text=str(message.get("text") or ""),
                timestamp=created_at if isinstance(created_at, datetime) else self._now(),
                chatId=(
                    message.get("_id") if message.get("role") == ChatRole.ASSISTANT.value else None
                ),
                confidence=confidence,
                relevance=relevance,
                fallback=fallback_flag if fallback_flag is not None else None,
            )
            messages.append(entry)

        return ChatHistoryResponse(sessionId=session.id, messages=messages)

    async def submit_feedback(self, payload: FeedbackRequest) -> FeedbackResponse:
        session = await get_session(self.db, payload.session_id)
        if not session:
            raise ChatServiceError(404, "Session not found.")

        message = await find_message(
            self.messages_coll, {"_id": payload.chat_id, "sessionId": payload.session_id}
        )
        if not message:
            raise ChatServiceError(404, "Chat response not found.")

        update_doc: dict[str, Any] = {
            "feedback": payload.feedback,
            "updatedAt": self._now(),
        }
        try:
            await update_message(self.messages_coll, payload.chat_id, update_doc)
        except Exception as exc:
            logger.exception("Failed to record feedback for chat %s", payload.chat_id)
            raise ChatServiceError(500, "Failed to record feedback.") from exc

        update_session_timestamp(session, self._now())

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self.db.rollback()
            logger.exception("Failed to update session timestamp for chat %s", payload.chat_id)
            raise ChatServiceError(500, "Failed to record feedback.") from exc

        session_language = session.language.lower() if session.language else "vi"
        message_key = session_language if session_language in FEEDBACK_MESSAGES else "en"
        return FeedbackResponse(status="success", message=FEEDBACK_MESSAGES[message_key])

    async def get_sources(self, chat_id: str) -> ChatSourcesResponse:
        try:
            message = await find_message(self.messages_coll, {"_id": chat_id})
        except Exception as exc:
            logger.exception("Failed to fetch sources for chat %s", chat_id)
            raise ChatServiceError(500, "Failed to load sources.") from exc
        if not message or message.get("role") != ChatRole.ASSISTANT.value:
            raise ChatServiceError(404, "Chat response not found.")
        return ChatSourcesResponse(
            chatId=chat_id,
            sources=format_sources(cast(list[dict[str, Any]], message.get("sources"))),
        )

    async def get_confidence(self, chat_id: str) -> ChatConfidenceResponse:
        try:
            message = await find_message(self.messages_coll, {"_id": chat_id})
        except Exception as exc:
            logger.exception("Failed to fetch confidence for chat %s", chat_id)
            raise ChatServiceError(500, "Failed to load confidence.") from exc
        if not message or message.get("role") != ChatRole.ASSISTANT.value:
            raise ChatServiceError(404, "Chat response not found.")

        fallback_flag = message.get("fallback")
        if fallback_flag is None:
            fallback_flag = message.get("queryLog", {}).get("fallback")

        return ChatConfidenceResponse(
            chatId=chat_id,
            confidence=confidence_to_percent(message.get("confidence")),
            relevance=confidence_to_percent(message.get("relevance")),
            threshold=confidence_to_percent(settings.CONFIDENCE_THRESHOLD),
            fallbackTriggered=bool(fallback_flag),
        )

    async def get_faqs(
        self,
        language: str = "vi",
        limit: int = 6,
    ) -> FAQsResponse:
        """
        Get FAQ suggestions from actual user queries (dynamic generation).

        Uses semantic similarity grouping to merge similar questions and
        returns the most frequently asked questions from the last 30 days.

        Args:
            language: Language code ('vi' or 'en')
            limit: Number of FAQs to return

        Returns:
            FAQsResponse with dynamically generated FAQ items
        """
        try:
            # Get frequent questions from last 30 days
            faqs = await self.faq_service.get_frequent_questions(
                language=language,
                limit=limit,
                days=30,
                min_frequency=3,
            )

            # Convert to response format
            faq_items = [
                FAQItem(
                    id=faq["id"],
                    question=faq["question"],
                    category=faq["category"],
                    count=faq["count"],
                )
                for faq in faqs
            ]

            return FAQsResponse(language=language, faqs=faq_items)

        except Exception:
            logger.exception("Failed to generate dynamic FAQs")
            # Return empty list if no data available
            return FAQsResponse(language=language, faqs=[])


__all__ = ["ChatService", "ChatServiceError"]
