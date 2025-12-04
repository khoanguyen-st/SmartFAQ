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
    if metric is None:
        metric = settings.CHROMA_METRIC.lower()

    if metric == "cosine":
        sim = 1.0 - distance
        return max(0.0, min(1.0, sim))

    return 1.0 / (1.0 + max(distance, 0.0))


# Vietnamese language detection
_VIETNAMESE_CHARS = re.compile(
    r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]"
)

_TOKEN_RE = re.compile(r"[A-Za-z0-9']+")


def _is_vietnamese(text: str) -> bool:
    """Detect if text contains Vietnamese characters."""
    return bool(_VIETNAMESE_CHARS.search(text.lower()))


def _tokenize(text: str) -> List[str]:
    """
    Tokenize text with Vietnamese-aware tokenization.

    Approach:
    - Vietnamese: Split on whitespace and punctuation (simple but effective for BM25)
    - English/Other: Regex-based word extraction
    """
    if not text:
        return []

    # Check if text is Vietnamese
    if _is_vietnamese(text):
        # Vietnamese: Split on whitespace and punctuation
        # This is simpler than underthesea but works well for BM25
        tokens = []
        # Remove punctuation and split
        import string

        text_cleaned = text.lower()
        for char in string.punctuation:
            text_cleaned = text_cleaned.replace(char, " ")

        tokens = [word.strip() for word in text_cleaned.split() if word.strip()]
        return tokens

    # English/other languages: use regex
    return _TOKEN_RE.findall(text.lower())


