"""Rate limiting middleware using Redis."""

import time

from fastapi import HTTPException, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

import structlog

from src.db.redis import RedisClient

logger = structlog.get_logger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce rate limiting per user."""

    def __init__(
        self,
        app: ASGIApp,
        redis_client: RedisClient,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
    ):
        """
        Initialize rate limit middleware.

        Args:
            app: ASGI application
            redis_client: Redis client for rate limit tracking
            requests_per_minute: Max requests per minute per user
            requests_per_hour: Max requests per hour per user
        """
        super().__init__(app)
        self.redis = redis_client
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour

    async def dispatch(self, request: Request, call_next):
        """Check rate limits before processing request."""
        # Extract user ID from request state (set by auth middleware)
        user_id = getattr(request.state, "user_id", None)

        if not user_id:
            # No user ID, skip rate limiting (e.g., public endpoints)
            return await call_next(request)

        # Check rate limits
        try:
            allowed, retry_after = await self._check_rate_limit(user_id)

            if not allowed:
                logger.warning(
                    "rate_limit_exceeded",
                    user_id=user_id,
                    path=request.url.path,
                    retry_after=retry_after,
                )

                # Return 429 Too Many Requests
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please try again later.",
                    headers={"Retry-After": str(retry_after)},
                )

            # Process request
            response: Response = await call_next(request)

            # Add rate limit headers
            response.headers["X-RateLimit-Limit-Minute"] = str(self.requests_per_minute)
            response.headers["X-RateLimit-Limit-Hour"] = str(self.requests_per_hour)

            return response

        except HTTPException:
            raise
        except Exception as e:
            logger.error("rate_limit_error", error=str(e), user_id=user_id)
            # On error, allow request (fail open)
            return await call_next(request)

    async def _check_rate_limit(self, user_id: str) -> tuple[bool, int]:
        """
        Check if user has exceeded rate limits.

        Args:
            user_id: User identifier

        Returns:
            Tuple of (allowed, retry_after_seconds)
        """
        current_time = int(time.time())

        # Check minute limit
        minute_key = f"rate_limit:minute:{user_id}:{current_time // 60}"
        minute_count = await self._increment_counter(minute_key, ttl=60)

        if minute_count > self.requests_per_minute:
            retry_after = 60 - (current_time % 60)
            return False, retry_after

        # Check hour limit
        hour_key = f"rate_limit:hour:{user_id}:{current_time // 3600}"
        hour_count = await self._increment_counter(hour_key, ttl=3600)

        if hour_count > self.requests_per_hour:
            retry_after = 3600 - (current_time % 3600)
            return False, retry_after

        return True, 0

    async def _increment_counter(self, key: str, ttl: int) -> int:
        """
        Increment Redis counter with TTL.

        Args:
            key: Redis key
            ttl: Time to live in seconds

        Returns:
            Current count
        """
        try:
            # Increment counter
            count = await self.redis.incr(key)

            # Set TTL on first increment
            if count == 1:
                await self.redis.expire(key, ttl)

            return count

        except Exception as e:
            logger.error("redis_increment_error", error=str(e), key=key)
            # On error, return 0 (allow request)
            return 0


class RateLimiter:
    """Rate limiter utility for manual rate limiting."""

    def __init__(self, redis_client: RedisClient):
        """
        Initialize rate limiter.

        Args:
            redis_client: Redis client
        """
        self.redis = redis_client

    async def check_limit(
        self,
        key: str,
        max_requests: int,
        window_seconds: int,
    ) -> tuple[bool, int]:
        """
        Check rate limit for a key.

        Args:
            key: Rate limit key
            max_requests: Maximum requests allowed
            window_seconds: Time window in seconds

        Returns:
            Tuple of (allowed, remaining_requests)
        """
        current_time = int(time.time())
        window_key = f"rate_limit:{key}:{current_time // window_seconds}"

        try:
            # Get current count
            count_str = await self.redis.get(window_key)
            count = int(count_str) if count_str else 0

            if count >= max_requests:
                return False, 0

            # Increment
            new_count = await self.redis.incr(window_key)

            # Set TTL on first increment
            if new_count == 1:
                await self.redis.expire(window_key, window_seconds)

            remaining = max(0, max_requests - new_count)
            return True, remaining

        except Exception as e:
            logger.error("rate_limit_check_error", error=str(e), key=key)
            # On error, allow request
            return True, max_requests

    async def reset_limit(self, key: str) -> None:
        """
        Reset rate limit for a key.

        Args:
            key: Rate limit key
        """
        try:
            # Delete all keys matching pattern
            pattern = f"rate_limit:{key}:*"
            keys = await self.redis.keys(pattern)
            if keys:
                await self.redis.delete(*keys)

            logger.info("rate_limit_reset", key=key)

        except Exception as e:
            logger.error("rate_limit_reset_error", error=str(e), key=key)
