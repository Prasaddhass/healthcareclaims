"""Integration tests for /api/claims — 8 tests (US-002-10)."""
from __future__ import annotations

import uuid
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from utils.jwt_utils import create_access_token


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def client() -> TestClient:
    from main import app
    return TestClient(app)


@pytest.fixture(scope="module")
def auth_headers() -> dict:
    token = create_access_token({"sub": "admin", "userId": 1, "role": "Admin"})
    return {"Authorization": f"Bearer {token}"}


CLAIM_ID = str(uuid.uuid4())

VALID_PAYLOAD = {
    "save_as_draft": False,
    "patient_info": {
        "patient_name": "Doe, John A",
        "patient_birth_date": "01/15/80",
        "patient_sex": "M",
        "patient_relationship": "Self",
    },
    "insured_info": {
        "insured_policy_number": "POL-123",
        "another_benefit_plan": "NO",
    },
    "other_insurance": {},
    "condition_info": {},
    "diagnosis": [
        {"pointer": "A", "icd_code": "Z00.00", "sequence": 1},
    ],
    "service_lines": [
        {"procedure_code": "A1234", "line_charge": 150.00, "line_sequence": 1},
    ],
    "provider_billing": {
        "federal_tax_id": "123456789",
        "accept_assignment": "YES",
        "billing_provider_name": "Acme Medical",
        "billing_provider_npi": "1234567890",
        "total_charge": 150.00,
    },
}


def _mock_db() -> MagicMock:
    db = MagicMock()
    db.execute_sp.return_value = [{
        "ClaimId":          CLAIM_ID,
        "TotalCount":       1,
        "ValidationStatus": "Pending",
        "CreatedOn":        None,
        "UpdatedOn":        None,
        "PatientId":        "Doe, John A",
        "InsuranceName":    "Acme Medical",
        "PolicyId":         "POL-123",
        "SentOn":           None,
    }]
    db.execute_sp_no_result.return_value = None
    db.execute_sp_multi.return_value = [
        [{"ClaimId": CLAIM_ID, "ValidationStatus": "Pending"}],
        [{
            "DiagnosisId": str(uuid.uuid4()),
            "ClaimId":     CLAIM_ID,
            "Pointer":     "A",
            "IcdCode":     "Z00.00",
            "Sequence":    1,
        }],
        [{
            "ServiceLineId":     str(uuid.uuid4()),
            "ClaimId":           CLAIM_ID,
            "LineSequence":      1,
            "ProcedureCode":     "A1234",
            "LineCharge":        150.0,
            "ServiceDateFrom":   None,
            "ServiceDateTo":     None,
            "PlaceOfService":    None,
            "EmgIndicator":      False,
            "DiagnosisPointer":  None,
            "DaysUnits":         None,
            "EpsdtFamilyPlan":   None,
            "IdQualifier":       None,
            "RenderingProviderId": None,
        }],
        [],
    ]
    return db


def _override_db(mock: MagicMock):
    """Context manager: override get_db with mock, restore after."""
    from main import app
    from dependencies import get_db

    class _Ctx:
        def __enter__(self):
            app.dependency_overrides[get_db] = lambda: mock
            return self

        def __exit__(self, *_):
            app.dependency_overrides.clear()

    return _Ctx()


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_list_claims_requires_auth(client: TestClient) -> None:
    r = client.get("/api/claims")
    assert r.status_code == 401


def test_list_claims_returns_200_with_auth(client: TestClient, auth_headers: dict) -> None:
    with _override_db(_mock_db()):
        r = client.get("/api/claims", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "claims" in data
    assert "total_count" in data


def test_create_claim_returns_201(client: TestClient, auth_headers: dict) -> None:
    with _override_db(_mock_db()):
        r = client.post("/api/claims", json=VALID_PAYLOAD, headers=auth_headers)
    assert r.status_code == 201
    data = r.json()
    assert "claim_id" in data


def test_create_claim_draft_has_draft_status(client: TestClient, auth_headers: dict) -> None:
    draft_payload = {**VALID_PAYLOAD, "save_as_draft": True}
    mock = _mock_db()
    mock.execute_sp.return_value[0]["ValidationStatus"] = "Draft"
    with _override_db(mock):
        r = client.post("/api/claims", json=draft_payload, headers=auth_headers)
    assert r.status_code == 201
    assert r.json()["validation_status"] == "Draft"


def test_create_claim_invalid_procedure_code_returns_422(client: TestClient, auth_headers: dict) -> None:
    bad = {
        **VALID_PAYLOAD,
        "service_lines": [{"procedure_code": "AB", "line_charge": 100.0}],
    }
    with _override_db(_mock_db()):
        r = client.post("/api/claims", json=bad, headers=auth_headers)
    assert r.status_code == 422


def test_get_claim_returns_detail(client: TestClient, auth_headers: dict) -> None:
    with _override_db(_mock_db()):
        r = client.get(f"/api/claims/{CLAIM_ID}", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "header" in data
    assert "diagnosis" in data
    assert "service_lines" in data


def test_update_claim_returns_200(client: TestClient, auth_headers: dict) -> None:
    with _override_db(_mock_db()):
        r = client.put(f"/api/claims/{CLAIM_ID}", json=VALID_PAYLOAD, headers=auth_headers)
    assert r.status_code == 200
    assert "claim_id" in r.json()


def test_delete_claim_returns_204(client: TestClient, auth_headers: dict) -> None:
    with _override_db(_mock_db()):
        r = client.delete(f"/api/claims/{CLAIM_ID}", headers=auth_headers)
    assert r.status_code == 204
