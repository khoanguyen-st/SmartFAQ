from typing import List, Optional

from pydantic import BaseModel


class DocumentCreate(BaseModel):
    title: str
    category: Optional[str] = None
    tags: Optional[str] = None
    language: str = "en"


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    language: Optional[str] = None
    # `status` is managed by the system and cannot be set by users.


class DocumentVersionOut(BaseModel):
    id: int
    version_no: int
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    format: Optional[str] = None
    created_at: Optional[str] = None


class DocumentOut(BaseModel):
    id: int
    title: str
    category: Optional[str] = None
    tags: Optional[str] = None
    language: str
    status: str
    current_version_id: Optional[int] = None
    current_file_size: Optional[int] = None
    current_format: Optional[str] = None
    versions: List[DocumentVersionOut] = []

    class Config:
        try:
            from_attributes = True
        except Exception:
            orm_mode = True
