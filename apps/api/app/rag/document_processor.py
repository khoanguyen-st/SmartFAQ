from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any, Dict, List, Optional

import docx2txt
import pypdf
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


def _clean_text(s: Optional[str]) -> str:
    if not s:
        return ""
    # chuẩn hoá cơ bản
    return " ".join(s.split())


def _hash_id(*parts: str) -> str:
    h = hashlib.sha256()
    for p in parts:
        h.update(p.encode("utf-8", errors="ignore"))
    return h.hexdigest()


class PDFLoader:
    """Custom PDF loader using pypdf"""

    def __init__(self, file_path: str):
        self.file_path = file_path

    def load(self) -> List[Document]:
        docs: List[Document] = []
        with open(self.file_path, "rb") as f:
            reader = pypdf.PdfReader(f)
            for page_num, page in enumerate(reader.pages, start=1):
                try:
                    text = _clean_text(page.extract_text())
                except Exception:
                    text = ""
                if not text:
                    # skip trang trống/không trích được
                    continue
                docs.append(
                    Document(
                        page_content=text,
                        metadata={"source": self.file_path, "page": page_num},
                    )
                )
        return docs


class DocxLoader:
    """Custom DOCX loader using docx2txt"""

    def __init__(self, file_path: str):
        self.file_path = file_path

    def load(self) -> List[Document]:
        try:
            text = _clean_text(docx2txt.process(self.file_path))
        except Exception:
            text = ""
        if not text:
            return []
        return [
            Document(
                page_content=text,
                metadata={"source": self.file_path, "page": None},
            )
        ]


class DocumentProcessor:
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        separators: Optional[List[str]] = None,
    ):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=separators or ["\n\n", "\n", ". ", " ", ""],
            is_separator_regex=False,
        )

    def load_document(self, file_path: str) -> List[Document]:
        path = Path(file_path)
        ext = path.suffix.lower()

        if ext == ".pdf":
            loader = PDFLoader(file_path)
        elif ext in (".docx", ".doc"):
            loader = DocxLoader(file_path)
        else:
            raise ValueError(f"Unsupported file type: {ext}")

        docs = loader.load()
        return [d for d in docs if d.page_content.strip()]

    def process_document(
        self,
        file_path: str,
        document_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        """
        Load -> split theo từng trang (để giữ metadata 'page') -> wrap Document
        """
        page_docs = self.load_document(file_path)
        if not page_docs:
            return []

        split_docs: List[Document] = []
        for d in page_docs:
            chunks = self.text_splitter.split_text(d.page_content)
            for idx_in_page, chunk in enumerate(chunks):
                if not chunk.strip():
                    continue
                md = dict(metadata or {})
                md.update(
                    {
                        "document_id": document_id,
                        "source": file_path,
                        "page": d.metadata.get("page"),
                        "chunk_index": idx_in_page,
                    }
                )
                chunk_id = _hash_id(document_id, str(md.get("page")), str(idx_in_page), chunk)
                md["chunk_id"] = chunk_id

                split_docs.append(Document(page_content=chunk, metadata=md))

        return split_docs
