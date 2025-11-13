from __future__ import annotations

from typing import Any, Dict

from pydantic import BaseModel, Field


class Intent(BaseModel):
    label: str = Field(..., description="Intent label (e.g., 'ask_admission_process')")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score [0.0, 1.0]")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
