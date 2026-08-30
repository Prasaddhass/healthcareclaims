"""Integration tests for the health check and basic app startup — US-TECH-02."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client() -> TestClient:
    from main import app
    return TestClient(app)


def test_health_check_returns_200(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200


def test_health_check_response_body(client: TestClient) -> None:
    response = client.get("/")
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert isinstance(data["version"], str)


def test_docs_available_in_dev(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """OpenAPI docs should be available when ENV != 'production'."""
    # TestClient is created with ENV=development (default)
    response = client.get("/docs")
    assert response.status_code == 200


def test_cors_allows_frontend_origin(client: TestClient) -> None:
    response = client.options(
        "/",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
