"""Integration tests for JWT auth middleware — 9 tests."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from jose import jwt


TEST_SECRET = "test-secret-for-middleware-tests-32c"
TEST_ALG    = "HS256"
MOCK_S      = type("S", (), {
    "JWT_SECRET_KEY":  TEST_SECRET,
    "JWT_ALGORITHM":   TEST_ALG,
    "JWT_EXPIRY_HOURS": 8,
})()


def _valid_token() -> str:
    payload = {
        "sub": "admin", "userId": 1, "role": "Admin",
        "exp": datetime.now(timezone.utc) + timedelta(hours=8),
    }
    return jwt.encode(payload, TEST_SECRET, algorithm=TEST_ALG)


def _expired_token() -> str:
    payload = {
        "sub": "admin", "userId": 1, "role": "Admin",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
    }
    return jwt.encode(payload, TEST_SECRET, algorithm=TEST_ALG)


@pytest.fixture(scope="module")
def client() -> TestClient:
    from main import app
    return TestClient(app)


def test_no_token_returns_401(client: TestClient) -> None:
    r = client.get("/api/claims")
    assert r.status_code == 401


def test_no_token_detail_not_authenticated(client: TestClient) -> None:
    r = client.get("/api/claims")
    assert r.status_code == 401
    # OAuth2PasswordBearer sets "Not authenticated" when token is missing
    assert r.json()["detail"] == "Not authenticated"


@patch("utils.jwt_utils.settings", MOCK_S)
def test_expired_token_returns_401(client: TestClient) -> None:
    r = client.get("/api/claims", headers={"Authorization": f"Bearer {_expired_token()}"})
    assert r.status_code == 401


@patch("utils.jwt_utils.settings", MOCK_S)
def test_tampered_token_returns_401_invalid(client: TestClient) -> None:
    tampered = _valid_token()[:-5] + "ZZZZZ"
    r = client.get("/api/claims", headers={"Authorization": f"Bearer {tampered}"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Invalid token"


@patch("utils.jwt_utils.settings", MOCK_S)
def test_valid_token_returns_200(client: TestClient) -> None:
    r = client.get("/api/claims", headers={"Authorization": f"Bearer {_valid_token()}"})
    assert r.status_code == 200


def test_login_does_not_require_token(client: TestClient) -> None:
    """Login endpoint must be public — should not return 401 from missing auth header."""
    mock_db = MagicMock()
    mock_db.execute_sp.return_value = [{"UserId": 1, "Username": "admin", "Role": "Admin"}]
    with patch("routers.auth_router.get_db", return_value=mock_db), \
         patch("utils.jwt_utils.settings", MOCK_S):
        r = client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
    assert r.status_code == 200  # not 401


def test_logout_requires_token(client: TestClient) -> None:
    r = client.post("/api/auth/logout")
    assert r.status_code == 401


def test_analytics_requires_token(client: TestClient) -> None:
    r = client.get("/api/analytics/summary")
    assert r.status_code == 401


def test_401_does_not_expose_internals(client: TestClient) -> None:
    r = client.get("/api/claims")
    body = r.text.lower()
    for forbidden in ["traceback", "pyodbc", "sqlalchemy"]:
        assert forbidden not in body
