"""Service for semantic similarity using embeddings."""

from __future__ import annotations

import logging
from typing import List, Tuple

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating and comparing text embeddings."""

    def __init__(self):
        """Initialize embedding service (lazy loading)."""
        self._embeddings = None

    def _get_embeddings(self):
        """Lazy load the embedding model from RAG config."""
        if self._embeddings is None:
            try:
                from app.rag.embedder import get_embeddings

                # Reuse existing embedding model (intfloat/multilingual-e5-base)
                self._embeddings = get_embeddings()
                logger.info("Loaded embedding model from RAG config")
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                raise

        return self._embeddings

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts.

        Args:
            texts: List of text strings

        Returns:
            List of embedding vectors (each is List[float])
        """
        if not texts:
            return []

        try:
            embeddings_model = self._get_embeddings()
            # Use embed_documents() method from LangChain embeddings
            return embeddings_model.embed_documents(texts)
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return []

    @staticmethod
    def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """
        Compute cosine similarity between two vectors.
        Implementation from document_processor.py (_SemanticMergeChunker).

        Args:
            vec_a: First embedding vector
            vec_b: Second embedding vector

        Returns:
            Similarity score between 0 and 1
        """
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0

        dot_product = sum(x * y for x, y in zip(vec_a, vec_b))
        norm_a = sum(x * x for x in vec_a) ** 0.5
        norm_b = sum(y * y for y in vec_b) ** 0.5

        if norm_a == 0 or norm_b == 0:
            return 0.0

        return dot_product / (norm_a * norm_b)

    def compute_similarity(self, text1: str, text2: str) -> float:
        """
        Compute cosine similarity between two texts.

        Args:
            text1: First text
            text2: Second text

        Returns:
            Similarity score between 0 and 1
        """
        try:
            embeddings = self.get_embeddings([text1, text2])
            if len(embeddings) < 2:
                return 0.0

            return self._cosine_similarity(embeddings[0], embeddings[1])
        except Exception as e:
            logger.error(f"Error computing similarity: {e}")
            return 0.0

    def find_similar_groups(self, texts: List[str], threshold: float = 0.75) -> List[List[int]]:
        """
        Group similar texts together based on cosine similarity.

        Args:
            texts: List of text strings
            threshold: Similarity threshold (0-1). Higher = stricter matching

        Returns:
            List of groups, where each group is a list of indices
            Example: [[0, 2, 5], [1, 3], [4]] means texts[0], texts[2], texts[5] are similar
        """
        if not texts:
            return []

        try:
            # Generate embeddings for all texts
            embeddings = self.get_embeddings(texts)
            if len(embeddings) == 0:
                return [[i] for i in range(len(texts))]

            # Compute pairwise similarities
            n = len(embeddings)
            similarities = [[0.0] * n for _ in range(n)]
            for i in range(n):
                for j in range(i, n):
                    sim = self._cosine_similarity(embeddings[i], embeddings[j])
                    similarities[i][j] = sim
                    similarities[j][i] = sim

            # Group similar texts
            groups = []
            used = set()

            for i in range(len(texts)):
                if i in used:
                    continue

                # Start new group with current text
                group = [i]
                used.add(i)

                # Find similar texts
                for j in range(i + 1, len(texts)):
                    if j in used:
                        continue

                    if similarities[i][j] >= threshold:
                        group.append(j)
                        used.add(j)

                groups.append(group)

            logger.info(
                f"Grouped {len(texts)} texts into {len(groups)} groups (threshold={threshold})"
            )
            return groups

        except Exception as e:
            logger.error(f"Error grouping similar texts: {e}")
            # Fallback: each text is its own group
            return [[i] for i in range(len(texts))]

    def get_representative_text(self, texts: List[str], indices: List[int]) -> Tuple[str, int]:
        """
        Get the most representative text from a group.

        Strategy:
        1. Prefer descriptive questions (with spaces) over acronyms
        2. Among descriptive ones, choose shortest
        3. Among acronyms, choose shortest

        Args:
            texts: Full list of texts
            indices: Indices of texts in the group

        Returns:
            Tuple of (representative_text, index)
        """
        if not indices:
            return "", -1

        # Get texts in this group
        group_texts = [(texts[i], i) for i in indices]

        # Separate descriptive questions from acronyms
        descriptive = [(t, i) for t, i in group_texts if " " in t or not t.isupper()]
        acronyms = [(t, i) for t, i in group_texts if " " not in t and t.isupper()]

        # Prefer descriptive questions
        if descriptive:
            representative = min(descriptive, key=lambda x: len(x[0]))
        elif acronyms:
            representative = min(acronyms, key=lambda x: len(x[0]))
        else:
            representative = min(group_texts, key=lambda x: len(x[0]))

        return representative[0], representative[1]


__all__ = ["EmbeddingService"]
