"""Chat endpoints."""

from __future__ import annotations

import asyncio # Thêm thư viện asyncio cho hàm sleep
import time
from datetime import datetime, timezone
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
from ..core.input_validation import UnsafeInputError, ensure_safe_text
from ..core.rate_limiter import RateLimiter
from ..models.chat import ChatMessage, ChatRole, ChatSession
from ..models.query_log import QueryLog
from ..rag.llm import LLMWrapper

router = APIRouter()
llm_wrapper = LLMWrapper()

_FEEDBACK_MESSAGES: dict[str, str] = {
    "en": "Feedback recorded. Thank you!",
    "vi": "Phản hồi của bạn đã được ghi nhận. Cảm ơn bạn!",
}

USER_ROLE = ChatRole.USER.value
ASSISTANT_ROLE = ChatRole.ASSISTANT.value

QUERY_RATE_LIMITER = RateLimiter(
    limit=5,
    window_seconds=30,
    error_detail="Too many chat queries. Please slow down.",
)
READ_RATE_LIMITER = RateLimiter(
    limit=20,
    window_seconds=60,
    error_detail="Too many chat requests. Try again shortly.",
)

# Cấu hình cho logic tái thử LLM
MAX_RETRIES = 3
INITIAL_DELAY_SECONDS = 2


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _confidence_to_percent(value: float | Decimal | None) -> int:
    if value is None:
        return 0
    numeric = float(value)
    if numeric <= 1.0:
        numeric *= 100.0
    return int(round(numeric))


def _format_sources(sources: list[dict[str, Any]] | None) -> list[ChatSource]:
    formatted: list[ChatSource] = []
    for src in sources or []:
        relevance_raw = src.get("score")
        formatted.append(
            ChatSource(
                title=src.get("source") or src.get("document_id") or "Unknown source",
                chunk_id=src.get("chunk_id") or src.get("chunkId"),
                relevance=float(relevance_raw) if relevance_raw is not None else None,
            )
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
        try:
            return ensure_safe_text(stripped, field_name="question", max_length=1024)
        except UnsafeInputError as exc:
            raise ValueError(str(exc)) from exc


class ChatSource(BaseModel):
    title: str
    chunk_id: str | None = Field(default=None, alias="chunkId")
    relevance: float | None = None

    model_config = ConfigDict(populate_by_name=True)


class ChatQueryResponse(BaseModel):
    answer: str
    sources: list[ChatSource]
    confidence: int
    language: str
    fallback: bool
    chat_id: str = Field(alias="chatId")

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

    @field_validator("comment")
    @classmethod
    def _validate_comment(cls, value: str | None) -> str | None:
        if value is None:
            return None
        try:
            return ensure_safe_text(value, field_name="comment", max_length=1000)
        except UnsafeInputError as exc:
            raise ValueError(str(exc)) from exc


class FeedbackResponse(BaseModel):
    status: str
    message: str


class ChatHistoryMessage(BaseModel):
    role: str
    text: str
    timestamp: str
    chat_id: str | None = Field(default=None, alias="chatId")
    confidence: int | None = None
    fallback: bool | None = None

    model_config = ConfigDict(populate_by_name=True)


class ChatHistoryResponse(BaseModel):
    sessionId: str
    messages: list[ChatHistoryMessage]


class ChatSourcesResponse(BaseModel):
    chat_id: str = Field(alias="chatId")
    sources: list[ChatSource]

    model_config = ConfigDict(populate_by_name=True)


class ChatConfidenceResponse(BaseModel):
    chat_id: str = Field(alias="chatId")
    confidence: int
    threshold: int
    fallback_triggered: bool = Field(alias="fallbackTriggered")

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
    await QUERY_RATE_LIMITER(request)
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

    history_stmt = (
        select(ChatMessage)
        .where(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(1)
    )
    history_result = await db.execute(history_stmt)
    history_records = list(history_result.scalars())
    history_records.reverse()
    history_messages = [
        {"role": message.role, "content": message.text} for message in history_records
    ]

    answer = None
    latency_ms = None

    # Logic tái thử (Retry Logic) với Exponential Backoff
    for attempt in range(MAX_RETRIES):
        try:
            t0 = time.perf_counter()
            answer = await llm_wrapper.generate_direct_answer_async(
                payload.question,
                history=history_messages,
            )
            latency_ms = int((time.perf_counter() - t0) * 1000)
            break  # Thành công, thoát khỏi vòng lặp

        except Exception as exc:
            if attempt == MAX_RETRIES - 1:
                # Lần thử cuối cùng thất bại, raise lỗi 500
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to generate answer after multiple retries. The LLM API may be at full capacity.",
                ) from exc

            # Tính toán độ trễ tăng dần
            delay = INITIAL_DELAY_SECONDS * (2 ** attempt)
            print(f"LLM call failed (Attempt {attempt + 1}/{MAX_RETRIES}). Retrying in {delay} seconds...")
            await asyncio.sleep(delay)

    if answer is None:
        # Lỗi nội bộ nếu answer vẫn là None
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error: Answer generation failed unexpectedly.",
        )

    confidence_raw = 1.0
    fallback_triggered = False
    sources: list[dict[str, Any]] = []

    question_message = ChatMessage(
        id=str(uuid4()),
        session_id=session.id,
        role=USER_ROLE,
        text=payload.question,
        created_at=_now(),
    )
    response_message = ChatMessage(
        id=str(uuid4()),
        session_id=session.id,
        role=ASSISTANT_ROLE,
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
        chat_id=response_message.id,
    )


