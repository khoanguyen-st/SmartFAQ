"""Embeddings helpers."""

from typing import List


async def embed_texts(texts: List[str]) -> list[list[float]]:
    # TODO: integrate SentenceTransformers
    return [[0.0] * 3 for _ in texts]
