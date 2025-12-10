"""Redis caching utilities for API responses."""

import json
import logging
from typing import Any, Optional

import redis.asyncio as redis
from redis.asyncio import Redis

from .config import get_settings

logger = logging.getLogger(__name__)


class CacheService:
    """Redis-based caching service for API responses."""

    def __init__(self):
        """Initialize cache service."""
        self._redis: Optional[Redis] = None

    async def get_redis(self) -> Redis:
        """Get or create Redis connection."""
        if self._redis is None:
            settings = get_settings()
            # Extract host and port from CELERY_BROKER_URL
            # Format: redis://host:port/db
            broker_url = settings.CELERY_BROKER_URL
            if broker_url.startswith("redis://"):
                broker_url = broker_url.replace("redis://", "")
                if "/" in broker_url:
                    broker_url = broker_url.split("/")[0]
                parts = broker_url.split(":")
                host = parts[0] if parts else "localhost"
                port = int(parts[1]) if len(parts) > 1 else 6379
            else:
                host = "localhost"
                port = 6379

            self._redis = await redis.Redis(
                host=host,
                port=port,
                db=1,  # Use DB 1 for cache (DB 0 for Celery)
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
            )
            logger.info(f"Connected to Redis at {host}:{port} (db=1)")

        return self._redis

    async def get(self, key: str) -> Optional[Any]:
        """
        Get cached value.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found
        """
        try:
            redis_client = await self.get_redis()
            value = await redis_client.get(key)
            if value:
                logger.debug(f"Cache HIT: {key}")
                return json.loads(value)
            logger.debug(f"Cache MISS: {key}")
            return None
        except Exception as e:
            logger.error(f"Cache GET error for key {key}: {e}")
            return None

    async def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """
        Set cached value with TTL.

        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl: Time to live in seconds (default: 5 minutes)

        Returns:
            True if successful, False otherwise
        """
        try:
            redis_client = await self.get_redis()
            serialized = json.dumps(value, ensure_ascii=False, default=str)
            await redis_client.setex(key, ttl, serialized)
            logger.debug(f"Cache SET: {key} (ttl={ttl}s)")
            return True
        except Exception as e:
            logger.error(f"Cache SET error for key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """
        Delete cached value.

        Args:
            key: Cache key

        Returns:
            True if deleted, False otherwise
        """
        try:
            redis_client = await self.get_redis()
            await redis_client.delete(key)
            logger.debug(f"Cache DELETE: {key}")
            return True
        except Exception as e:
            logger.error(f"Cache DELETE error for key {key}: {e}")
            return False

    async def clear_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching pattern.

        Args:
            pattern: Redis key pattern (e.g., "faq:*")

        Returns:
            Number of keys deleted
        """
        try:
            redis_client = await self.get_redis()
            keys = await redis_client.keys(pattern)
            if keys:
                deleted = await redis_client.delete(*keys)
                logger.info(f"Cache CLEAR pattern '{pattern}': {deleted} keys deleted")
                return deleted
            return 0
        except Exception as e:
            logger.error(f"Cache CLEAR pattern error for {pattern}: {e}")
            return 0

    async def close(self):
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            logger.info("Redis connection closed")


# Global cache instance
_cache_service: Optional[CacheService] = None


def get_cache_service() -> CacheService:
    """Get global cache service instance."""
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service
