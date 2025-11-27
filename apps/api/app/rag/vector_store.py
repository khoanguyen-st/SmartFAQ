from __future__ import annotations

import hashlib
from typing import Any, Dict, Iterable, List, Optional, Tuple

from chromadb.config import Settings as ChromaSettings
from langchain_chroma import Chroma
from langchain_core.documents import Document

from app.core.config import settings
from app.rag.embedder import get_embeddings

__VECTORSTORE: Optional[Chroma] = None


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

    # Support both HTTP client and persistent client
    chroma_url = settings.CHROMA_URL

    if chroma_url.startswith("http://") or chroma_url.startswith("https://"):
        # HTTP client mode
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
        # Persistent client mode (path to SQLite directory)
        __VECTORSTORE = Chroma(
            persist_directory=chroma_url,
            collection_name=settings.CHROMA_COLLECTION,
            embedding_function=embeddings,
            collection_metadata={"hnsw:space": settings.CHROMA_METRIC},
        )

    return __VECTORSTORE


def build_documents(chunks: Iterable[Dict[str, Any]]) -> List[Document]:
    return [Document(page_content=c["text"], metadata=c.get("meta", {})) for c in chunks]


def _hash_id(text: str, meta: Optional[Dict[str, Any]] = None, model: Optional[str] = None) -> str:
    h = hashlib.sha256()
    h.update((model or settings.EMBED_MODEL).encode("utf-8"))
    h.update(text.encode("utf-8"))
    if meta:
        h.update(str(meta.get("source", "")).encode("utf-8"))
        h.update(str(meta.get("page", "")).encode("utf-8"))
    return h.hexdigest()


def upsert_documents(docs: Iterable[Document], ids: Optional[List[str]] = None) -> None:
    vs = _get_vectorstore()
    docs_list = list(docs)
    if ids is not None:
        if len(ids) != len(docs_list):
            raise ValueError("Length of ids must match documents")
        vs.add_documents(docs_list, ids=ids)
        return

    gen_ids = [_hash_id(d.page_content, d.metadata, settings.EMBED_MODEL) for d in docs_list]
    vs.add_documents(docs_list, ids=gen_ids)


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


class VectorStore:
    def __init__(self) -> None:
        self._vs = _get_vectorstore()

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
