"""Redis-backed job queue helper.

In Phase 10 the queue swaps to SQS; this module is the only place callers
talk to Redis, so the swap is mechanical.
"""

import redis as _redis

from .constants import QUEUE_PENDING


def make_redis(url: str) -> _redis.Redis:
    return _redis.from_url(url, decode_responses=True)


def push_job(client: _redis.Redis, payload: str) -> None:
    """LPUSH a job JSON payload onto the pending queue."""
    client.lpush(QUEUE_PENDING, payload)


def pop_job(client: _redis.Redis, timeout: int = 0) -> str | None:
    """BRPOP a job JSON payload (blocking). Returns None on timeout."""
    result = client.brpop(QUEUE_PENDING, timeout=timeout)
    return result[1] if result else None
