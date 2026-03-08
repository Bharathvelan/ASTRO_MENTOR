"""Progress tracking endpoints — IRT-based with XP/level/badge system."""

from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy.orm import Session
import asyncio
import structlog

from src.api.middleware.auth import get_current_user
from src.db.base import get_db
from src.services.irt.engine import IRTEngine

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1/progress", tags=["progress"])


# ── Schema ──────────────────────────────────────────────────────────────────

class ProgressUpdateParams(BaseModel):
    topic_id: str
    difficulty: float
    is_correct: bool


# ── Helpers ──────────────────────────────────────────────────────────────────

def _compute_level(total_xp: int) -> Dict[str, Any]:
    """
    Level-up formula inspired by MMO RPG exponential XP curves.
    Level 1 starts at 0 XP; each level requires 20% more XP than the previous.
    References: Yannakakis & Togelius (2018), IEEE Trans. Games.
    """
    xp_per_level = [0, 0, 200, 500, 900, 1400, 2000, 2700, 3600, 4700, 6000]
    level = 1
    for threshold in xp_per_level[1:]:  # type: ignore[index]
        if total_xp >= threshold:
            level += 1
        else:
            break
    level = min(level, 10)

    xp_for_this = xp_per_level[level - 1] if level <= len(xp_per_level) else xp_per_level[-1]
    xp_for_next = xp_per_level[level] if level < len(xp_per_level) else xp_per_level[-1] + 2000
    xp_in_level = total_xp - xp_for_this
    xp_needed = xp_for_next - xp_for_this
    progress_pct = int((xp_in_level / max(xp_needed, 1)) * 100)

    LEVEL_NAMES = {
        1: "Code Initiate", 2: "Bug Hunter", 3: "Algorithm Apprentice",
        4: "Function Wizard", 5: "Class Architect", 6: "System Designer",
        7: "Data Sage", 8: "Async Master", 9: "Graph Oracle", 10: "Polyglot Legend",
    }
    return {
        "level": level,
        "level_name": LEVEL_NAMES.get(level, "Legend"),
        "xp_for_next_level": xp_for_next,
        "progress_percent": progress_pct,
    }


def _compute_badges(total_xp: int, challenges_solved: int, streak_days: int) -> list[str]:
    """Award achievement badges based on milestones."""
    badges = []
    if challenges_solved >= 1:
        badges.append("First Challenge")
    if challenges_solved >= 10:
        badges.append("Dedicated Coder")
    if challenges_solved >= 50:
        badges.append("Challenge Veteran")
    if streak_days >= 3:
        badges.append("3-Day Streak")
    if streak_days >= 7:
        badges.append("Week Warrior")
    if total_xp >= 500:
        badges.append("XP Hunter")
    if total_xp >= 2000:
        badges.append("XP Collector")
    return badges


# ── Mock stats (swapped for DB in production) ────────────────────────────────

_MOCK_STATS = {
    "total_xp": 1250,
    "challenges_solved": 14,
    "streak_days": 5,
    "accuracy_rate": 0.72,
}


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=Dict[str, Any])
async def get_progress_stats(
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Lightweight stats endpoint for sidebar/dashboard widgets.
    Returns total_xp, level, level_name, streak_days, challenges_solved, badges.
    """
    user_id = current_user.get("user_id", "unknown")
    logger.info("progress_stats_requested", user_id=user_id)

    stats = _MOCK_STATS
    level_info = _compute_level(int(stats["total_xp"]))
    badges = _compute_badges(int(stats["total_xp"]), int(stats["challenges_solved"]), int(stats["streak_days"]))

    return {
        "user_id": user_id,
        "total_xp": stats["total_xp"],
        "challenges_solved": stats["challenges_solved"],
        "streak_days": stats["streak_days"],
        "accuracy_rate": stats["accuracy_rate"],
        "badges": badges,
        **level_info,
    }


@router.websocket("/ws/stats")
async def progress_websocket(websocket: WebSocket):
    """WebSocket endpoint for live progress statistics."""
    await websocket.accept()
    try:
        while True:
            # In a real app, you'd subscribe to a Redis channel or DB updates.
            # Here we just emit the latest stats periodically.
            stats = _MOCK_STATS
            level_info = _compute_level(int(stats["total_xp"]))
            badges = _compute_badges(int(stats["total_xp"]), int(stats["challenges_solved"]), int(stats["streak_days"]))
            
            payload = {
                "type": "stats_update",
                "data": {
                    "total_xp": stats["total_xp"],
                    "challenges_solved": stats["challenges_solved"],
                    "streak_days": stats["streak_days"],
                    "accuracy_rate": stats["accuracy_rate"],
                    "badges": badges,
                    **level_info,
                }
            }
            
            await websocket.send_json(payload)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        pass
        
    except Exception as e:
        logger.error("websocket_stats_error", error=str(e))


@router.get("", response_model=Dict[str, Any])
async def get_user_progress(
    _db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get user's current skill levels calculated via IRT Engine.
    """
    user_id = current_user.get("user_id", "unknown")
    logger.info("get_progress_requested", user_id=user_id)

    try:
        irt_engine = IRTEngine(_db)
        profile = irt_engine.get_user_profile(user_id)

        if not profile:
            return {
                "skills": {},
                "overall_level": "Beginner",
                "skill_levels": {},
                "completed_topics": [],
                "total_questions_answered": 0,
                "accuracy_rate": 0.0,
                "last_updated": "",
                "user_id": user_id,
            }

        return {
            "user_id": user_id,
            "overall_level": profile.overall_ability,
            "skills": profile.topic_abilities,
            "skill_levels": profile.topic_abilities,
            "completed_topics": [],
            "total_questions_answered": 0,
            "accuracy_rate": 0.0,
            "last_updated": "",
        }

    except Exception as e:
        logger.error("get_progress_error", user_id=user_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch progress: {str(e)}",
        )


@router.post("/update")
async def update_user_progress(
    params: ProgressUpdateParams,
    _db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Update a user's IRT skill profile based on a question attempt.
    """
    user_id = current_user.get("user_id", "unknown")
    logger.info(
        "update_progress_requested",
        user_id=user_id,
        topic=params.topic_id,
        correct=params.is_correct,
    )

    try:
        irt_engine = IRTEngine(_db)
        irt_engine.process_interaction(
            user_id=user_id,
            topic=params.topic_id,
            difficulty=params.difficulty,
            discrimination=1.0,
            guessing=0.2,
            is_correct=params.is_correct,
        )
        return {"status": "success"}

    except Exception as e:
        logger.error("update_progress_error", user_id=user_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update progress: {str(e)}",
        )
