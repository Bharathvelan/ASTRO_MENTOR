"""Tests for /api/v1/leaderboard endpoints."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.middleware.auth import get_current_user

FAKE_USER = {"user_id": "test_user_123", "email": "tester@example.com", "name": "Tester"}


async def override_auth():
    return FAKE_USER


@pytest.fixture
def client():
    from src.api.routes.leaderboard import router
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_current_user] = override_auth
    return TestClient(app)


@pytest.fixture
def leaderboard_data():
    from src.api.routes.leaderboard import MOCK_LEADERBOARD
    return MOCK_LEADERBOARD


class TestGetLeaderboard:
    def test_returns_200(self, client):
        assert client.get("/api/v1/leaderboard").status_code == 200

    def test_returns_list(self, client):
        assert isinstance(client.get("/api/v1/leaderboard").json(), list)

    def test_has_required_fields(self, client):
        required = {"rank", "user_id", "username", "score", "challenges_completed", "xp_total", "avg_time_seconds"}
        for entry in client.get("/api/v1/leaderboard").json():
            assert required.issubset(set(entry.keys()))

    def test_ranks_are_unique(self, client):
        ranks = [e["rank"] for e in client.get("/api/v1/leaderboard").json()]
        assert len(ranks) == len(set(ranks))

    def test_ranks_sorted_ascending(self, client):
        ranks = [e["rank"] for e in client.get("/api/v1/leaderboard").json()]
        assert ranks == sorted(ranks)

    def test_limit_param_respected(self, client):
        assert len(client.get("/api/v1/leaderboard?limit=5").json()) <= 5

    def test_default_returns_all_entries(self, client, leaderboard_data):
        assert len(client.get("/api/v1/leaderboard").json()) == len(leaderboard_data)

    def test_xp_totals_are_positive(self, client):
        assert all(e["xp_total"] > 0 for e in client.get("/api/v1/leaderboard").json())

    def test_has_at_least_10_entries(self, client):
        assert len(client.get("/api/v1/leaderboard").json()) >= 10

    def test_scores_non_negative(self, client):
        assert all(e["score"] >= 0 for e in client.get("/api/v1/leaderboard").json())

    def test_first_has_highest_score(self, client):
        data = client.get("/api/v1/leaderboard").json()
        if len(data) >= 2:
            assert data[0]["score"] >= data[1]["score"]
