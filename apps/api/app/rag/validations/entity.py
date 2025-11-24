from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class Entity(BaseModel):
    type: str = Field(..., description="Entity type (e.g., 'program', 'semester')")
    value: str = Field(..., description="Extracted entity value")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score [0.0, 1.0]")
    start_pos: Optional[int] = Field(None, description="Start position in original text")
    end_pos: Optional[int] = Field(None, description="End position in original text")
