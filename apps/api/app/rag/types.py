from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class MasterAnalysis(BaseModel):
    status: Literal["valid", "greeting", "blocked"] = Field(...)
    reason: Optional[Literal["toxic", "competitor", "irrelevant", "other"]] = Field(None)
    sub_questions: List[str] = Field(default_factory=list)
