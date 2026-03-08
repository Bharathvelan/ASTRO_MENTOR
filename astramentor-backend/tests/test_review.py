"""Tests for /api/v1/review endpoints."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.middleware.auth import get_current_user

FAKE_USER = {"user_id": "test_user_123", "email": "tester@example.com", "name": "Tester"}

GOOD_CODE = '''\
def add_numbers(a: int, b: int) -> int:
    """Add two integers and return the result."""
    # Perform addition
    return a + b
'''

BAD_CODE = '''\
x = eval(input())
password = "super_secret_123"
for i in range(100):
    for j in range(100):
        for k in range(100):
            for m in range(100):
                y = x + i + j + k + m
'''


async def override_auth():
    return FAKE_USER


@pytest.fixture
def client():
    from src.api.routes.review import router
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_current_user] = override_auth
    return TestClient(app)


class TestReviewHealth:
    def test_health_returns_200(self, client):
        assert client.get("/api/v1/review/health").status_code == 200

    def test_health_response_shape(self, client):
        data = client.get("/api/v1/review/health").json()
        assert data.get("status") == "ok"
        assert "service" in data


class TestAnalyzeCode:
    def test_returns_200(self, client):
        assert client.post("/api/v1/review/analyze", json={"code": GOOD_CODE, "language": "python"}).status_code == 200

    def test_response_has_all_fields(self, client):
        data = client.post("/api/v1/review/analyze", json={"code": GOOD_CODE, "language": "python"}).json()
        required = {
            "overall_score", "quality_score", "security_score", "performance_score",
            "style_score", "issues", "suggestions", "security_issues", "metrics", "summary",
        }
        assert required.issubset(set(data.keys()))

    def test_scores_in_range(self, client):
        data = client.post("/api/v1/review/analyze", json={"code": GOOD_CODE, "language": "python"}).json()
        for f in ("overall_score", "quality_score", "security_score", "performance_score", "style_score"):
            assert 0 <= data[f] <= 100, f"{f}={data[f]}"

    def test_good_scores_higher_than_bad(self, client):
        good = client.post("/api/v1/review/analyze", json={"code": GOOD_CODE, "language": "python"}).json()
        bad = client.post("/api/v1/review/analyze", json={"code": BAD_CODE, "language": "python"}).json()
        assert good["overall_score"] > bad["overall_score"]

    def test_bad_code_has_security_issues(self, client):
        data = client.post("/api/v1/review/analyze", json={"code": BAD_CODE, "language": "python"}).json()
        assert len(data["security_issues"]) > 0

    def test_bad_code_has_low_security_score(self, client):
        data = client.post("/api/v1/review/analyze", json={"code": BAD_CODE, "language": "python"}).json()
        assert data["security_score"] < 60

    def test_issues_is_list(self, client):
        data = client.post("/api/v1/review/analyze", json={"code": "x = 1", "language": "python"}).json()
        assert isinstance(data["issues"], list)

    def test_metrics_line_count_positive(self, client):
        data = client.post("/api/v1/review/analyze", json={"code": GOOD_CODE, "language": "python"}).json()
        assert data["metrics"]["lines_of_code"] > 0

    def test_summary_is_string(self, client):
        data = client.post("/api/v1/review/analyze", json={"code": GOOD_CODE, "language": "python"}).json()
        assert isinstance(data["summary"], str) and len(data["summary"]) > 0

    def test_javascript_code_works(self, client):
        assert client.post("/api/v1/review/analyze", json={
            "code": "function add(a, b) { // ok\n  return a + b;\n}", "language": "javascript",
        }).status_code == 200

    def test_typescript_code_works(self, client):
        assert client.post("/api/v1/review/analyze", json={
            "code": "const fn = (x: number): number => x * 2;", "language": "typescript",
        }).status_code == 200
