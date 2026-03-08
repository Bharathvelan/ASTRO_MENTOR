"""Pydantic models for chat endpoints."""

from typing import Optional

from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    """Request for chat message."""

    session_id: str = Field(..., description="Session ID")
    message: str = Field(..., description="User message", min_length=1, max_length=10000)
    repo_id: Optional[str] = Field(None, description="Optional repository ID for context")


class ChatMessageResponse(BaseModel):
    """Response for chat message."""

    message_id: str = Field(..., description="Message ID")
    response: str = Field(..., description="Agent response")
    intent: str = Field(..., description="Detected intent (tutor/debugger/builder/verifier)")
    agent: str = Field(..., description="Agent that handled the request")
    tokens_used: int = Field(..., description="Tokens used in generation")
    latency_ms: float = Field(..., description="Response latency in milliseconds")
