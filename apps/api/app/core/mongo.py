"""MongoDB client utilities for chat persistence."""

from __future__ import annotations

from functools import lru_cache

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection, AsyncIOMotorDatabase

from .config import settings


@lru_cache(maxsize=1)
def get_mongo_client() -> AsyncIOMotorClient:
    """Return a singleton Motor client."""
    return AsyncIOMotorClient(settings.mongo_url)


def get_mongo_database() -> AsyncIOMotorDatabase:
    """Get the configured MongoDB database."""
    return get_mongo_client()[settings.mongo_db]


def get_chat_messages_collection() -> AsyncIOMotorCollection:
    """Chat messages (and embedded query logs) collection."""
    return get_mongo_database()[settings.mongo_chat_collection]


def get_chat_sessions_collection() -> AsyncIOMotorCollection:
    """Chat sessions collection (dual-write with Postgres)."""
    collection_name = getattr(settings, "mongo_session_collection", "chat_sessions")
    return get_mongo_database()[collection_name]


__all__ = [
    "get_mongo_client",
    "get_mongo_database",
    "get_chat_messages_collection",
    "get_chat_sessions_collection",
]
