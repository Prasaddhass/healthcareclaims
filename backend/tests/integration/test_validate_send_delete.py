"""Integration tests for validate / send / delete endpoints — 12 tests."""
from __future__ import annotations

import json
import uuid
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from services.claims_service import ClaimsService, SourceOrReference
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


# ── Denial validation details ─────────────────────────────────────────────────

def test_denial_validation_returns_stored_procedure_json(client, auth_headers):
    mock = _mock_db_valid()
    json_column_name = "JSON_F52E2B61-18A1-11d1-B105-00805F49916B"
    json_payload = json.dumps({
        "ClaimId": CLAIM_ID,
        "PatientName": "Doe, John",
        "PayerName": "Medicare",
        "PolicyId": "POL-123",
        "InsuredPolicyNumber": "POL-123",
        "ProviderNPI": "1234567890",
        "IcdCode": "Z00.00",
        "DiagnosisCode": "Z00.00",
        "DiagnosisDescription": "General examination",
        "EOB_calculation": {
            "DateOfService": "2026-08-01",
            "ProcedureCode": "99213",
            "BilledAmount": 100.00,
            "AllowedAmount": 80.00,
            "PatientCoinsurance": 16.00,
            "InsurancePayment": 54.00,
            "ContractualAdjustment": 20.00,
            "PatientResponsibility": 0,
            "TypeOfProvider": "Network",
        },
        "ServiceLines": [{
            "ServiceDateFrom": "2026-01-01",
            "ProcedureCode": "99213",
            "Modifier": "26",
            "LineCharge": 100.0,
            "DaysUnits": 1.0,
            "PlaceOfService": "11",
            "ProcedureMaster": {
                "Procedure_Code": 99213,
                "Procedure_Description": "Office visit",
                "Possible_Modifiers": "25,26",
            },
            "ICDProcedureMappings": [{"Procedure_Code": "99213", "ICD10CM_Code": "Z00.00"}],
        }],
    })
    split_at = len(json_payload) // 2
    claim_detail_rows = [
        {json_column_name: json_payload[:split_at]},
        {json_column_name: json_payload[split_at:]},
    ]
    policy_document_rows = [{
        'DocumentId': 7,
        'FileName': 'policy.pdf',
        'FilePath': r'D:\uploads\policy.pdf',
        'FileType': 'pdf',
        'DocumentTag': 'PolicyDocument',
    }]
    mock.execute_sp.side_effect = [claim_detail_rows, policy_document_rows]
    loader = MagicMock()
    loader.load_pdf.return_value = [MagicMock(metadata={})]
    rag = MagicMock()
    rag.retrieve.return_value = [{
        'text': 'Procedure 99213 is a covered service.',
        'section': '3. Office Visit Benefits',
        'source': 'policy.pdf',
        'page': 1,
        'relevance': 0.91,
    }]
    with (
        _override_db(mock),
        patch('ai_service.rag.document_loader.DocumentLoader', return_value=loader),
        patch('ai_service.rag.rag_engine.RAGEngine', return_value=rag),
    ):
        response = client.post(f"/api/claims/{CLAIM_ID}/validatedenialclaim", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["ClaimId"] == CLAIM_ID
    assert response.json()["EOB_calculation"] == {
        "DateOfService": "2026-08-01",
        "ProcedureCode": "99213",
        "BilledAmount": 100.0,
        "AllowedAmount": 80.0,
        "PatientCoinsurance": 16.0,
        "InsurancePayment": 54.0,
        "ContractualAdjustment": 20.0,
        "PatientResponsibility": 0.0,
        "TypeOfProvider": "Network",
    }
    assert response.json()["ServiceLines"][0]["ICDProcedureMappings"][0]["ICD10CM_Code"] == "Z00.00"
    assert response.json()["ServiceLines"][0]["IsServiceCovered"] is True
    assert response.json()["ServiceLines"][0]["CoverageSections"] == ['3. Office Visit Benefits']
    assert response.json()["denialReasons"] == []
    rag.retrieve.assert_called_once_with(
        '99213 exclusions limitations excluded services unpaid services non-covered services',
        top_k=20,
        metadata_filter={'claim_id': CLAIM_ID},
    )


def test_denial_validation_returns_404_for_missing_claim(client, auth_headers):
    mock = _mock_db_valid()
    mock.execute_sp.return_value = []
    with _override_db(mock):
        response = client.post(f"/api/claims/{CLAIM_ID}/validatedenialclaim", headers=auth_headers)

    assert response.status_code == 404


def test_is_service_covered_returns_false_for_exclusion_evidence():
    db = MagicMock()
    db.execute_sp.return_value = [{
        'DocumentId': 7,
        'FileName': 'policy.pdf',
        'FilePath': r'D:\uploads\policy.pdf',
        'FileType': 'pdf',
        'DocumentTag': 'PolicyDocument',
    }]
    loader = MagicMock()
    loader.load_pdf.return_value = [MagicMock(metadata={})]
    rag = MagicMock()
    rag.retrieve.return_value = [{
        'text': 'Exclusions: procedure code 99213 is a non-covered service and is not payable.',
        'section': '13. Exclusions',
        'source': 'policy.pdf',
        'page': 3,
        'relevance': 0.88,
    }]

    with (
        patch('ai_service.rag.document_loader.DocumentLoader', return_value=loader),
        patch('ai_service.rag.rag_engine.RAGEngine', return_value=rag),
    ):
        is_covered = ClaimsService(db).is_service_covered(CLAIM_ID, '99213')

    assert is_covered is False


@pytest.mark.parametrize(
    ('section', 'expected_reason'),
    [
        ('13. Exclusions and Limitations', 'non-covered service'),
        ('4. Prior Authorization Requirements for Services', 'prior-auth required'),
        ('3. Covered Services', ''),
    ],
)
def test_fetch_denial_section_matches_terms_within_policy_headings(section, expected_reason):
    assert ClaimsService._fetch_denial_section(section) == expected_reason


def test_denial_reason_includes_policy_reference():
    reason = ClaimsService._to_denial_reasons([{
        'source': 'SYN-009-BRZ_Value_Health.pdf',
        'page': 3,
        'text': 'Non-covered convenience services',
        'section': '13. Exclusions',
        'relevance': 0.56,
    }])[0]

    assert reason.denial_reason == 'ServiceNotCovered'
    assert reason.denial_result == 'Yes'
    assert reason.source_or_reference.model_dump(by_alias=True) == {
        'PolicyDocumentFileReference': 'SYN-009-BRZ_Value_Health.pdf',
        'PageNumberReference': 3,
        'TextReference': 'Non-covered convenience services',
        'SectionReference': '13. Exclusions',
        'RelevanceReference': '0.56',
    }


def test_source_or_reference_formats_numeric_relevance():
    reference = SourceOrReference(
        PolicyDocumentFileReference='policy.pdf',
        PageNumberReference=3,
        TextReference='Non-covered service',
        SectionReference='Exclusions',
        RelevanceReference=0.5634435331800388,
    )

    assert reference.relevance_reference == '0.56'


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
