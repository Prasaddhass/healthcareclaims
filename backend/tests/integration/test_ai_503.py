from __future__ import annotations

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


def test_suggest_codes_returns_503_without_credentials(client: TestClient, auth_headers: dict[str, str], monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, 'OPENAI_API_KEY', '')
    monkeypatch.setattr(settings, 'AZURE_ENDPOINT', '')
    monkeypatch.setattr(settings, 'AZURE_API_KEY', '')
    response = client.post('/api/ai/suggest-codes', json={'description': 'annual wellness visit', 'code_type': 'ICD'}, headers=auth_headers)
    assert response.status_code == 503
