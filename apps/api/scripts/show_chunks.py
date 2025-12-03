from __future__ import annotations

import argparse
from textwrap import indent, shorten

from app.rag.vector_store import VectorStore


def fmt(md: dict, key: str) -> str:
    val = md.get(key)
    return str(val) if val is not None else "-"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Inspect stored chunks and metadata from the vector store."
    )
    parser.add_argument(
        "--document-id",
        help="Filter by document_id metadata",
        default=None,
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=50,
        help="Max number of chunks to display (default: 50)",
    )
    parser.add_argument(
        "--preview-len",
        type=int,
        default=160,
        help="Max length of text preview per chunk (default: 160 chars)",
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Show full chunk text instead of a shortened preview",
    )
    args = parser.parse_args()

    vs = VectorStore()
    docs = vs.get_all_documents(limit=args.limit)
    if args.document_id:
        docs = [d for d in docs if (d.metadata or {}).get("document_id") == args.document_id]

    if not docs:
        print("No chunks found.")
        return

    print(f"Showing {len(docs)} chunk(s)")
    for i, d in enumerate(docs, start=1):
        md = d.metadata or {}
        text_raw = d.page_content.strip()
        text_preview = (
            text_raw
            if args.full
            else shorten(text_raw.replace("\n", " "), width=args.preview_len, placeholder="...")
        )
        header = [
            f"Chunk {i}",
            f"  document_id: {fmt(md, 'document_id')}",
            f"  chunk_id   : {fmt(md, 'chunk_id')}",
            f"  page       : {fmt(md, 'page')}",
            f"  chunk_index: {fmt(md, 'chunk_index')}",
            f"  element    : {fmt(md, 'element_type')}",
            f"  heading    : {fmt(md, 'heading')}",
            f"  source     : {fmt(md, 'source')}",
        ]
        print("\n".join(header))
        print("  text:")
        print(indent(text_preview if text_preview else "<empty>", "    "))
        print("-" * 60)


if __name__ == "__main__":
    main()
