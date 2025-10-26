"""Chat endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

from ..rag.pipeline import answer

router = APIRouter()


class ChatQuery(BaseModel):
    question: str
    lang: str = "en"


@router.post("/query")
async def query_chat(payload: ChatQuery) -> dict[str, object]:
    response = await answer(payload.question, payload.lang)
    return response
