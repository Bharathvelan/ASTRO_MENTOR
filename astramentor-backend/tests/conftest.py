"""Shared pytest fixtures for AstraMentor backend tests."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from src.api.main import app


def _mock_get_current_user():
    """Return a fake authenticated user."""
    return {"user_id": "test_user_123", "email": "test@astramentor.io", "name": "Test User"}


@pytest.fixture
def client():
    """
    TestClient with auth middleware bypassed.
    We patch `get_current_user` so that all routes believe a user is logged in.
    """
    with patch(
        "src.api.middleware.auth.get_current_user",
        return_value=_mock_get_current_user(),
    ):
        with TestClient(app) as c:
            yield c


@pytest.fixture
def auth_headers():
    """Fake JWT Authorization header (not validated in tests)."""
    return {"Authorization": "Bearer test_token_for_testing"}
