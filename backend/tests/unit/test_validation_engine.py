"""Unit tests for ClaimValidationEngine — 3 tests."""
from __future__ import annotations

import pytest
from services.validation_engine import ClaimValidationEngine

ENGINE = ClaimValidationEngine()

VALID_HEADER = {
    "PatientName":         "Doe, John",
    "PatientBirthDate":    "01/15/80",
    "PatientSex":          "M",
    "InsuredPolicyNumber": "POL-123",
    "PatientRelationship": "Self",
    "FederalTaxId":        "123456789",
    "BillingProviderName": "Acme Medical",
    "BillingProviderNPI":  "1234567890",
    "AcceptAssignment":    "YES",
    "TotalCharge":         150.00,
}
VALID_DIAGNOSIS    = [{"Pointer": "A", "IcdCode": "Z00.00"}]
VALID_SERVICE_LINE = [{"ProcedureCode": "A1234", "LineCharge": 150.00}]


def test_valid_claim_produces_no_errors() -> None:
    errors = ENGINE.validate(VALID_HEADER, VALID_DIAGNOSIS, VALID_SERVICE_LINE)
    assert errors == []


def test_missing_required_field_produces_error() -> None:
    header = {**VALID_HEADER, "PatientName": ""}
    errors = ENGINE.validate(header, VALID_DIAGNOSIS, VALID_SERVICE_LINE)
    fields = [e.field for e in errors]
    assert "PatientName" in fields
    assert all(e.severity == "error" for e in errors if e.field == "PatientName")


def test_invalid_cpt_code_produces_error() -> None:
    bad_lines = [{"ProcedureCode": "AB", "LineCharge": 100.0}]
    errors = ENGINE.validate(VALID_HEADER, VALID_DIAGNOSIS, bad_lines)
    cpt_errors = [e for e in errors if "procedureCode" in e.field]
    assert len(cpt_errors) >= 1
    assert cpt_errors[0].severity == "error"
