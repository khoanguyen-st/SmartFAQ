"""Fallback service stubs."""

from typing import Optional


async def should_trigger(confidence: int, attempts: int) -> bool:
    return confidence < 60 or attempts >= 3


async def log_event(question: str, reason: str, channel: Optional[str], requested_by: str) -> None:
    # TODO: persist fallback log and notify channel
    _ = (question, reason, channel, requested_by)
