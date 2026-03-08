"""Pydantic models for repository endpoints."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class IndexingStatus(str, Enum):
    """Repository indexing status."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class RepositoryUploadResponse(BaseModel):
    """Response for repository upload."""

    id: str = Field(..., description="Repository ID")
    name: str = Field(..., description="Repository name")
    status: IndexingStatus = Field(..., description="Indexing status")
    message: str = Field(..., description="Status message")


class RepositoryStatusResponse(BaseModel):
    """Response for repository status."""

    id: str = Field(..., description="Repository ID")
    name: str = Field(..., description="Repository name")
    status: IndexingStatus = Field(..., description="Indexing status")
    progress: float = Field(..., description="Indexing progress (0-100)")
    file_count: int = Field(..., description="Total files in repository")
    indexed_count: int = Field(..., description="Files indexed so far")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    error_message: Optional[str] = Field(None, description="Error message if failed")


class RepositoryDeleteResponse(BaseModel):
    """Response for repository deletion."""

    id: str = Field(..., description="Repository ID")
    message: str = Field(..., description="Deletion status message")
