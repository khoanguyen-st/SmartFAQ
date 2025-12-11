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

MISSING_INFO_PHRASES = [
    "không được đề cập",
    "không có thông tin",
    "không tìm thấy thông tin",
    "not mentioned",
    "not contain information",
    "could not find information",
]

__all__ = [
    "FEEDBACK_MESSAGES",
    "CHANNEL_CANONICAL",
    "CHATROLE",
    "LANGUAGE_CANONICAL",
    "FeedbackStatus",
    "MISSING_INFO_PHRASES",
]
