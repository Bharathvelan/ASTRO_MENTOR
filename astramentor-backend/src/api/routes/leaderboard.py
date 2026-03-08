"""Leaderboard API endpoints — sorted by score descending."""

from typing import List, Dict, Any

from fastapi import APIRouter, Depends
import structlog

from src.api.middleware.auth import get_current_user

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1/leaderboard", tags=["leaderboard"])

# Stored in arbitrary order; we sort at query time for correctness
MOCK_LEADERBOARD = [
    {"rank": 1, "user_id": "usr_001", "username": "AlgoMaster99", "score": 24250, "challenges_completed": 242, "xp_total": 24250, "avg_time_seconds": 280},
    {"rank": 2, "user_id": "usr_002", "username": "CodeNinja_IIT", "score": 21800, "challenges_completed": 218, "xp_total": 21800, "avg_time_seconds": 320},
    {"rank": 3, "user_id": "usr_003", "username": "ByteForce_NIT", "score": 19500, "challenges_completed": 195, "xp_total": 19500, "avg_time_seconds": 350},
    {"rank": 4, "user_id": "usr_004", "username": "PythonPro_BITS", "score": 18200, "challenges_completed": 182, "xp_total": 18200, "avg_time_seconds": 410},
    {"rank": 5, "user_id": "usr_005", "username": "DevStar_IIIT", "score": 16400, "challenges_completed": 164, "xp_total": 16400, "avg_time_seconds": 430},
    {"rank": 6, "user_id": "usr_006", "username": "JSGuru_VIT", "score": 15100, "challenges_completed": 151, "xp_total": 15100, "avg_time_seconds": 480},
    {"rank": 7, "user_id": "usr_007", "username": "RecursionKing", "score": 13700, "challenges_completed": 137, "xp_total": 13700, "avg_time_seconds": 510},
    {"rank": 8, "user_id": "usr_008", "username": "TreeTraversal", "score": 12100, "challenges_completed": 121, "xp_total": 12100, "avg_time_seconds": 540},
    {"rank": 9, "user_id": "usr_009", "username": "DynamicDP", "score": 11300, "challenges_completed": 113, "xp_total": 11300, "avg_time_seconds": 580},
    {"rank": 10, "user_id": "usr_010", "username": "GraphWalker", "score": 10200, "challenges_completed": 102, "xp_total": 10200, "avg_time_seconds": 620},
    {"rank": 11, "user_id": "usr_011", "username": "AsyncAce", "score": 8900, "challenges_completed": 89, "xp_total": 8900, "avg_time_seconds": 660},
    {"rank": 12, "user_id": "usr_012", "username": "SortingHat", "score": 7600, "challenges_completed": 76, "xp_total": 7600, "avg_time_seconds": 700},
    {"rank": 13, "user_id": "usr_013", "username": "HashMapHero", "score": 6400, "challenges_completed": 64, "xp_total": 6400, "avg_time_seconds": 750},
    {"rank": 14, "user_id": "usr_014", "username": "BitShifter", "score": 5100, "challenges_completed": 51, "xp_total": 5100, "avg_time_seconds": 800},
    {"rank": 15, "user_id": "unknown", "username": "You", "score": 3200, "challenges_completed": 32, "xp_total": 3200, "avg_time_seconds": 920},
]


@router.get("", response_model=List[Dict[str, Any]])
async def get_leaderboard(
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    """
    Get the global leaderboard rankings sorted by score descending.
    """
    logger.info("leaderboard_requested", limit=limit)

    # Always sort descending so rank is deterministic
    sorted_board = sorted(MOCK_LEADERBOARD, key=lambda e: e["score"], reverse=True)
    # Re-compute rank after sort
    ranked = [{**entry, "rank": i + 1} for i, entry in enumerate(sorted_board)]

    return ranked[:limit]
