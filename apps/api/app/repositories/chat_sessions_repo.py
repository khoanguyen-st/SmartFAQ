"""Persistence helpers for chat sessions."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import ChatSession


async def get_session(db: AsyncSession, session_id: str) -> ChatSession | None:
    return await db.get(ChatSession, session_id)


async def add_session(db: AsyncSession, session: ChatSession) -> None:
    db.add(session)


def update_session_timestamp(session: ChatSession, dt) -> None:
    session.updated_at = dt


__all__ = ["get_session", "add_session", "update_session_timestamp"]
