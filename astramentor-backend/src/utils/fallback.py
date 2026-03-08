"""Graceful degradation and fallback utilities."""

from typing import Any, Callable, Optional, TypeVar

import structlog

logger = structlog.get_logger(__name__)

T = TypeVar("T")


async def with_fallback(
    primary: Callable[[], T],
    fallback: Callable[[], T],
    operation_name: str = "operation",
) -> T:
    """
    Execute primary function with fallback on failure.

    Args:
        primary: Primary function to try
        fallback: Fallback function if primary fails
        operation_name: Name for logging

    Returns:
        Result from primary or fallback
    """
    try:
        result = await primary()
        return result

    except Exception as e:
        logger.warning(
            "primary_failed_using_fallback",
            operation=operation_name,
            error=str(e),
        )

        try:
            result = await fallback()
            logger.info("fallback_succeeded", operation=operation_name)
            return result

        except Exception as fallback_error:
            logger.error(
                "fallback_failed",
                operation=operation_name,
                error=str(fallback_error),
            )
            raise


async def with_optional_fallback(
    primary: Callable[[], T],
    fallback: Optional[Callable[[], T]] = None,
    default: Optional[T] = None,
    operation_name: str = "operation",
) -> Optional[T]:
    """
    Execute primary function with optional fallback or default.

    Args:
        primary: Primary function to try
        fallback: Optional fallback function
        default: Default value if both fail
        operation_name: Name for logging

    Returns:
        Result from primary, fallback, or default
    """
    try:
        result = await primary()
        return result

    except Exception as e:
        logger.warning(
            "primary_failed",
            operation=operation_name,
            error=str(e),
            has_fallback=fallback is not None,
        )

        if fallback:
            try:
                result = await fallback()
                logger.info("fallback_succeeded", operation=operation_name)
                return result

            except Exception as fallback_error:
                logger.error(
                    "fallback_failed",
                    operation=operation_name,
                    error=str(fallback_error),
                )

        logger.info("using_default", operation=operation_name, default=default)
        return default


class DegradedService:
    """Tracks service degradation state."""

    def __init__(self, service_name: str):
        """
        Initialize degraded service tracker.

        Args:
            service_name: Name of the service
        """
        self.service_name = service_name
        self.is_degraded = False
        self.degradation_reason: Optional[str] = None

    def mark_degraded(self, reason: str) -> None:
        """
        Mark service as degraded.

        Args:
            reason: Reason for degradation
        """
        if not self.is_degraded:
            self.is_degraded = True
            self.degradation_reason = reason
            logger.warning(
                "service_degraded",
                service=self.service_name,
                reason=reason,
            )

    def mark_healthy(self) -> None:
        """Mark service as healthy."""
        if self.is_degraded:
            self.is_degraded = False
            self.degradation_reason = None
            logger.info("service_recovered", service=self.service_name)

    def get_status(self) -> dict[str, Any]:
        """
        Get service status.

        Returns:
            Dictionary with status information
        """
        return {
            "service": self.service_name,
            "is_degraded": self.is_degraded,
            "reason": self.degradation_reason,
        }


# Specific fallback strategies for AstraMentor services


async def vector_search_with_fallback(
    vector_search_func: Callable,
    graph_search_func: Callable,
    query: str,
) -> Any:
    """
    Vector search with graph-only fallback.

    Args:
        vector_search_func: Primary vector search function
        graph_search_func: Fallback graph search function
        query: Search query

    Returns:
        Search results
    """
    return await with_fallback(
        primary=lambda: vector_search_func(query),
        fallback=lambda: graph_search_func(query),
        operation_name="vector_search",
    )


async def claude_sonnet_with_fallback(
    sonnet_func: Callable,
    haiku_func: Callable,
    prompt: str,
) -> Any:
    """
    Claude Sonnet with Haiku fallback.

    Args:
        sonnet_func: Primary Sonnet function
        haiku_func: Fallback Haiku function
        prompt: LLM prompt

    Returns:
        LLM response
    """
    return await with_fallback(
        primary=lambda: sonnet_func(prompt),
        fallback=lambda: haiku_func(prompt),
        operation_name="claude_invocation",
    )


async def redis_cache_with_fallback(
    cache_func: Callable,
    direct_func: Callable,
    key: str,
) -> Any:
    """
    Redis cache with direct computation fallback.

    Args:
        cache_func: Primary cache lookup function
        direct_func: Fallback direct computation function
        key: Cache key

    Returns:
        Cached or computed result
    """
    return await with_optional_fallback(
        primary=lambda: cache_func(key),
        fallback=lambda: direct_func(),
        default=None,
        operation_name="redis_cache",
    )
