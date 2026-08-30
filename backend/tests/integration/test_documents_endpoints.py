from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch

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
    db.execute_sp.return_value = [{
        'DocumentId': 7,
        'FileName': 'visit-note.pdf',
        'FileType': 'pdf',
        'FileSizeBytes': 2048,
        'UploadedOn': datetime(2026, 8, 29, tzinfo=timezone.utc),
    }]
    db.execute_sp_no_result.return_value = None
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


def test_list_documents_returns_200(client: TestClient, auth_headers: dict[str, str], mock_db: MagicMock) -> None:
    with _override_db(mock_db), patch('routers.documents_router.FileRepository', return_value=MagicMock()):
        response = client.get('/api/claims/claim-123/documents', headers=auth_headers)
    assert response.status_code == 200
    assert response.json()['documents'][0]['file_name'] == 'visit-note.pdf'


def test_upload_document_returns_201(client: TestClient, auth_headers: dict[str, str], mock_db: MagicMock) -> None:
    files_repo = MagicMock()
    files_repo.save.return_value = r'D:\PropelIQ_Explore_V1\uploads\claims\claim-123\doc.pdf'
    mock_db.execute_sp.side_effect = [[], [{'DocumentId': 9}]]

    with _override_db(mock_db), patch('routers.documents_router.FileRepository', return_value=files_repo):
        response = client.post(
            '/api/claims/claim-123/documents',
            files={'file': ('visit-note.pdf', b'pdf-bytes', 'application/pdf')},
            headers=auth_headers,
        )
    assert response.status_code == 201
    assert response.json()['document_id'] == 9


def test_upload_rejects_invalid_extension(client: TestClient, auth_headers: dict[str, str], mock_db: MagicMock) -> None:
    with _override_db(mock_db), patch('routers.documents_router.FileRepository', return_value=MagicMock()):
        response = client.post(
            '/api/claims/claim-123/documents',
            files={'file': ('script.exe', b'bad', 'application/octet-stream')},
            headers=auth_headers,
        )
    assert response.status_code == 422


def test_download_document_returns_file_response(client: TestClient, auth_headers: dict[str, str], mock_db: MagicMock) -> None:
    fixture_path = Path(__file__).with_name('download-fixture.txt')
    fixture_path.write_text('download-content', encoding='utf-8')
    files_repo = MagicMock()
    files_repo.exists.return_value = True
    mock_db.execute_sp.return_value = [{
        'DocumentId': 7,
        'FileName': 'download-fixture.txt',
        'FilePath': str(fixture_path),
        'FileType': 'txt',
        'FileSizeBytes': 16,
        'UploadedOn': datetime(2026, 8, 29, tzinfo=timezone.utc),
    }]

    try:
        with _override_db(mock_db), patch('routers.documents_router.FileRepository', return_value=files_repo):
            response = client.get('/api/claims/claim-123/documents/7/download', headers=auth_headers)
    finally:
        fixture_path.unlink(missing_ok=True)

    assert response.status_code == 200
    assert response.content == b'download-content'


def test_delete_document_returns_204(client: TestClient, auth_headers: dict[str, str], mock_db: MagicMock) -> None:
    files_repo = MagicMock()
    mock_db.execute_sp.return_value = [{
        'DocumentId': 7,
        'FileName': 'visit-note.pdf',
        'FilePath': r'D:\PropelIQ_Explore_V1\uploads\claims\claim-123\doc.pdf',
        'FileType': 'pdf',
        'FileSizeBytes': 2048,
        'UploadedOn': datetime(2026, 8, 29, tzinfo=timezone.utc),
    }]

    with _override_db(mock_db), patch('routers.documents_router.FileRepository', return_value=files_repo):
        response = client.delete('/api/claims/claim-123/documents/7', headers=auth_headers)
    assert response.status_code == 204
    files_repo.delete.assert_called_once()


def test_delete_document_returns_404_when_missing(client: TestClient, auth_headers: dict[str, str], mock_db: MagicMock) -> None:
    with _override_db(mock_db), patch('routers.documents_router.FileRepository', return_value=MagicMock()):
        mock_db.execute_sp.return_value = []
        response = client.delete('/api/claims/claim-123/documents/99', headers=auth_headers)
    assert response.status_code == 404


def test_documents_endpoints_require_auth(client: TestClient) -> None:
    response = client.get('/api/claims/claim-123/documents')
    assert response.status_code == 401
