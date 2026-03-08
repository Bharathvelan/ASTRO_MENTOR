"""Tests for /api/v1/challenges endpoints."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.middleware.auth import get_current_user

FAKE_USER = {"user_id": "test_user_123", "email": "tester@example.com", "name": "Tester"}


async def override_auth():
    return FAKE_USER


@pytest.fixture
def client():
    from src.api.routes.challenges import router
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_current_user] = override_auth
    return TestClient(app)


@pytest.fixture
def challenges():
    from src.api.routes.challenges import MOCK_CHALLENGES
    return MOCK_CHALLENGES


class TestListChallenges:
    def test_returns_200(self, client):
        assert client.get("/api/v1/challenges").status_code == 200

    def test_returns_list(self, client):
        data = client.get("/api/v1/challenges").json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_has_required_fields(self, client):
        data = client.get("/api/v1/challenges").json()
        required = {"id", "title", "difficulty", "language", "topic", "xp_reward", "time_limit_minutes"}
        for challenge in data:
            assert required.issubset(set(challenge.keys()))

    def test_filter_by_difficulty(self, client):
        data = client.get("/api/v1/challenges?difficulty=beginner").json()
        assert all(c["difficulty"] == "beginner" for c in data)

    def test_filter_by_language(self, client):
        data = client.get("/api/v1/challenges?language=python").json()
        assert all(c["language"] == "python" for c in data)

    def test_all_difficulties_present(self, client):
        data = client.get("/api/v1/challenges").json()
        difficulties = {c["difficulty"] for c in data}
        assert {"beginner", "intermediate", "advanced"}.issubset(difficulties)

    def test_covers_multiple_languages(self, client):
        data = client.get("/api/v1/challenges").json()
        assert len({c["language"] for c in data}) >= 2

    def test_xp_rewards_are_positive(self, client):
        assert all(c["xp_reward"] > 0 for c in client.get("/api/v1/challenges").json())

    def test_at_least_12_challenges(self, client):
        assert len(client.get("/api/v1/challenges").json()) >= 12


class TestGetChallenge:
    def test_returns_200_for_valid_id(self, client, challenges):
        assert client.get(f"/api/v1/challenges/{challenges[0]['id']}").status_code == 200

    def test_returns_correct_challenge(self, client, challenges):
        chal = challenges[2]
        data = client.get(f"/api/v1/challenges/{chal['id']}").json()
        assert data["id"] == chal["id"]

    def test_returns_404_for_unknown_id(self, client):
        assert client.get("/api/v1/challenges/nonexistent_xyz").status_code == 404

    def test_has_starter_code(self, client, challenges):
        data = client.get(f"/api/v1/challenges/{challenges[0]['id']}").json()
        assert "starter_code" in data and len(data["starter_code"]) > 0

    def test_has_hints(self, client, challenges):
        data = client.get(f"/api/v1/challenges/{challenges[0]['id']}").json()
        assert len(data.get("hints", [])) >= 2


class TestSubmitChallenge:
    def test_submit_returns_200(self, client, challenges):
        assert client.post("/api/v1/challenges/submit", json={
            "challenge_id": challenges[0]["id"], "code": "return True", "language": "python",
        }).status_code == 200

    def test_submit_response_shape(self, client, challenges):
        data = client.post("/api/v1/challenges/submit", json={
            "challenge_id": challenges[0]["id"], "code": "x=1", "language": "python",
        }).json()
        assert {"passed", "score", "xp_earned", "test_results", "feedback"}.issubset(data.keys())

    def test_submit_types_correct(self, client, challenges):
        data = client.post("/api/v1/challenges/submit", json={
            "challenge_id": challenges[0]["id"], "code": "def f(): return True", "language": "python",
        }).json()
        assert isinstance(data["passed"], bool)
        assert 0 <= data["score"] <= 100

    def test_submit_404_for_bad_id(self, client):
        assert client.post("/api/v1/challenges/submit", json={
            "challenge_id": "bad_id", "code": "x = 1", "language": "python",
        }).status_code == 404


class TestChallengeHints:
    def test_get_first_hint(self, client, challenges):
        resp = client.get(f"/api/v1/challenges/{challenges[0]['id']}/hints/0")
        assert resp.status_code == 200
        assert "hint" in resp.json()

    def test_invalid_hint_index_returns_400(self, client, challenges):
        assert client.get(f"/api/v1/challenges/{challenges[0]['id']}/hints/999").status_code == 400
