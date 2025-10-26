"""RAG pipeline orchestration."""

from typing import Any

from .embedder import embed_texts
from .retriever import semantic_search


async def answer(question: str, lang: str) -> dict[str, Any]:
    query_vector = (await embed_texts([question]))[0]
    docs = await semantic_search(query_vector, top_k=5)

    similarity = max((doc.get("score", 0.0) for doc in docs), default=0.0)
    num_docs = len(docs)
    model_confidence = 0.5  # placeholder until LLM integration

    confidence = int(
        min(
            100,
            (similarity * 100 * 0.5) + (min(num_docs, 5) / 5 * 100 * 0.2) + (model_confidence * 100 * 0.3),
        )
    )

    return {
        "answer": "This is a placeholder response.",
        "lang": lang,
        "sources": [doc.get("title", "unknown") for doc in docs],
        "confidence": confidence,
    }
