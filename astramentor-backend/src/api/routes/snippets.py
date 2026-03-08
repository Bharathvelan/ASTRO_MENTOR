"""User code snippets management endpoints."""

from typing import Dict, List, Any
import uuid
import time

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
import structlog

from src.api.middleware.auth import get_current_user
from src.db.dynamodb import DynamoDBClient

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1/snippets", tags=["snippets"])


class SnippetCreateRequest(BaseModel):
    title: str = Field(..., max_length=100)
    language: str = Field(..., max_length=20)
    code: str = Field(..., max_length=10000)
    description: str = Field(None, max_length=500)


@router.get("", response_model=List[Dict[str, Any]])
async def list_snippets(
    current_user: dict = Depends(get_current_user),
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    List all saved code snippets for the authenticated user.
    """
    user_id = current_user.get("user_id", "unknown")
    
    try:
        dynamodb = DynamoDBClient()
        
        # Similar index issue as sessions, scanning for MVP
        items = await dynamodb.scan_items("user_snippets", limit=1000)
        
        user_snippets = [
            item for item in items 
            if item.get("user_id") == user_id
        ]
        
        return sorted(user_snippets, key=lambda x: x["created_at"], reverse=True)[:limit]

    except Exception as e:
        logger.error("list_snippets_error", user_id=user_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch snippets: {str(e)}",
        )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_snippet(
    request: SnippetCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Save a new code snippet.
    """
    user_id = current_user.get("user_id", "unknown")
    
    try:
        dynamodb = DynamoDBClient()
        snippet_id = str(uuid.uuid4())
        
        item = {
            "snippet_id": snippet_id,
            "user_id": user_id,
            "title": request.title,
            "language": request.language,
            "code": request.code,
            "description": request.description or "",
            "created_at": int(time.time()),
        }
        
        await dynamodb.put_item(table_name="user_snippets", item=item)
        return item

    except Exception as e:
        logger.error("create_snippet_error", user_id=user_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save snippet: {str(e)}",
        )


@router.delete("/{snippet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_snippet(
    snippet_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a saved code snippet.
    """
    user_id = current_user.get("user_id", "unknown")
    
    try:
        dynamodb = DynamoDBClient()
        # Ensure snippet belongs to user before deletion
        items = await dynamodb.scan_items("user_snippets", limit=1000)
        user_snippets = [
            item for item in items 
            if item.get("user_id") == user_id and item.get("snippet_id") == snippet_id
        ]
        
        if not user_snippets:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Snippet not found or unauthorized",
            )
            
        await dynamodb.delete_item(
            "user_snippets", 
            {"snippet_id": snippet_id, "user_id": user_id}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("delete_snippet_error", snippet_id=snippet_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete snippet: {str(e)}",
        )
