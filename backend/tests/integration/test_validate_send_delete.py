"""Integration tests for validate / send / delete endpoints — 12 tests."""
from __future__ import annotations

import uuid
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from utils.jwt_utils import create_access_token


@pytest.fixture(scope="module")
def client() -> TestClient:
    from main import app
    return TestClient(app)


@pytest.fixture(scope="module")
def auth_headers() -> dict:
    token = create_access_token({"sub": "admin", "userId": 1, "role": "Admin"})
    return {"Authorization": f"Bearer {token}"}


CLAIM_ID = str(uuid.uuid4())

VALID_HEADER = {
    "ClaimId":             CLAIM_ID,
    "ValidationStatus":    "Pending",
    "PatientName":         "Doe, John",
    "PatientBirthDate":    "01/15/80",
    "PatientSex":          "M",
    "InsuredPolicyNumber": "POL-123",
    "PatientRelationship": "Self",
    "FederalTaxId":        "123456789",
    "BillingProviderName": "Acme Medical",
    "BillingProviderNPI":  "1234567890",
    "AcceptAssignment":    "YES",
    "TotalCharge":         "150.00",
    "ReferringProviderNPI": None,
    "ServiceFacilityNPI":  None,
    "HospitalizationFrom": None,
    "HospitalizationTo":   None,
    "UnableToWorkFrom":    None,
    "UnableToWorkTo":      None,
}


def _mock_db_valid(status: str = "Pending") -> MagicMock:
    db = MagicMock()
    hdr = {**VALID_HEADER, "ValidationStatus": status}
    db.execute_sp.return_value = [{
        "ClaimId":          CLAIM_ID,
        "ValidationStatus": status,
        "TotalCount":       1,
        "CreatedOn":        None,
        "UpdatedOn":        None,
        "SentOn":           None,
        "PatientId":        "Doe, John",
        "InsuranceName":    "Acme Medical",
        "PolicyId":         "POL-123",
    }]
    db.execute_sp_multi.return_value = [
        [hdr],
        [{"DiagnosisId": str(uuid.uuid4()), "ClaimId": CLAIM_ID,
          "Pointer": "A", "IcdCode": "Z00.00", "Sequence": 1}],
        [{"ServiceLineId": str(uuid.uuid4()), "ClaimId": CLAIM_ID,
          "LineSequence": 1, "ProcedureCode": "A1234", "LineCharge": 150.0,
          "ServiceDateFrom": None, "ServiceDateTo": None, "PlaceOfService": None,
          "EmgIndicator": False, "DiagnosisPointer": None, "DaysUnits": None,
          "EpsdtFamilyPlan": None, "IdQualifier": None, "RenderingProviderId": None}],
        [],
    ]
    db.execute_sp_no_result.return_value = None
    return db


def _override_db(mock: MagicMock):
    from main import app
    from dependencies import get_db

    class _Ctx:
        def __enter__(self):
            app.dependency_overrides[get_db] = lambda: mock
            return self

        def __exit__(self, *_):
            app.dependency_overrides.clear()

    return _Ctx()


# ── Validate — pass ───────────────────────────────────────────────────────────

def test_validate_pass_returns_200(client, auth_headers):
    with _override_db(_mock_db_valid()):
        r = client.post(f"/api/claims/{CLAIM_ID}/validate", headers=auth_headers)
    assert r.status_code == 200


def test_validate_pass_returns_validated_status(client, auth_headers):
    with _override_db(_mock_db_valid()):
        r = client.post(f"/api/claims/{CLAIM_ID}/validate", headers=auth_headers)
    assert r.json()["validation_status"] == "Validated"


def test_validate_pass_returns_empty_errors(client, auth_headers):
    with _override_db(_mock_db_valid()):
        r = client.post(f"/api/claims/{CLAIM_ID}/validate", headers=auth_headers)
    assert r.json()["errors"] == []


def test_validate_fail_returns_failed_status(client, auth_headers):
    # Bad CPT code to trigger failure
    mock = _mock_db_valid()
    mock.execute_sp_multi.return_value[2] = [{
        "ServiceLineId": str(uuid.uuid4()), "ClaimId": CLAIM_ID,
        "LineSequence": 1, "ProcedureCode": "AB", "LineCharge": 150.0,
        "ServiceDateFrom": None, "ServiceDateTo": None, "PlaceOfService": None,
        "EmgIndicator": False, "DiagnosisPointer": None, "DaysUnits": None,
        "EpsdtFamilyPlan": None, "IdQualifier": None, "RenderingProviderId": None,
    }]
    with _override_db(mock):
        r = client.post(f"/api/claims/{CLAIM_ID}/validate", headers=auth_headers)
    assert r.json()["validation_status"] == "Failed"


def test_validate_fail_returns_error_list(client, auth_headers):
    mock = _mock_db_valid()
    mock.execute_sp_multi.return_value[2][0]["ProcedureCode"] = "AB"
    with _override_db(mock):
        r = client.post(f"/api/claims/{CLAIM_ID}/validate", headers=auth_headers)
    errors = r.json()["errors"]
    assert len(errors) >= 1
    first = errors[0]
    assert "field" in first
    assert "item_number" in first
    assert "message" in first
    assert "severity" in first


def test_validate_requires_auth(client):
    r = client.post(f"/api/claims/{CLAIM_ID}/validate")
    assert r.status_code == 401


# ── Send ─────────────────────────────────────────────────────────────────────

def test_send_validated_claim_returns_200(client, auth_headers):
    with _override_db(_mock_db_valid(status="Validated")):
        r = client.post(f"/api/claims/{CLAIM_ID}/send", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["validation_status"] == "Sent"


def test_send_non_validated_returns_422(client, auth_headers):
    with _override_db(_mock_db_valid(status="Pending")):
        r = client.post(f"/api/claims/{CLAIM_ID}/send", headers=auth_headers)
    assert r.status_code == 422


def test_send_draft_returns_422(client, auth_headers):
    with _override_db(_mock_db_valid(status="Draft")):
        r = client.post(f"/api/claims/{CLAIM_ID}/send", headers=auth_headers)
    assert r.status_code == 422


def test_send_requires_auth(client):
    r = client.post(f"/api/claims/{CLAIM_ID}/send")
    assert r.status_code == 401


# ── Delete ───────────────────────────────────────────────────────────────────

def test_delete_existing_claim_returns_204(client, auth_headers):
    with _override_db(_mock_db_valid()):
        r = client.delete(f"/api/claims/{CLAIM_ID}", headers=auth_headers)
    assert r.status_code == 204


def test_delete_nonexistent_claim_returns_404(client, auth_headers):
    mock = _mock_db_valid()
    mock.execute_sp.return_value = []  # simulate not found
    with _override_db(mock):
        r = client.delete(f"/api/claims/{CLAIM_ID}", headers=auth_headers)
    assert r.status_code == 404
