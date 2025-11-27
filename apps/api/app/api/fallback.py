"""Fallback endpoints."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..core.users import get_current_user
from ..services import fallback

router = APIRouter()


class FallbackRequest(BaseModel):
    question: str
    reason: str
    channel: str | None = None


class FallbackResponse(BaseModel):
    """Response model for fallback trigger."""

    status: str = Field(..., description="Fallback status")


@router.post("/trigger", response_model=FallbackResponse)
async def trigger_fallback(
    payload: FallbackRequest, current_user=Depends(get_current_user)
) -> FallbackResponse:
    await fallback.log_event(
        question=payload.question,
        reason=payload.reason,
        channel=payload.channel,
        requested_by=current_user.username,
    )
    return FallbackResponse(status="logged")