@router.get("/history", response_model=ChatHistoryResponse)
async def get_history(
    request: Request,
    session_id: str = Query(..., alias="sessionId"),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> ChatHistoryResponse:
    await READ_RATE_LIMITER(request)
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

    messages: list[ChatHistoryMessage] = []
    for message in records:
        timestamp = message.created_at.replace(tzinfo=None).isoformat(timespec="seconds") + "Z"
        confidence = _confidence_to_percent(message.confidence) if message.confidence is not None else None
        fallback = message.fallback if message.role == ASSISTANT_ROLE else None
        entry = ChatHistoryMessage(
            role=message.role,
            text=message.text,
            timestamp=timestamp,
            chat_id=message.id if message.role == ASSISTANT_ROLE else None,
            confidence=confidence,
            fallback=fallback,
        )
        messages.append(entry)

    return ChatHistoryResponse(sessionId=session.id, messages=messages)

@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    payload: FeedbackRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> FeedbackResponse:
    await READ_RATE_LIMITER(request)
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

    session_language = "vi"
    session = await db.get(ChatSession, message.session_id)
    if session and session.language:
        session_language = session.language.lower()

    try:
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record feedback.",
        ) from exc

    message_key = session_language if session_language in _FEEDBACK_MESSAGES else "en"
    return FeedbackResponse(status="success", message=_FEEDBACK_MESSAGES[message_key])


@router.get("/sources/{chat_id}", response_model=ChatSourcesResponse)
async def get_sources(
    chat_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ChatSourcesResponse:
    await READ_RATE_LIMITER(request)
    message = await db.get(ChatMessage, chat_id)
    if not message or message.role != ASSISTANT_ROLE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat response not found.",
        )
    return ChatSourcesResponse(chat_id=chat_id, sources=_format_sources(message.sources))


@router.get("/confidence/{chat_id}", response_model=ChatConfidenceResponse)
async def get_confidence(
    chat_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ChatConfidenceResponse:
    await READ_RATE_LIMITER(request)
    message = await db.get(ChatMessage, chat_id)
    if not message or message.role != ASSISTANT_ROLE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat response not found.",
        )

    return ChatConfidenceResponse(
        chat_id=chat_id,
        confidence=_confidence_to_percent(message.confidence),
        threshold=_confidence_to_percent(settings.CONFIDENCE_THRESHOLD),
        fallback_triggered=message.fallback,
    )
