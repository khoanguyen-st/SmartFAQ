from __future__ import annotations

import hashlib
import logging
import time
from typing import Any, Dict, Iterable, List, Optional, Tuple

from chromadb.config import Settings as ChromaSettings
from langchain_chroma import Chroma
from langchain_core.documents import Document

from app.core.config import settings
from app.rag.embedder import get_embeddings

__VECTORSTORE: Optional[Chroma] = None
_PUBLIC_VECTORSTORE: Optional[Chroma] = None
logger = logging.getLogger(__name__)


def _parse_headers(raw: Optional[str]) -> Optional[Dict[str, str]]:
    if not raw:
        return None
    out: Dict[str, str] = {}
    for kv in raw.split(";"):
        kv = kv.strip()
        if not kv:
            continue
        k, _, v = kv.partition(":")
        out[k.strip()] = v.strip()
    return out


def _get_vectorstore() -> Chroma:
    global __VECTORSTORE
    if __VECTORSTORE is not None:
        return __VECTORSTORE

    embeddings = get_embeddings()
    chroma_url = settings.CHROMA_URL

    if chroma_url.startswith("http://") or chroma_url.startswith("https://"):
        chroma_url_clean = chroma_url.replace("http://", "").replace("https://", "")
        if ":" in chroma_url_clean:
            host, port_str = chroma_url_clean.split(":", 1)
            port = int(port_str)
        else:
            host = chroma_url_clean
            port = 8000

        chroma_settings = ChromaSettings(
            chroma_api_impl="chromadb.api.fastapi.FastAPI",
            chroma_server_host=host,
            chroma_server_http_port=port,
        )

        __VECTORSTORE = Chroma(
            client_settings=chroma_settings,
            collection_name=settings.CHROMA_COLLECTION,
            embedding_function=embeddings,
            collection_metadata={"hnsw:space": settings.CHROMA_METRIC},
        )
    else:
        __VECTORSTORE = Chroma(
            persist_directory=chroma_url,
            collection_name=settings.CHROMA_COLLECTION,
            embedding_function=embeddings,
            collection_metadata={"hnsw:space": settings.CHROMA_METRIC},
        )

    return __VECTORSTORE


def get_vectorstore() -> Chroma:
    """
    Backwards-compatible accessor expected by scripts/tests.
    """
    return _get_vectorstore()


def build_documents(chunks: Iterable[Dict[str, Any]]) -> List[Document]:
    return [
        Document(page_content=c["text"], metadata=c.get("meta" or c.get("metadata") or {}))
        for c in chunks
    ]


def _hash_id(text: str, meta: Optional[Dict[str, Any]] = None, model: Optional[str] = None) -> str:
    h = hashlib.sha256()
    h.update((model or settings.EMBED_MODEL).encode("utf-8"))
    h.update(text.encode("utf-8"))
    if meta:
        # Prefer explicit chunk_id if provided, otherwise include document_id/source/page to stabilize uniqueness.
        if meta.get("chunk_id"):
            h.update(str(meta.get("chunk_id")).encode("utf-8"))
        h.update(str(meta.get("document_id", "")).encode("utf-8"))
        h.update(str(meta.get("source", "")).encode("utf-8"))
        h.update(str(meta.get("page", "")).encode("utf-8"))
        h.update(str(meta.get("chunk_index", "")).encode("utf-8"))
        h.update(str(meta.get("ingest_timestamp") or int(time.time() * 1000)).encode("utf-8"))
    return h.hexdigest()


def upsert_documents(docs: Iterable[Document], ids: Optional[List[str]] = None) -> None:
    vs = _get_vectorstore()
    docs_list = list(docs)
    if not docs_list:
        return

    if ids is not None:
        if len(ids) != len(docs_list):
            raise ValueError("Length of ids must match documents")
        pairs = zip(docs_list, ids)
    else:
        pairs = (
            (doc, _hash_id(doc.page_content, doc.metadata, settings.EMBED_MODEL))
            for doc in docs_list
        )

    dedup_docs: List[Document] = []
    dedup_ids: List[str] = []
    seen: set[str] = set()
    for doc, did in pairs:
        if did in seen:
            logger.warning("Dropping duplicate chunk id during upsert: %s", did)
            continue
        seen.add(did)
        dedup_docs.append(doc)
        dedup_ids.append(did)

    if dedup_docs:
        vs.add_documents(dedup_docs, ids=dedup_ids)


