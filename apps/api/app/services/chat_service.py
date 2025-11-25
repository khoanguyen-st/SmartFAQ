"""Chat use-case service layer."""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants.chat import ASSISTANT_ROLE, FEEDBACK_MESSAGES, USER_ROLE
from app.core.config import settings
from app.core.mongo import get_chat_messages_collection, get_chat_sessions_collection
from app.models.chat import ChatSession
from app.rag.orchestrator import RAGOrchestrator
from app.repositories.chat_messages_repo import (
    find_history,
    find_message,
    insert_messages,
    update_message,
)
from app.repositories.chat_sessions_repo import add_session, get_session, update_session_timestamp
from app.schemas.chat import (
    ChatConfidenceResponse,
    ChatHistoryMessage,
    ChatHistoryResponse,
    ChatQuery,
    ChatQueryResponse,
    ChatSourcesResponse,
    FeedbackRequest,
    FeedbackResponse,
    NewSessionRequest,
    NewSessionResponse,
)
from app.utils.chat_input_utils import coerce_channel, coerce_language
from app.utils.chat_response_utils import (
    confidence_to_percent,
    format_sources,
    persistable_sources,
    safe_int,
    timestamp_to_iso,
)

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

    @staticmethod
    def _now() -> datetime:
        return datetime.now(timezone.utc)

    async def create_session(
        self, payload: NewSessionRequest, user_agent: str | None
    ) -> NewSessionResponse:
        session_id = str(uuid4())
        input_language = (payload.language or "").strip() or "en"
        language = coerce_language(input_language, payload.language or "")
        channel = coerce_channel(payload.channel)
        ua = user_agent
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
        if not payload.session_id:
            raise ChatServiceError(400, "sessionId is required. Call /chat/new-session first.")

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

        session.language = coerce_language(getattr(payload, "language", None), payload.question)
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
            rag_response = await self.orchestrator.query(
                question=payload.question,
                user_id=session.id,
                top_k=5,
                where=None,
                return_top_sources=5,
                response_language=session.language,
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
        fallback_triggered = bool(rag_response.get("fallback_triggered", False))
        sources: list[dict[str, Any]] = rag_response.get("sources", []) or []
        query_log = {
            "model": settings.LLM_MODEL,
            "latencyMs": safe_int(rag_response.get("latency_ms")) or latency_ms,
            "responseMs": safe_int(rag_response.get("response_ms")) or latency_ms,
            "tokensIn": safe_int(rag_response.get("tokens_in")),
            "tokensOut": safe_int(rag_response.get("tokens_out")),
            "fallback": fallback_triggered,
        }

        question_id = str(uuid4())
        response_id = str(uuid4())
        message_time = self._now()

        question_doc = {
            "_id": question_id,
            "sessionId": session.id,
            "role": USER_ROLE,
            "text": payload.question,
            "createdAt": message_time,
        }
        response_doc = {
            "_id": response_id,
            "sessionId": session.id,
            "role": ASSISTANT_ROLE,
            "text": answer,
            "confidence": float(confidence_raw) if confidence_raw is not None else None,
            "sources": persistable_sources(sources),
            "queryLog": query_log,
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
            sources=format_sources(sources),  # type: ignore[arg-type]
            confidence=confidence_to_percent(confidence_raw),
            language=session.language,
            fallback=fallback_triggered,
            chat_id=response_id,
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

        records.reverse()

        messages: list[ChatHistoryMessage] = []
        for message in records:
            timestamp = timestamp_to_iso(message.get("createdAt"))
            confidence_raw = message.get("confidence")
            confidence = (
                confidence_to_percent(confidence_raw) if confidence_raw is not None else None
            )
            fallback_flag = None
            if message.get("role") == ASSISTANT_ROLE:
                fallback_flag = message.get("fallback")
                if fallback_flag is None:
                    fallback_flag = message.get("queryLog", {}).get("fallback")
            entry = ChatHistoryMessage(
                role=message.get("role"),
                text=message.get("text"),
                timestamp=timestamp,
                chat_id=message.get("_id") if message.get("role") == ASSISTANT_ROLE else None,
                confidence=confidence,
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
        if payload.comment:
            update_doc["feedbackComment"] = payload.comment

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
        if not message or message.get("role") != ASSISTANT_ROLE:
            raise ChatServiceError(404, "Chat response not found.")
        return ChatSourcesResponse(chat_id=chat_id, sources=format_sources(message.get("sources")))

    async def get_confidence(self, chat_id: str) -> ChatConfidenceResponse:
        try:
            message = await find_message(self.messages_coll, {"_id": chat_id})
        except Exception as exc:
            logger.exception("Failed to fetch confidence for chat %s", chat_id)
            raise ChatServiceError(500, "Failed to load confidence.") from exc
        if not message or message.get("role") != ASSISTANT_ROLE:
            raise ChatServiceError(404, "Chat response not found.")

        fallback_flag = message.get("fallback")
        if fallback_flag is None:
            fallback_flag = message.get("queryLog", {}).get("fallback")

        return ChatConfidenceResponse(
            chat_id=chat_id,
            confidence=confidence_to_percent(message.get("confidence")),
            threshold=confidence_to_percent(settings.CONFIDENCE_THRESHOLD),
            fallback_triggered=bool(fallback_flag),
        )


__all__ = ["ChatService", "ChatServiceError"]
