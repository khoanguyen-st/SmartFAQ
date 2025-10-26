"""Vector store retriever stubs."""

from typing import Any


async def semantic_search(query_embedding: list[float], top_k: int = 5) -> list[dict[str, Any]]:
    # TODO: query ChromaDB
    return []
