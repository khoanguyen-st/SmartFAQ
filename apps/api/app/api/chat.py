"""Chat endpoints."""
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..rag.orchestrator import RAGOrchestrator
from ..rag.retriever import Retriever
from ..rag.llm import LLMWrapper

router = APIRouter()

# -------------------------
# NOTE: Make `lang` optional - we'll auto-detect if not provided.
# -------------------------
class ChatQuery(BaseModel):
    question: str
    lang: Optional[str] = None  # optional; if provided, server will prefer this

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
    # optional meta to help debug / frontend
    detected_language: Optional[str] = Field(None, description="Detected language (server-side)")
    language_confidence: Optional[float] = Field(None, description="Confidence for detected language")


# -------------------------
# Simple Vietnamese detector:
# - If text contains Vietnamese diacritics -> "vi"
# - Otherwise -> "en"
# You can replace this with langdetect/fastText later for higher accuracy.
# -------------------------
import re
VIETNAMESE_DIACRITIC_RE = re.compile(
    r"[ắằấầẹẽỉộớợụủỹáàảãạéèẻẽíìỉĩịóòỏõọúùủũụôơưăêđ]", re.IGNORECASE
)

def simple_detect_language(text: str) -> tuple[str, float]:
    if not text or not text.strip():
        return ("und", 0.0)
    txt = text.strip()
    if VIETNAMESE_DIACRITIC_RE.search(txt):
        return ("vi", 0.99)
    # no Vietnamese diacritics -> treat as English
    return ("en", 0.9)


@router.post("/query", response_model=ChatResponse)
async def query_chat(payload: ChatQuery) -> ChatResponse:
    # Priority: client-provided payload.lang (backward compat) -> else auto-detect
    if payload.lang:
        language = payload.lang.lower()
        lang_conf = 1.0
    else:
        language, lang_conf = simple_detect_language(payload.question)

    # Important: our requirement: "ngoài tiếng việt thì đều trả lại tiếng anh"
    # So if detection returns something not 'vi' we force 'en'
    if language != "vi":
        language = "en"

    # Initialize orchestrator with chosen language
    orchestrator = RAGOrchestrator(language=language)
    response = await orchestrator.query(
        question=payload.question,
        top_k=5,
        return_top_sources=3,
        language=language
    )

    # attach detection metadata for frontend
    response["detected_language"] = language
    response["language_confidence"] = round(lang_conf, 3)

    return ChatResponse(**response)


@router.post("/query/debug")
async def query_chat_debug(payload: ChatQuery):
    # Debug endpoint: same detection logic
    if payload.lang:
        language = payload.lang.lower()
    else:
        language, _ = simple_detect_language(payload.question)

    if language != "vi":
        language = "en"

    retriever = Retriever()
    llm_wrapper = LLMWrapper(language=language)

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

    return {
        "question": payload.question,
        "language": language,
        "contexts_count": len(contexts),
        "contexts": [
            {
                "source": ctx.get("source"),
                "page": ctx.get("page"),
                "score": ctx.get("score", 0.0),
                "text_preview": (ctx.get("text", "")[:200] + "...") if len(ctx.get("text", "")) > 200 else ctx.get("text", ""),
                "text_length": len(ctx.get("text", "")),
            }
            for ctx in contexts[:5]
        ],
        "confidence": round(confidence, 4),
        "context_text_length": len(context_text),
        "context_text_preview": (context_text[:500] + "...") if len(context_text) > 500 else context_text,
        "answer": answer,
    }
