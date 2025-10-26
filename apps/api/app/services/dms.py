"""Document management service stubs."""

from typing import Any

from fastapi import UploadFile


async def enqueue_document(file: UploadFile, uploaded_by: str) -> str:
    # TODO: store file metadata, trigger background processing
    return "job-123"


async def list_documents() -> list[dict[str, Any]]:
    # TODO: fetch from database
    return []
