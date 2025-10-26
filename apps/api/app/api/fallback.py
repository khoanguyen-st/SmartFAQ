"""Fallback endpoints."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..core.users import get_current_user
from ..services import fallback

router = APIRouter()


class FallbackRequest(BaseModel):
    question: str
    reason: str
    channel: str | None = None


@router.post("/trigger")
async def trigger_fallback(payload: FallbackRequest, current_user=Depends(get_current_user)) -> dict[str, str]:
    await fallback.log_event(
        question=payload.question,
        reason=payload.reason,
        channel=payload.channel,
        requested_by=current_user.username,
    )
    return {"status": "logged"}
