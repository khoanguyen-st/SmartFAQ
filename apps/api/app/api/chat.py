from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.rate_limiter import RateLimiter
from ..rag.orchestrator import RAGOrchestrator
from ..schemas.chat import (
    ChatConfidenceResponse,
    ChatHistoryResponse,
    ChatQuery,
    ChatQueryResponse,
    ChatSourcesResponse,
    FeedbackRequest,
    FeedbackResponse,
    NewSessionRequest,
    NewSessionResponse,
)
from ..services.chat_service import ChatService, ChatServiceError

router = APIRouter()

logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)

_rag_orchestrator: Optional[RAGOrchestrator] = None


def get_rag_orchestrator() -> RAGOrchestrator:
    global _rag_orchestrator
    if _rag_orchestrator is None:
        _rag_orchestrator = RAGOrchestrator()
    return _rag_orchestrator


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


def get_chat_service(db: AsyncSession = Depends(get_db)) -> ChatService:
    return ChatService(db=db, orchestrator=get_rag_orchestrator())


def _handle_service_error(exc: ChatServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post("/new-session", response_model=NewSessionResponse)
async def create_session(
    payload: NewSessionRequest,
    request: Request,
    service: ChatService = Depends(get_chat_service),
) -> NewSessionResponse:
    try:
        user_agent = payload.user_agent or request.headers.get("user-agent")
        return await service.create_session(payload, user_agent)
    except ChatServiceError as exc:
        raise _handle_service_error(exc) from exc


@router.post("/query", response_model=ChatQueryResponse)
async def query_chat(
    payload: ChatQuery,
    request: Request,
    service: ChatService = Depends(get_chat_service),
) -> ChatQueryResponse:
    await QUERY_RATE_LIMITER(request)
    try:
        return await service.query_chat(payload)
    except ChatServiceError as exc:
        raise _handle_service_error(exc) from exc


@router.get("/history", response_model=ChatHistoryResponse)
async def get_history(
    request: Request,
    session_id: str = Query(..., alias="sessionId"),
    limit: int = Query(50, ge=1, le=500),
    service: ChatService = Depends(get_chat_service),
) -> ChatHistoryResponse:
    await READ_RATE_LIMITER(request)
    try:
        return await service.get_history(session_id, limit)
    except ChatServiceError as exc:
        raise _handle_service_error(exc) from exc


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    payload: FeedbackRequest,
    request: Request,
    service: ChatService = Depends(get_chat_service),
) -> FeedbackResponse:
    await READ_RATE_LIMITER(request)
    try:
        return await service.submit_feedback(payload)
    except ChatServiceError as exc:
        raise _handle_service_error(exc) from exc


@router.get("/sources/{chat_id}", response_model=ChatSourcesResponse)
async def get_sources(
    chat_id: str,
    request: Request,
    service: ChatService = Depends(get_chat_service),
) -> ChatSourcesResponse:
    await READ_RATE_LIMITER(request)
    try:
        return await service.get_sources(chat_id)
    except ChatServiceError as exc:
        raise _handle_service_error(exc) from exc


@router.get("/confidence/{chat_id}", response_model=ChatConfidenceResponse)
async def get_confidence(
    chat_id: str,
    request: Request,
    service: ChatService = Depends(get_chat_service),
) -> ChatConfidenceResponse:
    await READ_RATE_LIMITER(request)
    try:
        return await service.get_confidence(chat_id)
    except ChatServiceError as exc:
        raise _handle_service_error(exc) from exc
