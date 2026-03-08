"""Execution queue manager for code execution requests."""

import asyncio
import uuid
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Set, Any

import structlog

from src.services.sandbox.executor import CodeExecutor, ExecutionResult, Language

logger = structlog.get_logger(__name__)


class ExecutionStatus(str, Enum):
    """Status of execution request."""

    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"


@dataclass
class ExecutionRequest:
    """Execution request in queue."""

    id: str
    code: str
    language: Language
    input_data: Optional[str]
    status: ExecutionStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Optional[ExecutionResult] = None


class ExecutionQueue:
    """Manages queue of code execution requests."""

    def __init__(self, executor: CodeExecutor, max_concurrent: int = 3):
        """
        Initialize execution queue.

        Args:
            executor: CodeExecutor instance
            max_concurrent: Maximum concurrent executions (default: 3)
        """
        self.executor = executor
        self.max_concurrent = max_concurrent
        self._queue: asyncio.Queue[ExecutionRequest] = asyncio.Queue()
        self._requests: Dict[str, ExecutionRequest] = {}
        self._futures: Dict[str, Any] = {}
        self._running: Set[str] = set()
        self._worker_task: Optional[asyncio.Task[Any]] = None
        self._shutdown = False

    async def start(self) -> None:
        """Start queue worker."""
        task = self._worker_task
        if task is None or task.done():
            self._shutdown = False
            self._worker_task = asyncio.create_task(self._worker())
            logger.info("execution_queue_started", max_concurrent=self.max_concurrent)

    async def stop(self) -> None:
        """Stop queue worker."""
        self._shutdown = True
        task = self._worker_task
        if task is not None:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        logger.info("execution_queue_stopped")

    async def submit(
        self, code: str, language: Language, input_data: Optional[str] = None
    ) -> str:
        """
        Submit code for execution.

        Args:
            code: Source code
            language: Programming language
            input_data: Optional stdin input

        Returns:
            Request ID for tracking
        """
        request_id = str(uuid.uuid4())
        request = ExecutionRequest(
            id=request_id,
            code=code,
            language=language,
            input_data=input_data,
            status=ExecutionStatus.QUEUED,
            created_at=datetime.utcnow(),
        )

        self._requests[request_id] = request
        self._futures[request_id] = asyncio.Future()
        await self._queue.put(request)

        logger.info(
            "execution_queued",
            request_id=request_id,
            language=language,
            queue_size=self._queue.qsize(),
        )

        return request_id

    async def get_status(self, request_id: str) -> Optional[ExecutionRequest]:
        """
        Get status of execution request.

        Args:
            request_id: Request ID

        Returns:
            ExecutionRequest or None if not found
        """
        return self._requests.get(request_id)

    async def get_result(self, request_id: str, timeout: float = 60.0) -> Optional[ExecutionResult]:
        """
        Wait for execution result.

        Args:
            request_id: Request ID
            timeout: Maximum wait time in seconds

        Returns:
            ExecutionResult or None if timeout/not found
        """
        future = self._futures.get(request_id)
        if not future:
            request = self._requests.get(request_id)
            if request and request.result:
                return request.result
            return None

        try:
            return await asyncio.wait_for(future, timeout=timeout)
        except asyncio.TimeoutError:
            logger.warning("get_result_timeout", request_id=request_id)
            return None

    async def _worker(self) -> None:
        """Worker that processes execution queue."""
        logger.info("execution_worker_started")

        while not self._shutdown:
            try:
                # Wait for request
                request = await asyncio.wait_for(self._queue.get(), timeout=1.0)

                # Wait if at max concurrent
                while len(self._running) >= self.max_concurrent:
                    await asyncio.sleep(0.1)

                # Execute in background
                asyncio.create_task(self._execute_request(request))

            except asyncio.TimeoutError:
                # No requests, continue
                continue
            except Exception as e:
                logger.error("worker_error", error=str(e))
                await asyncio.sleep(1.0)

        logger.info("execution_worker_stopped")

    async def _execute_request(self, request: ExecutionRequest) -> None:
        """
        Execute a single request.

        Args:
            request: ExecutionRequest to execute
        """
        request_id = request.id
        self._running.add(request_id)

        try:
            # Update status
            request.status = ExecutionStatus.RUNNING
            request.started_at = datetime.utcnow()

            logger.info(
                "execution_started",
                request_id=request_id,
                language=request.language,
                running_count=len(self._running),
            )

            # Execute code
            result = await self.executor.execute(
                request.code, request.language, request.input_data
            )

            # Update request
            request.result = result
            request.completed_at = datetime.utcnow()

            if result.timed_out:
                request.status = ExecutionStatus.TIMEOUT
            elif result.error or result.exit_code != 0:
                request.status = ExecutionStatus.FAILED
            else:
                request.status = ExecutionStatus.COMPLETED

            duration = 0.0
            started = request.started_at
            completed = request.completed_at
            if started is not None and completed is not None:
                duration = (completed - started).total_seconds()

            logger.info(
                "execution_completed",
                request_id=request_id,
                status=request.status,
                exit_code=result.exit_code,
                duration=duration,
            )

        except Exception as e:
            logger.error("execution_exception", request_id=request_id, error=str(e))
            request.status = ExecutionStatus.FAILED
            request.completed_at = datetime.utcnow()
            request.result = ExecutionResult(
                stdout="",
                stderr=f"Execution exception: {str(e)}",
                exit_code=-1,
                timed_out=False,
                error=str(e),
            )

        finally:
            self._running.discard(request_id)
            future = self._futures.pop(request_id, None)
            if future and not future.done():
                future.set_result(request.result)
