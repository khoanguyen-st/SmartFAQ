from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class IntentResult(BaseModel):
    is_greeting: bool = False


SUPPORTED_INTENTS = {
    "ask_admission_process",
    "ask_tuition_fee",
    "ask_scholarship",
    "ask_major_info",
    "ask_deadline",
    "ask_requirements",
    "ask_campus",
    "ask_contact",
    "greeting",
    "non_rag",
    "out_of_scope",
    "other",
}

BLACKLIST_KEYWORDS = [
    "duy tan",
    "dtu",
    "dt university",
    "dai hoc duy tan",
    "fpt",
    "fpt university",
    "dai hoc fpt",
    "rmit",
    "dai hoc rmit",
    "ton duc thang",
    "tdtu",
    "hutech",
    "van lang",
    "kinh te",
    "ueh",
    "neu",
    "ftu",
    "ngoai thuong",
    "bach khoa",
    "hust",
    "hcmut",
    "nhan van",
    "ussh",
    "su pham",
    "y duoc",
    "ngoai ngu",
    "ulis",
    "hanu",
    "dai hoc nn",
    "thoi tiet",
    "weather",
    "code",
    "java code",
]


class Intent(BaseModel):
    label: str = Field(..., description="Intent label (e.g., 'ask_tuition_fee')")
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: Optional[str] = None
    language: str = "en"
    metadata: dict = Field(default_factory=dict)


class Entity(BaseModel):
    type: str
    value: str
    confidence: float = 0.0
    start_pos: Optional[int] = None
    end_pos: Optional[int] = None


class GuardrailResponse(BaseModel):
    """Model cho phản hồi từ Guardrail Check"""

    status: str
    reason_code: Optional[str] = None
    reason_desc: Optional[str] = None
