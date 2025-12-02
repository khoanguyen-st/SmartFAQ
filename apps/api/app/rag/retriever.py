from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Literal, Optional, Sequence

from langchain_core.documents import Document
from rank_bm25 import BM25Okapi

from app.core.config import settings
from app.rag.vector_store import VectorStore

logger = logging.getLogger(__name__)


def _distance_to_similarity(distance: float, metric: str = None) -> float:
    """
    Chuẩn hóa score về [0,1] tùy metric:
    - cosine: similarity ≈ 1 - distance (clamp 0..1)
    - l2/ip/khác: heuristic 1/(1+d) để có số tăng theo độ gần
    """
    if metric is None:
        metric = settings.CHROMA_METRIC.lower()

    if metric == "cosine":
        sim = 1.0 - distance
        if sim < 0.0:
            sim = 0.0
        if sim > 1.0:
            sim = 1.0
        return sim
    return 1.0 / (1.0 + max(distance, 0.0))


_TOKEN_RE = re.compile(r"[A-Za-z0-9']+")


def _tokenize(text: str) -> List[str]:
    if not text:
        return []
    return _TOKEN_RE.findall(text.lower())


class _BM25LexicalIndex:
    """
    BM25 index được giữ trong bộ nhớ để hybrid với vector search.
    """

    def __init__(self, documents: Sequence[Document]):
        self.documents = list(documents)
        corpus_tokens = [_tokenize(d.page_content) for d in self.documents]
        self.bm25 = BM25Okapi(corpus_tokens)

    def search(self, query: str, k: int = 10) -> List[Dict[str, Any]]:
        if not self.documents:
            return []
        tokens = _tokenize(query)
        if not tokens:
            return []

        scores = self.bm25.get_scores(tokens)
        ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)

        results: List[Dict[str, Any]] = []
        for rank, (idx, score) in enumerate(ranked[:k], start=1):
            doc = self.documents[idx]
            meta = dict(doc.metadata or {})
            results.append(
                {
                    "text": doc.page_content,
                    "metadata": meta,
                    "score_lex": float(score),
                    "rank_lex": rank,
                    "document_id": meta.get("document_id"),
                    "chunk_id": meta.get("chunk_id"),
                    "page": meta.get("page"),
                    "source": meta.get("source"),
                }
            )
        return results


