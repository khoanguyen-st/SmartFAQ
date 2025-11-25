"""Chat-related constants."""

from __future__ import annotations

from app.models.chat import Channel, ChatRole

FEEDBACK_MESSAGES: dict[str, str] = {
    "en": "Feedback recorded. Thank you!",
    "vi": "Phản hồi của bạn đã được ghi nhận. Cảm ơn bạn!",
}

CHANNEL_CANONICAL = {channel.value for channel in Channel}

USER_ROLE = ChatRole.USER.value
ASSISTANT_ROLE = ChatRole.ASSISTANT.value

__all__ = [
    "FEEDBACK_MESSAGES",
    "CHANNEL_CANONICAL",
    "USER_ROLE",
    "ASSISTANT_ROLE",
]
