from __future__ import annotations

import logging

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
    FAQItem,
    FAQsResponse,
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


def get_rag_orchestrator() -> RAGOrchestrator:
    """Create a new RAGOrchestrator instance with current settings.

    This ensures that each request uses the latest LLM model configuration
    from settings, allowing dynamic switching between Gemini and Local AI.
    """
    from ..core.config import settings
    from ..rag.llm import LLMWrapper

    llm_wrapper = LLMWrapper(
        model=settings.LLM_MODEL,
        temperature=settings.LLM_TEMPERATURE,
        max_tokens=settings.LLM_MAX_TOKENS,
    )

    return RAGOrchestrator(llm_wrapper=llm_wrapper)


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


@router.get("/faqs", response_model=FAQsResponse)
async def get_faq_suggestions(
    request: Request,
    language: str = Query("vi", regex="^(vi|en)$"),
    limit: int = Query(6, ge=1, le=20),
    service: ChatService = Depends(get_chat_service),
) -> FAQsResponse:
    """
    Get frequently asked questions based on actual user queries.

    Uses semantic similarity grouping to merge similar questions and
    returns the most frequently asked questions from the last 30 days.

    Args:
        language: Language code ('vi' or 'en')
        limit: Maximum number of FAQs to return (default: 6, max: 20)

    Returns:
        FAQsResponse with dynamically generated FAQ items

    Examples:
        - /api/chat/faqs?language=vi&limit=6
        - /api/chat/faqs?language=en&limit=10
    """
    await READ_RATE_LIMITER(request)

    try:
        return await service.get_faqs(
            language=language,
            limit=limit,
        )
    except ChatServiceError as exc:
        raise _handle_service_error(exc) from exc


@router.get("/faqs/trending", response_model=FAQsResponse)
async def get_trending_questions(
    request: Request,
    language: str = Query("vi", regex="^(vi|en)$"),
    limit: int = Query(5, ge=1, le=10),
    hours: int = Query(24, ge=1, le=168),
    service: ChatService = Depends(get_chat_service),
) -> FAQsResponse:
    """
    Get trending questions from recent hours.

    Args:
        language: Language code ('vi' or 'en')
        limit: Maximum number of trending questions (default: 5, max: 10)
        hours: Look back hours (default: 24, max: 168/1 week)

    Returns:
        FAQsResponse with trending questions
    """
    await READ_RATE_LIMITER(request)

    try:
        trending = await service.faq_service.get_trending_questions(
            language=language,
            limit=limit,
            hours=hours,
        )

        faq_items = [
            FAQItem(
                id=item["id"],
                question=item["question"],
                category=item.get("category", "trending"),
                count=item["count"],
            )
            for idx, item in enumerate(trending)
        ]

        return FAQsResponse(language=language, faqs=faq_items)

    except Exception as exc:
        logger.exception("Failed to get trending questions")
        raise HTTPException(status_code=500, detail="Failed to load trending questions") from exc


@router.get("/faqs/suggestions", response_model=FAQsResponse)
async def get_faq_suggestions_public(
    language: str = Query("vi", regex="^(vi|en)$"),
    limit: int = Query(5, ge=1, le=10),
    service: ChatService = Depends(get_chat_service),
) -> FAQsResponse:
    """
    Public endpoint for FAQ suggestions (for widget).
    No authentication or rate limiting required.

    Args:
        language: Language code ('vi' or 'en')
        limit: Maximum number of FAQs (default: 5, max: 10)

    Returns:
        FAQsResponse with top frequently asked questions
    """
    try:
        return await service.get_faqs(
            language=language,
            limit=limit,
        )
    except ChatServiceError as exc:
        raise _handle_service_error(exc) from exc
