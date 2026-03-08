"""Code playground endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect  # type: ignore[import]
from typing import Dict, Set, Optional
from pydantic import BaseModel, Field  # type: ignore[import]

import structlog  # type: ignore[import]

from src.api.middleware.auth import get_current_user  # type: ignore[import]
from src.services.sandbox.executor import CodeExecutor, Language  # type: ignore[import]
from src.services.sandbox.queue import ExecutionQueue  # type: ignore[import]

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1/playground", tags=["playground"])

# Global execution queue (in production, use dependency injection)
_executor = CodeExecutor()
_queue = ExecutionQueue(_executor)

# WebSocket connection manager for collab
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()
        self.active_connections[session_id].add(websocket)

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                self.active_connections.pop(session_id, None)

    async def broadcast(self, message: dict, session_id: str, exclude: WebSocket = None):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                if connection != exclude:
                    await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/collab/{session_id}")
async def collab_websocket(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for multiplayer code editing."""
    await manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_json()
            # Broadcast the change (cursor or code) to other clients in this session
            await manager.broadcast(data, session_id, exclude=websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        # Optional: broadcast disconnect event


import os

class AutocompleteRequest(BaseModel):
    code: str = Field(..., description="Current code in the editor")
    language: str = Field(..., description="Programming language")
    line: int = Field(..., description="Cursor line number (1-indexed)")
    column: int = Field(..., description="Cursor column number (1-indexed)")

class AutocompleteResponse(BaseModel):
    completion: str

@router.post("/autocomplete", response_model=AutocompleteResponse)
async def autocomplete(
    request: AutocompleteRequest,
    current_user: dict = Depends(get_current_user)
) -> AutocompleteResponse:
    """Provides inline code completions for Monaco editor."""
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")

    if api_key:
        try:
            from langchain_core.messages import HumanMessage, SystemMessage  # type: ignore[import]
            from langchain_openai import ChatOpenAI  # type: ignore[import]
            llm = ChatOpenAI(temperature=0.2, model="gpt-4o-mini", max_tokens=50)
            
            prompt = f"Provide a short inline code completion for the following {request.language} snippet exactly where the cursor is (Line {request.line}, Column {request.column}). Return ONLY the completion text (the characters that should be typed next), without any markdown backticks or explanations.\n\nCode:\n{request.code}"
            
            messages = [
                SystemMessage(content="You are a strict inline code autocomplete engine (like GitHub Copilot). You only output raw character completions. Do not use markdown."),
                HumanMessage(content=prompt)
            ]
            response = await llm.ainvoke(messages)
            return AutocompleteResponse(completion=str(response.content))  # type: ignore[call-arg]
        except Exception as e:
            logger.error("autocomplete_error", error=str(e))
            
    # Mock fallback
    lines = request.code.split('\n')
    if request.line <= len(lines):
        current_line = lines[request.line - 1]
        text_before_cursor = current_line[: request.column - 1]  # type: ignore[index]
        
        if "def " in text_before_cursor and text_before_cursor.endswith(":"):
            return AutocompleteResponse(completion="\n    pass")  # type: ignore[call-arg]
        elif "function" in text_before_cursor and text_before_cursor.endswith("{"):
            return AutocompleteResponse(completion="\n  // implementation here\n}")  # type: ignore[call-arg]
        elif text_before_cursor.strip().endswith("="):
            return AutocompleteResponse(completion=" None")  # type: ignore[call-arg]
    
    return AutocompleteResponse(completion="")  # type: ignore[call-arg]


class ExecuteCodeRequest(BaseModel):
    """Request for code execution."""

    code: str = Field(..., description="Code to execute", min_length=1, max_length=100000)
    language: str = Field(..., description="Programming language (python/javascript/typescript)")
    input_data: Optional[str] = Field(None, description="Optional stdin input")


class ExecuteCodeResponse(BaseModel):
    """Response for code execution."""

    request_id: str = Field(..., description="Execution request ID")
    stdout: str = Field(..., description="Standard output")
    stderr: str = Field(..., description="Standard error")
    exit_code: int = Field(..., description="Exit code")
    timed_out: bool = Field(..., description="Whether execution timed out")
    error: Optional[str] = Field(None, description="Error message if execution failed")


@router.post("/execute", response_model=ExecuteCodeResponse)
async def execute_code(
    request: ExecuteCodeRequest,
    current_user: dict = Depends(get_current_user),
) -> ExecuteCodeResponse:
    user_id = current_user.get("user_id", "unknown")
    """
    Execute code in sandboxed environment.

    - Supports Python, JavaScript, TypeScript
    - 30-second timeout
    - 512MB memory limit
    - Returns stdout, stderr, exit code
    """
    logger.info(
        "code_execution_requested",
        user_id=user_id,
        language=request.language,
        code_length=len(request.code),
    )

    # Validate language
    try:
        language = Language(request.language.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language: {request.language}. Supported: python, javascript, typescript",
        )

    try:
        # Start queue if not running
        if not _queue._worker_task or _queue._worker_task.done():
            await _queue.start()

        # Submit for execution
        request_id = await _queue.submit(
            code=request.code,
            language=language,
            input_data=request.input_data,
        )

        # Wait for result (with timeout)
        result = await _queue.get_result(request_id, timeout=60.0)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Execution timed out waiting for result",
            )

        logger.info(
            "code_execution_completed",
            user_id=user_id,
            request_id=request_id,
            exit_code=result.exit_code,
            timed_out=result.timed_out,
        )

        return ExecuteCodeResponse(
            request_id=request_id,  # type: ignore[call-arg]
            stdout=result.stdout,  # type: ignore[call-arg]
            stderr=result.stderr,  # type: ignore[call-arg]
            exit_code=result.exit_code,  # type: ignore[call-arg]
            timed_out=result.timed_out,  # type: ignore[call-arg]
            error=result.error,  # type: ignore[call-arg]
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        with open("error_trace.txt", "w") as f:
            f.write(traceback.format_exc())
        logger.error(
            "execution_endpoint_error",
            error=str(e),
            user_id=user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute code: {str(e)}",
        )
