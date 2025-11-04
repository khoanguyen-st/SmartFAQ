"""Chat endpoints."""

from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..rag.orchestrator import RAGOrchestrator
from ..rag.retriever import Retriever
from ..rag.llm import LLMWrapper

router = APIRouter()


class ChatQuery(BaseModel):
    question: str
    lang: str = "vi"  # "vi" for Vietnamese, "en" for English


class SourceInfo(BaseModel):
    """Source document information."""
    document_id: Optional[str] = None
    chunk_id: Optional[str] = None
    chunk_index: Optional[int] = None
    source: Optional[str] = None
    page: Optional[int] = None
    score: Optional[float] = None


class ChatResponse(BaseModel):
    """Response model for chat query endpoint."""
    answer: str = Field(..., description="The generated answer from Gemini")
    confidence: float = Field(..., description="Confidence score (0-1)")
    sources: List[SourceInfo] = Field(..., description="List of source documents")
    fallback_triggered: bool = Field(..., description="Whether fallback was triggered")
    latency_ms: int = Field(..., description="Response latency in milliseconds")


class ContextInfo(BaseModel):
    """Context document information for debug endpoint."""
    source: Optional[str] = None
    page: Optional[int] = None
    score: float = 0.0
    text_preview: str = Field(..., description="Preview of document text (first 200 chars)")
    text_length: int = Field(..., description="Full length of document text")


class ChatDebugResponse(BaseModel):
    """Response model for chat debug endpoint."""
    question: str = Field(..., description="The question asked")
    language: str = Field(..., description="Response language (vi/en)")
    contexts_count: int = Field(..., description="Number of contexts retrieved")
    contexts: List[ContextInfo] = Field(..., description="List of retrieved contexts")
    confidence: float = Field(..., description="Confidence score (0-1)")
    context_text_length: int = Field(..., description="Length of formatted context text")
    context_text_preview: str = Field(..., description="Preview of formatted context text")
    answer: str = Field(..., description="The generated answer from Gemini")


@router.post("/query", response_model=ChatResponse)
async def query_chat(payload: ChatQuery) -> ChatResponse:
    orchestrator = RAGOrchestrator(language=payload.lang)
    response = await orchestrator.query(
        question=payload.question,
        top_k=5,
        return_top_sources=3,
        language=payload.lang
    )
    return ChatResponse(**response)


@router.post("/query/debug", response_model=ChatDebugResponse)
async def query_chat_debug(payload: ChatQuery) -> ChatDebugResponse:
    """
    Debug endpoint để xem chi tiết flow RAG:
    - Documents retrieved
    - Context format
    - Confidence score
    - Gemini response
    """
    retriever = Retriever()
    llm_wrapper = LLMWrapper(language=payload.lang)
    
    # 1. Retrieve
    contexts = retriever.retrieve(
        query=payload.question,
        top_k=5,
        with_score=True,
    )
    
    # 2. Confidence
    confidence = retriever.calculate_confidence(contexts)
    
    # 3. Format context
    context_text = llm_wrapper.format_contexts(contexts, max_sources=8)
    
    # 4. Generate answer
    answer = "N/A"
    if contexts:
        try:
            answer = await llm_wrapper.generate_answer_async(payload.question, contexts)
        except Exception as e:
            answer = f"Error: {str(e)}"
    
    # 5. Return debug info
    return ChatDebugResponse(
        question=payload.question,
        language=payload.lang,
        contexts_count=len(contexts),
        contexts=[
            ContextInfo(
                source=ctx.get("source"),
                page=ctx.get("page"),
                score=ctx.get("score", 0.0),
                text_preview=ctx.get("text", "")[:200] + "..." if len(ctx.get("text", "")) > 200 else ctx.get("text", ""),
                text_length=len(ctx.get("text", "")),
            )
            for ctx in contexts[:5]
        ],
        confidence=round(confidence, 4),
        context_text_length=len(context_text),
        context_text_preview=context_text[:500] + "..." if len(context_text) > 500 else context_text,
        answer=answer,
    )
