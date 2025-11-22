"""Simple in-memory rate limiting utilities for FastAPI endpoints."""

from __future__ import annotations

import asyncio
import time
from collections import deque
from typing import Callable, Deque, Dict

from fastapi import HTTPException, Request, status

IdentifierFn = Callable[[Request], str]


def _default_identifier(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "anonymous"


class RateLimiter:
    """Reusable dependency implementing a fixed window rate limiter."""

    def __init__(
        self,
        *,
        limit: int,
        window_seconds: int,
        identifier: IdentifierFn | None = None,
        error_detail: str | None = None,
    ) -> None:
        if limit <= 0 or window_seconds <= 0:
            raise ValueError("limit and window_seconds must be positive integers")
        self.limit = limit
        self.window_seconds = window_seconds
        self.identifier = identifier or _default_identifier
        self.error_detail = error_detail or "Too many requests. Please slow down."
        self._hits: Dict[str, Deque[float]] = {}
        self._lock: asyncio.Lock | None = None

    def _get_lock(self) -> asyncio.Lock:
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock

    async def __call__(self, request: Request) -> None:
        key = self.identifier(request)
        now = time.monotonic()
        window_start = now - self.window_seconds

        async with self._get_lock():
            bucket = self._hits.setdefault(key, deque())

            while bucket and bucket[0] <= window_start:
                bucket.popleft()

            if len(bucket) >= self.limit:
                retry_after = max(1, int(self.window_seconds - (now - bucket[0])))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=self.error_detail,
                    headers={"Retry-After": str(retry_after)},
                )

            bucket.append(now)
