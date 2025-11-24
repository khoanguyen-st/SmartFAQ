"""Database session dependency for FastAPI."""
from __future__ import annotations

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from .config import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .config import settings

engine = create_engine(settings.database_url, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def _ensure_async_driver(url: str) -> str:
    """
    Convert sync psycopg DSN into its async variant when needed.
    SQLAlchemy async engine requires the ``psycopg_async`` driver suffix.
    """
    prefix = "postgresql+psycopg://"
    async_prefix = "postgresql+psycopg_async://"
    if url.startswith(async_prefix):
        return url
    if url.startswith(prefix):
        return url.replace(prefix, async_prefix, 1)
    return url


ASYNC_DATABASE_URL = _ensure_async_driver(settings.database_url)
engine: AsyncEngine = create_async_engine(
    ASYNC_DATABASE_URL,
    future=True,
    pool_pre_ping=True,
)
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async database session."""
    async with AsyncSessionLocal() as session:
        yield session
<<<<<<< HEAD
__all__ = ["engine", "AsyncSessionLocal", "get_db"]
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
=======


__all__ = ["engine", "AsyncSessionLocal", "get_db"]
>>>>>>> c9830a2e982ac42f9012c4efa52f1e2f36fc456a
