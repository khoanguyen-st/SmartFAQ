"""Chat endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

from ..rag.orchestrator import RAGOrchestrator

router = APIRouter()


class ChatQuery(BaseModel):
    question: str
    lang: str = "en"


@router.post("/query")
async def query_chat(payload: ChatQuery) -> dict[str, object]:
    orchestrator = RAGOrchestrator()
    response = await orchestrator.query(
        question=payload.question,
        top_k=5,
        return_top_sources=3
    )
    return response
