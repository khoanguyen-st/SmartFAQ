from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from app.core.config import settings
from app.rag.vector_store import VectorStore


def _distance_to_similarity(distance: float, metric: str = None) -> float:
    if metric is None:
        metric = settings.CHROMA_METRIC.lower()

    if metric == "cosine":
        sim = 1.0 - distance
        return max(0.0, min(1.0, sim))

    return 1.0 / (1.0 + max(distance, 0.0))


class Retriever:
    def __init__(self, vector_store: Optional[VectorStore] = None):
        self.vector_store = vector_store or VectorStore()

    def is_empty(self) -> bool:
        return self.vector_store.is_empty()

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        where: Optional[Dict[str, Any]] = None,
        with_score: bool = True,
    ) -> List[Dict[str, Any]]:
        if with_score:
            results = self.vector_store.similarity_search_with_score(query, k=top_k, where=where)
            contexts: List[Dict[str, Any]] = []
            for doc, distance in results:
                similarity = _distance_to_similarity(distance, settings.CHROMA_METRIC)
                meta = dict(doc.metadata or {})
                contexts.append(
                    {
                        "text": doc.page_content,
                        "metadata": meta,
                        "score": similarity,
                        "document_id": meta.get("document_id"),
                        "chunk_id": meta.get("chunk_id"),
                        "page": meta.get("page"),
                        "source": meta.get("source"),
                    }
                )
            return contexts

        docs = self.vector_store.similarity_search(query, k=top_k, where=where)
        return [
            {
                "text": d.page_content,
                "metadata": d.metadata,
                "score": None,
                "document_id": d.metadata.get("document_id"),
                "chunk_id": d.metadata.get("chunk_id"),
                "page": d.metadata.get("page"),
                "source": d.metadata.get("source"),
            }
            for d in docs
        ]

    def calculate_confidence(self, contexts: List[Dict[str, Any]]) -> float:
        if not contexts:
            return 0.0
        top_n = min(3, len(contexts))
        scores = [ctx.get("score") for ctx in contexts[:top_n] if ctx.get("score") is not None]
        if not scores:
            return 0.0
        decay = 0.6
        weighted_sum = 0.0
        total_weight = 0.0
        for i, s in enumerate(scores):
            w = decay**i
            weighted_sum += s * w
            total_weight += w
        return (weighted_sum / total_weight) if total_weight > 0 else 0.0

    def get_langchain_retriever(
        self,
        k: int = 5,
        where: Optional[Dict[str, Any]] = None,
        search_type: Literal["similarity", "mmr"] = "similarity",
        **kwargs,
    ):
        skw: Dict[str, Any] = {"k": k}
        if where:
            skw["filter"] = where
        return self.vector_store.get_retriever(
            search_type=search_type,
            search_kwargs=skw,
            **kwargs,
        )
