"""Request timeout middleware."""

import asyncio
from typing import Optional

from fastapi import HTTPException, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

import structlog

logger = structlog.get_logger(__name__)


class TimeoutMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce request timeouts."""

    def __init__(
        self,
        app: ASGIApp,
        timeout_seconds: float = 30.0,
        exclude_paths: Optional[list[str]] = None,
    ):
        """
        Initialize timeout middleware.

        Args:
            app: ASGI application
            timeout_seconds: Request timeout in seconds (default: 30s)
            exclude_paths: List of paths to exclude from timeout (e.g., streaming endpoints)
        """
        super().__init__(app)
        self.timeout_seconds = timeout_seconds
        self.exclude_paths = exclude_paths or []

    async def dispatch(self, request: Request, call_next):
        """Enforce timeout on request processing."""
        # Check if path is excluded
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        try:
            # Process request with timeout
            response: Response = await asyncio.wait_for(
                call_next(request),
                timeout=self.timeout_seconds,
            )

            return response

        except asyncio.TimeoutError:
            logger.warning(
                "request_timeout",
                path=request.url.path,
                method=request.method,
                timeout_seconds=self.timeout_seconds,
            )

            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"Request timed out after {self.timeout_seconds} seconds",
            )


async def with_timeout(coro, timeout_seconds: float, operation_name: str = "operation"):
    """
    Execute coroutine with timeout.

    Args:
        coro: Coroutine to execute
        timeout_seconds: Timeout in seconds
        operation_name: Name for logging

    Returns:
        Coroutine result

    Raises:
        TimeoutError: If operation times out
    """
    try:
        result = await asyncio.wait_for(coro, timeout=timeout_seconds)
        return result

    except asyncio.TimeoutError:
        logger.warning(
            "operation_timeout",
            operation=operation_name,
            timeout_seconds=timeout_seconds,
        )
        raise TimeoutError(f"{operation_name} timed out after {timeout_seconds} seconds")
