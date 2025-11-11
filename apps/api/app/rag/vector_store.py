# vector_store.py
from __future__ import annotations

import hashlib
from typing import Any, Dict, Iterable, List, Optional, Tuple

from chromadb.config import Settings as ChromaSettings
from langchain_chroma import Chroma
from langchain_core.documents import Document

from app.core.config import settings
from app.rag.embedder import get_embeddings


# Optional auth headers if behind gateway
def _parse_headers(raw: Optional[str]) -> Optional[Dict[str, str]]:
    if not raw:
        return None
    out = {}
    for kv in raw.split(";"):
        kv = kv.strip()
        if not kv:
            continue
        k, _, v = kv.partition(":")
        out[k.strip()] = v.strip()
    return out


# -------- Lazy singleton cache --------
__VECTORSTORE: Optional[Chroma] = None


def get_vectorstore() -> Chroma:
    """
    Get singleton Chroma vector store instance.
    Connects to Chroma server using HTTP client.
    """
    global __VECTORSTORE
    if __VECTORSTORE is None:
        embeddings = get_embeddings()

        # Parse URL
        chroma_url = settings.CHROMA_URL.replace("http://", "").replace("https://", "")
        if ":" in chroma_url:
            host, port_str = chroma_url.split(":")
            port = int(port_str)
        else:
            host = chroma_url
            port = 8000

        # Create Chroma Settings object
        chroma_settings = ChromaSettings(
            chroma_api_impl="chromadb.api.fastapi.FastAPI",
            chroma_server_host=host,
            chroma_server_http_port=port,
        )

        # Initialize Chroma with Settings object
        __VECTORSTORE = Chroma(
            client_settings=chroma_settings,
            collection_name=settings.CHROMA_COLLECTION,
            embedding_function=embeddings,
            collection_metadata={"hnsw:space": settings.CHROMA_METRIC},
        )
    return __VECTORSTORE


# -------- Helpers --------
def build_documents(chunks: List[Dict[str, Any]]) -> List[Document]:
    """
    chunks: [{"text": "...", "meta": {...}, "id": "...?"}, ...]
    """
    docs = []
    for c in chunks:
        docs.append(Document(page_content=c["text"], metadata=c.get("meta", {})))
    return docs


def _hash_id(text: str, meta: Optional[dict] = None, model: Optional[str] = None) -> str:
    """Generate deterministic hash ID for document chunks."""
    h = hashlib.sha256()
    h.update((model or settings.EMBED_MODEL).encode("utf-8"))
    h.update(text.encode("utf-8"))
    if meta:
        # tránh dài dòng: chỉ lấy một số field phổ biến
        h.update(str(meta.get("source", "")).encode("utf-8"))
        h.update(str(meta.get("page", "")).encode("utf-8"))
    return h.hexdigest()


# -------- Ingest / Upsert --------
def upsert_documents(docs: Iterable[Document], ids: Optional[List[str]] = None) -> None:
    """
    Upsert documents to vector store.
    If ids not provided, generates deterministic hash IDs for idempotency.
    """
    vs = get_vectorstore()
    docs = list(docs)
    if ids is not None:
        if len(ids) != len(docs):
            raise ValueError("Length of ids must match documents")
        vs.add_documents(docs, ids=ids)
        return

    # nếu không truyền ids, tạo id hash để idempotent
    gen_ids = [_hash_id(d.page_content, d.metadata, settings.EMBED_MODEL) for d in docs]
    vs.add_documents(docs, ids=gen_ids)


# -------- Search --------
def similarity_search(
    query: str, k: int = 5, where: Optional[Dict[str, Any]] = None
) -> List[Document]:
    vs = get_vectorstore()
    if where:
        retriever = vs.as_retriever(search_kwargs={"k": k, "filter": where})
        return retriever.invoke(query)
    return vs.similarity_search(query, k=k)


def similarity_search_with_score(
    query: str, k: int = 5, where: Optional[Dict[str, Any]] = None
) -> List[Tuple[Document, float]]:
    vs = get_vectorstore()
    if where:
        # langchain-chroma hiện chưa expose with_score + filter thẳng;
        # có thể dùng client.query(...) nếu cần score thật (xem note).
        docs = similarity_search(query, k=k, where=where)
        return [(d, 0.0) for d in docs]  # placeholder score
    return vs.similarity_search_with_score(query, k=k)


# -------- Delete / Admin --------
def delete_by_metadata(where: Dict[str, Any]) -> None:
    """Delete documents by metadata filter."""
    # Dùng underlying client/collection cùng context
    vs = get_vectorstore()
    collection = vs._collection  # type: ignore[attr-defined]  # private, nhưng cùng context
    collection.delete(where=where)


# -------- VectorStore wrapper class --------
class VectorStore:
    """Wrapper class for backwards compatibility"""

    def __init__(self):
        self._vs = get_vectorstore()

    def similarity_search(
        self, query: str, k: int = 5, where: Optional[Dict[str, Any]] = None
    ) -> List:
        return similarity_search(query, k, where)

    def similarity_search_with_score(
        self, query: str, k: int = 5, where: Optional[Dict[str, Any]] = None
    ):
        return similarity_search_with_score(query, k, where)

    def add_documents(self, documents, ids: Optional[List[str]] = None):
        return upsert_documents(documents, ids)

    def delete_by_metadata(self, where: Dict[str, Any]):
        return delete_by_metadata(where)

    def get_retriever(
        self,
        search_type: str = "similarity",
        search_kwargs: Optional[Dict[str, Any]] = None,
        **kwargs,
    ):
        """Get LangChain retriever interface"""
        search_kwargs = search_kwargs or {}
        return self._vs.as_retriever(search_type=search_type, search_kwargs=search_kwargs, **kwargs)