def similarity_search(
    query: str, k: int = 5, where: Optional[Dict[str, Any]] = None
) -> List[Document]:
    vs = _get_vectorstore()
    if where:
        retriever = vs.as_retriever(search_kwargs={"k": k, "filter": where})
        return retriever.invoke(query)
    return vs.similarity_search(query, k=k)


def similarity_search_with_score(
    query: str, k: int = 5, where: Optional[Dict[str, Any]] = None
) -> List[Tuple[Document, float]]:
    vs = _get_vectorstore()
    if where:
        try:
            collection = vs._collection
            resp = collection.query(
                query_texts=[query],
                n_results=k,
                where=where,
                include=["distances", "documents", "metadatas"],
            )
            results: List[Tuple[Document, float]] = []
            rr = resp.get("results", [])
            if rr:
                hits = rr[0]
                docs = hits.get("documents", [])
                distances = hits.get("distances", [])
                metadatas = hits.get("metadatas", [])
                for doc_text, dist, md in zip(docs, distances, metadatas):
                    d = Document(page_content=doc_text, metadata=md or {})
                    results.append((d, float(dist or 0.0)))
                return results
        except Exception:
            docs = similarity_search(query, k=k, where=where)
            return [(d, 0.0) for d in docs]

    return vs.similarity_search_with_score(query, k=k)


def delete_by_metadata(where: Dict[str, Any]) -> None:
    vs = _get_vectorstore()
    collection = vs._collection
    collection.delete(where=where)


def delete_by_document_id(document_id: str) -> None:
    where = {
        "$or": [
            {"source": document_id},
            {"document_id": document_id},
        ]
    }
    delete_by_metadata(where)


def _collection_get_documents(limit: Optional[int] = None) -> List[Document]:
    """
    Fetch raw documents+metadatas from the underlying Chroma collection.
    Intended for building auxiliary indexes (e.g., BM25).
    """
    vs = _get_vectorstore()
    try:
        collection = vs._collection
    except Exception as exc:  # pragma: no cover - depends on Chroma internals
        logger.exception("Chroma collection unavailable: %s", exc)
        return []

    kwargs: Dict[str, Any] = {"include": ["documents", "metadatas"]}
    if limit is not None:
        kwargs["limit"] = limit
    try:
        data = collection.get(**kwargs)
    except Exception as exc:  # pragma: no cover - upstream dependency
        logger.exception("Failed to fetch documents from Chroma: %s", exc)
        return []

    docs: List[Document] = []
    for text, meta in zip(data.get("documents") or [], data.get("metadatas") or []):
        docs.append(Document(page_content=text or "", metadata=meta or {}))
    return docs


class VectorStore:
    def __init__(self) -> None:
        self._vs = _get_vectorstore()

    def is_empty(self) -> bool:
        try:
            coll = self._vs._collection
            if hasattr(coll, "count"):
                return coll.count() == 0
            data = coll.get(include=[])
            ids = data.get("ids") or []
            return len(ids) == 0
        except Exception:
            return True

    def similarity_search(
        self, query: str, k: int = 5, where: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        return similarity_search(query, k, where)

    def similarity_search_with_score(
        self, query: str, k: int = 5, where: Optional[Dict[str, Any]] = None
    ):
        return similarity_search_with_score(query, k, where)

    def add_documents(self, documents: Iterable[Document], ids: Optional[List[str]] = None) -> None:
        upsert_documents(documents, ids)

    def delete_by_metadata(self, where: Dict[str, Any]) -> None:
        delete_by_metadata(where)

    def delete_by_document_id(self, document_id: str) -> None:
        delete_by_document_id(document_id)

    def get_retriever(
        self,
        search_type: str = "similarity",
        search_kwargs: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ):
        search_kwargs = search_kwargs or {}
        return self._vs.as_retriever(search_type=search_type, search_kwargs=search_kwargs, **kwargs)

    def get_all_documents(self, limit: Optional[int] = None) -> List[Document]:
        """
        Retrieve raw documents from the Chroma collection for auxiliary indexes.
        """
        return _collection_get_documents(limit=limit)