class Retriever:
    """Custom retriever implementation built on VectorStore (Chroma)."""

    def __init__(self, vector_store: Optional[VectorStore] = None):
        self.vector_store = vector_store or VectorStore()
        self._lexical_index: Optional[_BM25LexicalIndex] = None
        self._lexical_ready: bool = False

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        where: Optional[Dict[str, Any]] = None,
        with_score: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant document chunks (optionally filtered by metadata).
        Returns: [{text, metadata, score}]
        """
        if not with_score:
            docs = self.vector_store.similarity_search(query, k=top_k, where=where)
            return self._format_results_no_score(docs)

        if settings.HYBRID_ENABLED and where:
            logger.debug("Hybrid retrieval skips metadata filters; using vector-only for where=%s", where)
            return self._retrieve_vector_only(query, top_k=top_k, where=where)

        if settings.HYBRID_ENABLED:
            return self._retrieve_hybrid(query, top_k=top_k, where=where)

        return self._retrieve_vector_only(query, top_k=top_k, where=where)

    def calculate_confidence(self, contexts: List[Dict[str, Any]]) -> float:
        """
        Weighted average của top-3 (0..1). Nếu ít hơn 3, tự co lại.
        """
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
        """
        LangChain retriever (dùng cho LCEL chain).
        - search_type="similarity" | "mmr"
        - where: filter metadata
        - kwargs: pass-through vào as_retriever (vd. fetch_k, lambda_mult khi MMR)
        """
        skw: Dict[str, Any] = {"k": k}
        if where:
            skw["filter"] = where
        return self.vector_store.get_retriever(
            search_type=search_type,
            search_kwargs=skw,
            **kwargs,
        )

    def _format_results_no_score(self, docs: List[Document]) -> List[Dict[str, Any]]:
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

    def _retrieve_vector_only(
        self, query: str, top_k: int, where: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        results = self.vector_store.similarity_search_with_score(query, k=top_k, where=where)
        contexts: List[Dict[str, Any]] = []
        for rank, (doc, distance) in enumerate(results, start=1):
            similarity = _distance_to_similarity(distance, settings.CHROMA_METRIC)
            meta = dict(doc.metadata or {})
            contexts.append(
                {
                    "text": doc.page_content,
                    "metadata": meta,
                    "score": similarity,
                    "score_vec": similarity,
                    "rank_vec": rank,
                    "document_id": meta.get("document_id"),
                    "chunk_id": meta.get("chunk_id"),
                    "page": meta.get("page"),
                    "source": meta.get("source"),
                }
            )
        return contexts

    def _retrieve_hybrid(
        self, query: str, top_k: int, where: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        vec_k = max(top_k, settings.HYBRID_K_VEC)
        vector_results = self._retrieve_vector_only(query, top_k=vec_k, where=where)

        lex_index = self._get_lexical_index()
        lexical_results: List[Dict[str, Any]] = []
        if lex_index:
            try:
                lexical_results = lex_index.search(query, k=settings.HYBRID_K_LEX)
            except Exception as exc:  # pragma: no cover - external dependency
                logger.exception("Lexical (BM25) search failed: %s", exc)

        if not lexical_results:
            return vector_results[:top_k]

        fused = self._rrf_fuse(vector_results, lexical_results, top_k=top_k)
        return fused

    def _get_lexical_index(self) -> Optional[_BM25LexicalIndex]:
        if self._lexical_ready:
            return self._lexical_index

        self._lexical_ready = True
        docs = self.vector_store.get_all_documents(limit=settings.HYBRID_MAX_DOCS)
        if not docs:
            logger.warning("Hybrid mode enabled but no documents available for BM25 index.")
            return None

        try:
            self._lexical_index = _BM25LexicalIndex(docs)
            logger.info(
                "BM25 lexical index built with %d documents (limit=%d).",
                len(docs),
                settings.HYBRID_MAX_DOCS,
            )
        except Exception as exc:  # pragma: no cover - external dependency
            logger.exception("Failed to build BM25 index: %s", exc)
            self._lexical_index = None
        return self._lexical_index

    @staticmethod
    def _ctx_key(ctx: Dict[str, Any]) -> str:
        meta = ctx.get("metadata") or {}
        chunk_id = meta.get("chunk_id") or ctx.get("chunk_id")
        document_id = meta.get("document_id") or ctx.get("document_id")
        if chunk_id:
            return f"chunk:{chunk_id}"
        if document_id:
            return f"doc:{document_id}"
        text = ctx.get("text") or ""
        return f"text:{hash(text)}"

    def _rrf_fuse(
        self,
        vector_contexts: List[Dict[str, Any]],
        lexical_contexts: List[Dict[str, Any]],
        top_k: int,
    ) -> List[Dict[str, Any]]:
        fused: Dict[str, Dict[str, Any]] = {}
        k_param = max(settings.HYBRID_FUSION_K, 1)

        for ctx in vector_contexts:
            key = self._ctx_key(ctx)
            fused.setdefault(key, {}).update(ctx)

        for ctx in lexical_contexts:
            key = self._ctx_key(ctx)
            if key not in fused:
                fused[key] = ctx
            else:
                fused[key].update({k: v for k, v in ctx.items() if v is not None})

        for key, ctx in fused.items():
            rank_vec = ctx.get("rank_vec")
            rank_lex = ctx.get("rank_lex")
            rrf = 0.0
            if rank_vec:
                rrf += 1.0 / (k_param + rank_vec)
            if rank_lex:
                rrf += 1.0 / (k_param + rank_lex)
            ctx["score_rrf_raw"] = rrf

        # Chuẩn hóa về [0,1] dựa trên điểm RRF tối đa khi cả hai nguồn cùng đứng hạng 1.
        for ctx in fused.values():
            raw = ctx.get("score_rrf_raw", 0.0)
            denom = 0.0
            if ctx.get("rank_vec") is not None:
                denom += 1.0 / (k_param + 1.0)
            if ctx.get("rank_lex") is not None:
                denom += 1.0 / (k_param + 1.0)
            ctx["score"] = min(raw / denom, 1.0) if denom > 0 else 0.0

        ordered = sorted(fused.values(), key=lambda c: c.get("score", 0.0), reverse=True)
        return ordered[:top_k]
