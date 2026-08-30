"""Integration tests for /api/auth/login and /logout — 11 tests."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client() -> TestClient:
    from main import app
    return TestClient(app)


ADMIN_ROW = {"UserId": 1, "Username": "admin", "Role": "Admin"}


def _mock_db(return_row: dict | None):
    db = MagicMock()
    db.execute_sp.return_value = [return_row] if return_row else []
    return db


# ── Valid credentials ────────────────────────────────────────────────────────

def test_valid_credentials_return_200(client: TestClient) -> None:
    with patch("routers.auth_router.get_db", return_value=_mock_db(ADMIN_ROW)):
        r = client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
    assert r.status_code == 200


def test_response_has_access_token(client: TestClient) -> None:
    with patch("routers.auth_router.get_db", return_value=_mock_db(ADMIN_ROW)):
        r = client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
    data = r.json()
    assert "access_token" in data
    assert len(data["access_token"]) > 10


def test_response_token_type_is_bearer(client: TestClient) -> None:
    with patch("routers.auth_router.get_db", return_value=_mock_db(ADMIN_ROW)):
        r = client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
    assert r.json()["token_type"] == "bearer"


def test_response_user_matches_db_row(client: TestClient) -> None:
    with patch("routers.auth_router.get_db", return_value=_mock_db(ADMIN_ROW)):
        r = client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
    user = r.json()["user"]
    assert user["username"] == "admin"
    assert user["role"]     == "Admin"
    assert user["user_id"]  == 1


# ── Invalid credentials ───────────────────────────────────────────────────────

def test_wrong_password_returns_401(client: TestClient) -> None:
    with patch("routers.auth_router.get_db", return_value=_mock_db(None)):
        r = client.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
    assert r.status_code == 401


def test_wrong_password_generic_message(client: TestClient) -> None:
    with patch("routers.auth_router.get_db", return_value=_mock_db(None)):
        r = client.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
    assert r.json() == {"detail": "Invalid username or password"}


def test_unknown_user_same_401_message(client: TestClient) -> None:
    with patch("routers.auth_router.get_db", return_value=_mock_db(None)):
        r = client.post("/api/auth/login", json={"username": "ghost", "password": "x"})
    assert r.status_code == 401
    assert r.json() == {"detail": "Invalid username or password"}


# ── Validation ───────────────────────────────────────────────────────────────

def test_missing_username_returns_422(client: TestClient) -> None:
    r = client.post("/api/auth/login", json={"password": "admin"})
    assert r.status_code == 422


def test_missing_password_returns_422(client: TestClient) -> None:
    r = client.post("/api/auth/login", json={"username": "admin"})
    assert r.status_code == 422


def test_login_does_not_require_auth_header(client: TestClient) -> None:
    """Login endpoint must NOT require Authorization header."""
    with patch("routers.auth_router.get_db", return_value=_mock_db(ADMIN_ROW)):
        r = client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
    assert r.status_code == 200  # not 401


# ── DB error ─────────────────────────────────────────────────────────────────

def test_db_error_returns_500_without_internals(client: TestClient) -> None:
    import pyodbc
    from dependencies import get_db
    from main import app

    def broken_db():
        db = MagicMock()
        db.execute_sp.side_effect = pyodbc.Error("42000", "mock DB error")
        return db

    app.dependency_overrides[get_db] = broken_db
    try:
        r = client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
    finally:
        app.dependency_overrides.clear()

    assert r.status_code == 500
    body_text = r.json()["detail"].lower()
    assert "pyodbc"    not in body_text
    assert "sql"       not in body_text
    assert r.json()["detail"] == "An error occurred"