class _BM25LexicalIndex:
    """
    BM25 index được giữ trong bộ nhớ để hybrid với vector search.
    Supports incremental updates for better performance.
    """

    def __init__(self, documents: Sequence[Document]):
        self.documents = list(documents)
        self._corpus_tokens = [_tokenize(d.page_content) for d in self.documents]
        self.bm25 = BM25Okapi(self._corpus_tokens)
        logger.info(f"BM25 index initialized with {len(self.documents)} documents")

    def add_documents(self, new_docs: Sequence[Document]) -> None:
        """
        Add new documents to the existing index incrementally.
        This is more efficient than rebuilding the entire index.
        """
        if not new_docs:
            return

        # Add to document list
        self.documents.extend(new_docs)

        # Tokenize new documents
        new_tokens = [_tokenize(d.page_content) for d in new_docs]
        self._corpus_tokens.extend(new_tokens)

        # Rebuild BM25 with updated corpus
        # Note: BM25Okapi doesn't support true incremental updates,
        # but this is still faster than reloading all docs from DB
        self.bm25 = BM25Okapi(self._corpus_tokens)

        logger.info(f"Added {len(new_docs)} documents to BM25 index (total: {len(self.documents)})")

    def remove_documents(self, document_ids: List[str]) -> None:
        """Remove documents by document_id from the index."""
        if not document_ids:
            return

        id_set = set(document_ids)

        # Filter out documents
        filtered_docs = []
        filtered_tokens = []

        for doc, tokens in zip(self.documents, self._corpus_tokens):
            doc_id = doc.metadata.get("document_id")
            if doc_id not in id_set:
                filtered_docs.append(doc)
                filtered_tokens.append(tokens)

        removed_count = len(self.documents) - len(filtered_docs)

        if removed_count > 0:
            self.documents = filtered_docs
            self._corpus_tokens = filtered_tokens
            self.bm25 = BM25Okapi(self._corpus_tokens)
            logger.info(
                f"Removed {removed_count} documents from BM25 index (remaining: {len(self.documents)})"
            )

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
    def __init__(self, vector_store: Optional[VectorStore] = None):
        self.vector_store = vector_store or VectorStore()
        self._lexical_index: Optional[_BM25LexicalIndex] = None
        self._lexical_ready: bool = False

    def is_empty(self) -> bool:
        return self.vector_store.is_empty()

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
            logger.debug(
                "Hybrid retrieval skips metadata filters; using vector-only for where=%s", where
            )
            return self._retrieve_vector_only(query, top_k=top_k, where=where)

        if settings.HYBRID_ENABLED:
            return self._retrieve_hybrid(query, top_k=top_k, where=where)

        return self._retrieve_vector_only(query, top_k=top_k, where=where)

    def calculate_confidence(
        self, contexts: List[Dict[str, Any]], num_sub_queries: int = 1
    ) -> float:
        """
        Calculate confidence score with diversity and coverage considerations.

        Args:
            contexts: Retrieved document chunks with scores
            num_sub_queries: Number of sub-queries used for retrieval

        Returns:
            Confidence score between 0.0 and 1.0
        """
        if not contexts:
            return 0.0

        # Diversity bonus: prefer results from multiple different documents
        unique_docs = len(set(ctx.get("document_id") for ctx in contexts if ctx.get("document_id")))
        diversity_target = settings.CONFIDENCE_DIVERSITY_TARGET
        diversity_bonus = min(1.0, unique_docs / diversity_target)

        # Calculate base confidence from top scores with decay
        top_n = min(3, len(contexts))
        scores = [ctx.get("score") for ctx in contexts[:top_n] if ctx.get("score") is not None]
        if not scores:
            return 0.0

        decay = settings.CONFIDENCE_DECAY
        weighted_sum = sum(s * (decay**i) for i, s in enumerate(scores))
        total_weight = sum(decay**i for i in range(len(scores)))
        base_confidence = weighted_sum / total_weight if total_weight > 0 else 0.0

        # Coverage penalty: if many sub-queries but few results
        expected_results = num_sub_queries * 3  # Expect ~3 results per sub-query
        coverage_ratio = min(1.0, len(contexts) / max(expected_results, 1))

        # Combined confidence score
        final_confidence = base_confidence * diversity_bonus * coverage_ratio

        logger.debug(
            f"Confidence: base={base_confidence:.3f}, diversity={diversity_bonus:.3f}, "
            f"coverage={coverage_ratio:.3f}, final={final_confidence:.3f}"
        )

        return final_confidence

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

    def update_lexical_index_add(self, new_docs: Sequence[Document]) -> None:
        """
        Add new documents to the BM25 lexical index incrementally.
        This is more efficient than rebuilding the entire index.

        Args:
            new_docs: New documents to add to the index
        """
        if not settings.HYBRID_ENABLED:
            return

        index = self._get_lexical_index()
        if index:
            index.add_documents(new_docs)
        else:
            logger.warning("BM25 index not available for incremental update")

    def update_lexical_index_remove(self, document_ids: List[str]) -> None:
        """
        Remove documents from the BM25 lexical index by document IDs.

        Args:
            document_ids: List of document IDs to remove
        """
        if not settings.HYBRID_ENABLED:
            return

        index = self._get_lexical_index()
        if index:
            index.remove_documents(document_ids)
        else:
            logger.warning("BM25 index not available for removal")

    def refresh_lexical_index(self) -> None:
        """Force refresh of the BM25 lexical index from vector store."""
        if not settings.HYBRID_ENABLED:
            return

        logger.info("Refreshing BM25 lexical index...")
        self._lexical_ready = False
        self._lexical_index = None
        self._get_lexical_index()

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

        # Normalize based on actual max score in this batch
        max_rrf = max((ctx.get("score_rrf_raw", 0.0) for ctx in fused.values()), default=1.0)
        if max_rrf > 0:
            for ctx in fused.values():
                raw = ctx.get("score_rrf_raw", 0.0)
                ctx["score"] = min(raw / max_rrf, 1.0)
        else:
            for ctx in fused.values():
                ctx["score"] = 0.0

        ordered = sorted(fused.values(), key=lambda c: c.get("score", 0.0), reverse=True)
        return ordered[:top_k]
