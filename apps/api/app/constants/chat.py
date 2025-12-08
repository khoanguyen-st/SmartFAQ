from __future__ import annotations

from enum import Enum

from ..models.chat import Channel, ChatRole, Language


class FeedbackStatus(str, Enum):
    UP = "up"
    DOWN = "down"
    RESET = "reset"


FEEDBACK_MESSAGES: dict[str, str] = {
    "en": "Feedback recorded. Thank you!",
    "vi": "Phản hồi của bạn đã được ghi nhận. Cảm ơn bạn!",
}

CHANNEL_CANONICAL = {channel.value for channel in Channel}
CHATROLE = {role.value: role for role in ChatRole}
LANGUAGE_CANONICAL = {language.value for language in Language}

__all__ = [
    "FEEDBACK_MESSAGES",
    "CHANNEL_CANONICAL",
    "CHATROLE",
    "LANGUAGE_CANONICAL",
    "FeedbackStatus",
]
