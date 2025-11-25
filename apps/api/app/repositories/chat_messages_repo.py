"""Persistence helpers for chat messages (Mongo)."""

from __future__ import annotations

from typing import Any

from motor.motor_asyncio import AsyncIOMotorCollection


async def insert_messages(
    messages_coll: AsyncIOMotorCollection, docs: list[dict[str, Any]]
) -> None:
    await messages_coll.insert_many(docs)


async def find_history(
    messages_coll: AsyncIOMotorCollection, session_id: str, limit: int
) -> list[dict[str, Any]]:
    cursor = messages_coll.find({"sessionId": session_id}).sort("createdAt", -1).limit(limit)
    return await cursor.to_list(length=limit)


async def find_message(
    messages_coll: AsyncIOMotorCollection, query: dict[str, Any]
) -> dict[str, Any] | None:
    return await messages_coll.find_one(query)


async def update_message(
    messages_coll: AsyncIOMotorCollection, message_id: str, update_doc: dict[str, Any]
) -> None:
    await messages_coll.update_one({"_id": message_id}, {"$set": update_doc})


__all__ = ["insert_messages", "find_history", "find_message", "update_message"]
