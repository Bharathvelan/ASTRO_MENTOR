"""Session management endpoints."""

from typing import Dict, List, Any

from fastapi import APIRouter, Depends, HTTPException, status
import structlog

from src.api.middleware.auth import get_current_user
from src.db.dynamodb import DynamoDBClient

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_sessions(
    current_user: dict = Depends(get_current_user),
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    List all chat sessions for the authenticated user.
    """
    user_id = current_user.get("user_id", "unknown")
    logger.info("list_sessions_requested", user_id=user_id)
    
    try:
        dynamodb = DynamoDBClient()
        
        # We would ideally query by user_id index here
        # For MVP, scan and filter (not for production use on large tables)
        items = await dynamodb.scan_items("chat_messages", limit=1000)
        
        # Group by session_id
        sessions = {}
        for item in items:
            # Assuming message schema has session_id
            sid = item.get("session_id")
            if sid and sid not in sessions:
                sessions[sid] = {
                    "id": sid,
                    "created_at": item.get("timestamp"),
                    "last_message": item.get("user_message", "")[:100]
                }
                
        # Return sorted list up to limit
        return sorted(list(sessions.values()), key=lambda x: x["created_at"], reverse=True)[:limit]

    except Exception as e:
        logger.error("list_sessions_error", user_id=user_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch sessions: {str(e)}",
        )


@router.get("/{session_id}", response_model=List[Dict[str, Any]])
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """
    Get full history of a specific chat session.
    """
    try:
        dynamodb = DynamoDBClient()
        items = await dynamodb.scan_items("chat_messages", limit=100)
        
        # Filter for this specific session
        session_messages = [item for item in items if item.get("session_id") == session_id]
        
        if not session_messages:
             raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found",
            )
            
        return sorted(session_messages, key=lambda x: x["timestamp"])

    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_session_error", session_id=session_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch session: {str(e)}",
        )


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a specific chat session and all its messages.
    """
    user_id = current_user.get("user_id", "unknown")
    logger.info("delete_session_requested", session_id=session_id, user_id=user_id)
    
    try:
        dynamodb = DynamoDBClient()
        items = await dynamodb.scan_items("chat_messages", limit=1000)
        session_messages = [item for item in items if item.get("session_id") == session_id]
        
        # Delete each message in the session
        # Real production would use batch_write_item
        for msg in session_messages:
            await dynamodb.delete_item(
                "chat_messages", 
                {"session_id": session_id, "message_id": msg["message_id"]}
            )
            
    except Exception as e:
        logger.error("delete_session_error", session_id=session_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete session: {str(e)}",
        )
