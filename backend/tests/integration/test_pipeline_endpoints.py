from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from config import settings
from utils.jwt_utils import create_access_token


@pytest.fixture(scope='module')
def client() -> TestClient:
    from main import app
    return TestClient(app)


@pytest.fixture(scope='module')
def auth_headers() -> dict[str, str]:
    token = create_access_token({'sub': 'admin', 'userId': 1, 'role': 'Admin'})
    return {'Authorization': f'Bearer {token}'}


def _override_db(mock: MagicMock):
    from dependencies import get_db
    from main import app

    class _Context:
        def __enter__(self):
            app.dependency_overrides[get_db] = lambda: mock
            return self

        def __exit__(self, *_args):
            app.dependency_overrides.clear()

    return _Context()


def test_run_pipeline_requires_auth(client: TestClient) -> None:
    response = client.post('/api/claims/claim-1/run-pipeline')
    assert response.status_code == 401


def test_run_pipeline_returns_503_when_ai_unavailable(client: TestClient, auth_headers: dict[str, str], monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, 'OPENAI_API_KEY', '')
    monkeypatch.setattr(settings, 'AZURE_ENDPOINT', '')
    monkeypatch.setattr(settings, 'AZURE_API_KEY', '')
    response = client.post('/api/claims/claim-1/run-pipeline', headers=auth_headers)
    assert response.status_code == 503


def test_run_pipeline_returns_404_when_claim_missing(client: TestClient, auth_headers: dict[str, str], monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, 'OPENAI_API_KEY', 'configured')
    mock_db = MagicMock()
    mock_db.execute_sp_multi.return_value = []
    with _override_db(mock_db):
        response = client.post('/api/claims/missing-claim/run-pipeline', headers=auth_headers)
    assert response.status_code == 404


def test_pipeline_decision_rejects_invalid_decision(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post('/api/claims/claim-1/pipeline-decision?decision=nope', headers=auth_headers)
    assert response.status_code == 422


def test_pipeline_decision_returns_503_when_ai_unavailable(client: TestClient, auth_headers: dict[str, str], monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, 'OPENAI_API_KEY', '')
    monkeypatch.setattr(settings, 'AZURE_ENDPOINT', '')
    monkeypatch.setattr(settings, 'AZURE_API_KEY', '')
    response = client.post('/api/claims/claim-1/pipeline-decision?decision=approved', headers=auth_headers)
    assert response.status_code == 503
