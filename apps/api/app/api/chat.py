"""Chat endpoints."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.database import get_db
from ..models.chat import ChatMessage, ChatSession
from ..models.query_log import QueryLog
from ..rag.orchestrator import RAGOrchestrator

router = APIRouter()
orchestrator = RAGOrchestrator()


def _now() -> datetime:
    return datetime.utcnow()


def _confidence_to_percent(value: float | Decimal | None) -> int:
    if value is None:
        return 0
    numeric = float(value)
    if numeric <= 1.0:
        numeric *= 100.0
    return int(round(numeric))


def _format_sources(sources: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    formatted: list[dict[str, Any]] = []
    for src in sources or []:
        formatted.append(
            {
                "title": src.get("source") or src.get("document_id") or "Unknown source",
                "chunkId": src.get("chunk_id"),
                "relevance": src.get("score"),
            }
        )
    return formatted


class ChatQuery(BaseModel):
    question: str = Field(..., min_length=1, max_length=1024)
    language: str | None = Field(default=None, max_length=10)
    session_id: str | None = Field(default=None, alias="sessionId")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("question")
    @classmethod
    def _validate_question(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("question must not be empty")
        return stripped


class ChatQueryResponse(BaseModel):
    answer: str
    sources: list[dict[str, Any]]
    confidence: int
    language: str
    fallback: bool
    chatId: str

    model_config = ConfigDict(populate_by_name=True)


class NewSessionRequest(BaseModel):
    user_agent: str | None = Field(default=None, alias="userAgent", max_length=255)
    language: str | None = Field(default=None, max_length=10)

    model_config = ConfigDict(populate_by_name=True)


class NewSessionResponse(BaseModel):
    sessionId: str
    message: str


class FeedbackRequest(BaseModel):
    chat_id: str = Field(..., alias="chatId")
    session_id: str = Field(..., alias="sessionId")
    feedback: Literal["up", "down"]
    comment: str | None = None

    model_config = ConfigDict(populate_by_name=True)


@router.post("/new-session", response_model=NewSessionResponse)
async def create_session(
    payload: NewSessionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> NewSessionResponse:
    session_id = str(uuid4())
    language = (payload.language or "en").strip() or "en"
    user_agent = payload.user_agent or request.headers.get("user-agent")

    session = ChatSession(id=session_id, language=language, user_agent=user_agent)
    db.add(session)

    try:
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create chat session.",
        ) from exc

    return NewSessionResponse(sessionId=session_id, message="New chat session started.")

@router.post("/query", response_model=ChatQueryResponse)
async def query_chat(
    payload: ChatQuery,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ChatQueryResponse:
    if not payload.session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="sessionId is required. Call /chat/new-session first.",
        )

    session = await db.get(ChatSession, payload.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    if payload.language:
        stripped_lang = payload.language.strip()
        if stripped_lang:
            session.language = stripped_lang
    if not session.user_agent:
        session.user_agent = request.headers.get("user-agent")

    try:
        rag_response = await orchestrator.query(
            question=payload.question,
            top_k=settings.TOP_K_RETRIEVAL,
            return_top_sources=3,
        )
    except Exception as exc:  # noqa: BLE001 - surface orchestrator errors cleanly
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate answer.",
        ) from exc

    answer = str(rag_response.get("answer") or "")
    fallback_triggered = bool(rag_response.get("fallback_triggered"))
    confidence_raw = rag_response.get("confidence")
    sources = rag_response.get("sources") or []
    latency_ms = rag_response.get("latency_ms")

    question_message = ChatMessage(
        id=str(uuid4()),
        session_id=session.id,
        role="user",
        text=payload.question,
        created_at=_now(),
    )
    response_message = ChatMessage(
        id=str(uuid4()),
        session_id=session.id,
        role="assistant",
        text=answer,
        confidence=float(confidence_raw) if confidence_raw is not None else None,
        fallback=fallback_triggered,
        latency_ms=int(latency_ms) if latency_ms is not None else None,
        sources=sources,
        created_at=_now(),
    )

    query_log = QueryLog(
        question=payload.question,
        lang=session.language,
        response_ms=int(latency_ms) if latency_ms is not None else None,
        confidence=round(float(confidence_raw) * 100, 2) if confidence_raw is not None else None,
        fallback=fallback_triggered,
        user_agent=session.user_agent,
        channel="chat",
    )

    db.add_all([question_message, response_message, query_log])

    try:
        await db.flush()
        response_message.query_log_id = query_log.id
        session.updated_at = _now()
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to persist chat data.",
        ) from exc

    return ChatQueryResponse(
        answer=answer,
        sources=_format_sources(sources),
        confidence=_confidence_to_percent(confidence_raw),
        language=session.language,
        fallback=fallback_triggered,
        chatId=response_message.id,
    )


@router.get("/history")
async def get_history(
    session_id: str = Query(..., alias="sessionId"),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    session = await db.get(ChatSession, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    stmt = (
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    records = list(result.scalars())
    records.reverse()

    messages: list[dict[str, Any]] = []
    for message in records:
        timestamp = message.created_at.replace(tzinfo=None).isoformat(timespec="seconds") + "Z"
        entry: dict[str, Any] = {
            "role": message.role,
            "text": message.text,
            "timestamp": timestamp,
        }
        if message.role == "assistant":
            entry["chatId"] = message.id
        if message.confidence is not None:
            entry["confidence"] = _confidence_to_percent(message.confidence)
        if message.role == "assistant":
            entry["fallback"] = message.fallback
        messages.append(entry)

    return {"sessionId": session.id, "messages": messages}


@router.post("/feedback")
async def submit_feedback(
    payload: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    message = await db.get(ChatMessage, payload.chat_id)
    if not message or message.session_id != payload.session_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat response not found.",
        )

    message.feedback = payload.feedback
    message.feedback_comment = payload.comment

    if message.query_log_id:
        log = await db.get(QueryLog, message.query_log_id)
        if log:
            log.feedback = payload.feedback

    try:
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record feedback.",
        ) from exc

    return {"status": "success", "message": "Feedback recorded. Thank you!"}


@router.get("/sources/{chat_id}")
async def get_sources(
    chat_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    message = await db.get(ChatMessage, chat_id)
    if not message or message.role != "assistant":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat response not found.",
        )
    return {"chatId": chat_id, "sources": _format_sources(message.sources)}


@router.get("/confidence/{chat_id}")
async def get_confidence(
    chat_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    message = await db.get(ChatMessage, chat_id)
    if not message or message.role != "assistant":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat response not found.",
        )

    return {
        "chatId": chat_id,
        "confidence": _confidence_to_percent(message.confidence),
        "threshold": _confidence_to_percent(settings.CONFIDENCE_THRESHOLD),
        "fallbackTriggered": message.fallback,
    }
