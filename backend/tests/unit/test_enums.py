"""Unit tests for models/enums.py — AC-07 from US-TECH-02."""
from __future__ import annotations

import pytest


def test_validation_status_members() -> None:
    from models.enums import ValidationStatus

    members = [s.value for s in ValidationStatus]
    assert members == ["Draft", "Pending", "Validated", "Failed", "Sent"], (
        "ValidationStatus enum members or order changed"
    )


def test_file_type_members() -> None:
    from models.enums import FileType

    expected = {"pdf", "doc", "docx", "txt"}
    actual   = {f.value for f in FileType}
    assert actual == expected, f"FileType enum mismatch: {actual}"


def test_patient_relationship_members() -> None:
    from models.enums import PatientRelationship

    assert PatientRelationship.Self.value   == "Self"
    assert PatientRelationship.Spouse.value == "Spouse"
    assert PatientRelationship.Child.value  == "Child"
    assert PatientRelationship.Other.value  == "Other"


def test_insurance_type_contains_medicare() -> None:
    from models.enums import InsuranceType

    assert InsuranceType.Medicare.value == "Medicare"


def test_enums_are_str_subclasses() -> None:
    """All enums must be str subclasses so they serialise as JSON strings."""
    from models.enums import FileType, InsuranceType, PatientRelationship, ValidationStatus

    for enum_class in (ValidationStatus, InsuranceType, PatientRelationship, FileType):
        for member in enum_class:
            assert isinstance(member.value, str), (
                f"{enum_class.__name__}.{member.name} is not a str"
            )
