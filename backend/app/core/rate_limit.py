"""In-memory sliding-window rate limiter (per client IP, per bucket).

Single-process by design; swap for Redis if the API ever runs on several hosts.
"""
import time
from collections import defaultdict, deque

from fastapi import Request

from app.core.errors import RateLimitedError


class RateLimiter:
    def __init__(self, clock=time.monotonic):
        self._hits: dict[tuple[str, str], deque[float]] = defaultdict(deque)
        self._clock = clock

    def check(self, bucket: str, client: str, limit_per_minute: int) -> None:
        if limit_per_minute <= 0:
            return
        now = self._clock()
        hits = self._hits[(bucket, client)]
        while hits and now - hits[0] > 60:
            hits.popleft()
        if len(hits) >= limit_per_minute:
            raise RateLimitedError("Too many requests. Please wait a moment and try again.")
        hits.append(now)


rate_limiter = RateLimiter()


def client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"
