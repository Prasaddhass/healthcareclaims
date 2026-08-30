from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from utils.jwt_utils import create_access_token


@pytest.fixture(scope='module')
def client() -> TestClient:
    from main import app
    return TestClient(app)


@pytest.fixture(scope='module')
def auth_headers() -> dict[str, str]:
    token = create_access_token({'sub': 'admin', 'userId': 1, 'role': 'Admin'})
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture()
def mock_db() -> MagicMock:
    db = MagicMock()
    db.execute_sp_multi.return_value = [
        [{'TotalClaims': 120, 'ClaimsThisWeek': 12, 'ClaimsThisMonth': 48, 'ValidatedClaims': 70, 'SentClaims': 35}],
        [{'Year': 2026, 'Period': 35, 'ClaimCount': 12}, {'Year': 2026, 'Period': 36, 'ClaimCount': 18}],
        [{'ValidationStatus': 'Draft', 'Count': 10}, {'ValidationStatus': 'Validated', 'Count': 30}],
    ]
    db.execute_sp.return_value = [{
        'ClaimId': 'claim-1',
        'PatientId': 'John Doe',
        'InsuranceName': 'Blue Cross',
        'PolicyId': 'POL-1',
        'ValidationStatus': 'Pending',
        'CreatedOn': datetime(2026, 8, 29, tzinfo=timezone.utc),
        'UpdatedOn': None,
        'SentOn': None,
    }]
    return db


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


def test_summary_returns_data(client: TestClient, auth_headers: dict[str, str], mock_db: MagicMock) -> None:
    with _override_db(mock_db):
        response = client.get('/api/analytics/summary', headers=auth_headers)
    assert response.status_code == 200
    assert response.json()['total_claims'] == 120


def test_summary_requires_auth(client: TestClient) -> None:
    response = client.get('/api/analytics/summary')
    assert response.status_code == 401


def test_claims_by_period_returns_week_labels(client: TestClient, auth_headers: dict[str, str], mock_db: MagicMock) -> None:
    with _override_db(mock_db):
        response = client.get('/api/analytics/claims-by-period?period=week', headers=auth_headers)
    assert response.status_code == 200
    assert response.json()['data'][0]['label'].startswith('Wk 35')


def test_claims_by_period_rejects_invalid_period(client: TestClient, auth_headers: dict[str, str], mock_db: MagicMock) -> None:
    with _override_db(mock_db):
        response = client.get('/api/analytics/claims-by-period?period=year', headers=auth_headers)
    assert response.status_code == 422


def test_status_distribution_returns_percentages(client: TestClient, auth_headers: dict[str, str], mock_db: MagicMock) -> None:
    with _override_db(mock_db):
        response = client.get('/api/analytics/status-distribution', headers=auth_headers)
    assert response.status_code == 200
    assert response.json()['data'][0]['percentage'] == 25.0


def test_recent_claims_returns_rows(client: TestClient, auth_headers: dict[str, str], mock_db: MagicMock) -> None:
    with _override_db(mock_db):
        response = client.get('/api/analytics/recent-claims', headers=auth_headers)
    assert response.status_code == 200
    assert response.json()['claims'][0]['claim_id'] == 'claim-1'
