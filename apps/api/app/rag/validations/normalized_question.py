from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from .entity import Entity
from .intent import Intent


class NormalizedQuestion(BaseModel):
    original_question: str = Field(..., description="Original user question")
    normalized_question: str = Field(..., description="Normalized question after processing")
    intent: Optional[Intent] = Field(None, description="Detected intent")
    entities: List[Entity] = Field(default_factory=list, description="Extracted entities")
    language: str = Field(default="en", description="Detected language (e.g., 'en', 'vi')")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Processing metadata")
