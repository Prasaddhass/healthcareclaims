"""Claim request/response schemas — fully implemented in US-002-10."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


# ── Sub-schemas (match CMS-1500 sections) ─────────────────────────────────────

class PatientInfoSchema(BaseModel):
    insurance_type:      Optional[str] = None
    insured_id_number:   Optional[str] = None
    patient_name:        str
    patient_birth_date:  str              # MM/DD/YY from frontend
    patient_sex:         str              # M | F
    insured_name:        Optional[str] = None
    patient_street:      Optional[str] = None
    patient_city:        Optional[str] = None
    patient_state:       Optional[str] = None
    patient_zip:         Optional[str] = None
    patient_phone:       Optional[str] = None
    patient_relationship: str            # Self | Spouse | Child | Other


class InsuredInfoSchema(BaseModel):
    insured_street:       Optional[str] = None
    insured_city:         Optional[str] = None
    insured_state:        Optional[str] = None
    insured_zip:          Optional[str] = None
    insured_policy_number: str
    insured_dob:          Optional[str] = None
    insured_sex:          Optional[str] = None
    other_claim_id:       Optional[str] = None
    insurance_plan_name:  Optional[str] = None
    another_benefit_plan: str = "NO"     # YES | NO


class OtherInsuranceSchema(BaseModel):
    other_insured_name:    Optional[str]  = None
    other_policy_number:   Optional[str]  = None
    other_plan_name:       Optional[str]  = None
    patient_signature:     Optional[bool] = None
    patient_signature_date: Optional[str] = None
    insured_signature:     Optional[bool] = None


class ConditionInfoSchema(BaseModel):
    employment_related:     Optional[str] = None
    auto_accident:          Optional[str] = None
    auto_accident_state:    Optional[str] = None
    other_accident:         Optional[str] = None
    illness_date:           Optional[str] = None
    illness_qualifier:      Optional[str] = None
    other_date:             Optional[str] = None
    other_date_qualifier:   Optional[str] = None
    unable_to_work_from:    Optional[str] = None
    unable_to_work_to:      Optional[str] = None
    referring_provider_name: Optional[str] = None
    referring_provider_npi:  Optional[str] = None
    hospitalization_from:   Optional[str] = None
    hospitalization_to:     Optional[str] = None
    additional_claim_info:  Optional[str] = None
    outside_lab:            Optional[str] = None
    outside_lab_charges:    Optional[float] = None


class DiagnosisSchema(BaseModel):
    pointer:  str           # A–L
    icd_code: Optional[str] = None
    sequence: Optional[int] = None


class ServiceLineSchema(BaseModel):
    service_date_from:      Optional[str]   = None
    service_date_to:        Optional[str]   = None
    place_of_service:       Optional[str]   = None
    emg_indicator:          Optional[bool]  = None
    procedure_code:         str
    diagnosis_pointer:      Optional[str]   = None
    line_charge:            float
    days_units:             Optional[int]   = None
    epsdt_family_plan:      Optional[str]   = None
    id_qualifier:           Optional[str]   = None
    rendering_provider_id:  Optional[str]   = None
    line_sequence:          Optional[int]   = None

    @field_validator("procedure_code")
    @classmethod
    def validate_procedure_code(cls, v: str) -> str:
        import re
        if not re.fullmatch(r"[A-Z0-9]{5}", v):
            raise ValueError("Procedure code must be exactly 5 uppercase alphanumeric characters")
        return v


class ProviderBillingSchema(BaseModel):
    resubmission_code:        Optional[str]   = None
    original_ref_number:      Optional[str]   = None
    prior_auth_number:        Optional[str]   = None
    federal_tax_id:           str
    patient_account_number:   Optional[str]   = None
    accept_assignment:        str             # YES | NO
    total_charge:             float           = 0.0
    amount_paid:              Optional[float] = None
    physician_signature:      Optional[bool]  = None
    physician_signature_date: Optional[str]   = None
    service_facility_name:    Optional[str]   = None
    service_facility_street:  Optional[str]   = None
    service_facility_city:    Optional[str]   = None
    service_facility_state:   Optional[str]   = None
    service_facility_zip:     Optional[str]   = None
    service_facility_npi:     Optional[str]   = None
    billing_provider_name:    str
    billing_provider_street:  Optional[str]   = None
    billing_provider_city:    Optional[str]   = None
    billing_provider_state:   Optional[str]   = None
    billing_provider_zip:     Optional[str]   = None
    billing_provider_phone:   Optional[str]   = None
    billing_provider_npi:     str
    billing_provider_id_qual: Optional[str]   = None
    billing_provider_id:      Optional[str]   = None


# ── Root request ──────────────────────────────────────────────────────────────

class ClaimCreateRequest(BaseModel):
    save_as_draft:   bool            = False
    patient_info:    PatientInfoSchema
    insured_info:    InsuredInfoSchema
    other_insurance: OtherInsuranceSchema    = Field(default_factory=OtherInsuranceSchema)
    condition_info:  ConditionInfoSchema     = Field(default_factory=ConditionInfoSchema)
    diagnosis:       List[DiagnosisSchema]   = Field(default_factory=list)
    service_lines:   List[ServiceLineSchema] = Field(default_factory=list)
    provider_billing: ProviderBillingSchema


# ── List query params ─────────────────────────────────────────────────────────

class ClaimListParams(BaseModel):
    page:              int           = 1
    page_size:         int           = 20
    validation_status: Optional[str] = None
    search_term:       Optional[str] = None


# ── Responses ─────────────────────────────────────────────────────────────────

class ClaimCreatedResponse(BaseModel):
    claim_id:          str
    validation_status: str
    created_on:        Optional[datetime] = None


class ClaimUpdatedResponse(BaseModel):
    claim_id:   str
    updated_on: Optional[datetime] = None


class ClaimSummary(BaseModel):
    claim_id:          str
    patient_id:        Optional[str] = None
    insurance_name:    Optional[str] = None
    policy_id:         Optional[str] = None
    validation_status: str
    created_on:        Optional[datetime] = None
    updated_on:        Optional[datetime] = None
    sent_on:           Optional[datetime] = None
    total_count:       int = 0


class ClaimsListResponse(BaseModel):
    claims:      List[ClaimSummary]
    total_count: int
    page:        int
    page_size:   int


class DiagnosisDetail(BaseModel):
    diagnosis_id: str
    claim_id:     str
    pointer:      str
    icd_code:     str
    sequence:     int


class ServiceLineDetail(BaseModel):
    service_line_id:     str
    claim_id:            str
    line_sequence:       int
    service_date_from:   Optional[str]   = None
    service_date_to:     Optional[str]   = None
    place_of_service:    Optional[str]   = None
    emg_indicator:       bool            = False
    procedure_code:      str
    diagnosis_pointer:   Optional[str]   = None
    line_charge:         float
    days_units:          Optional[int]   = None
    epsdt_family_plan:   Optional[str]   = None
    id_qualifier:        Optional[str]   = None
    rendering_provider_id: Optional[str] = None


class ClaimDetailResponse(BaseModel):
    header:       dict
    diagnosis:    List[DiagnosisDetail]    = Field(default_factory=list)
    service_lines: List[ServiceLineDetail] = Field(default_factory=list)
    documents:    list                     = Field(default_factory=list)


# ── Validation schemas ────────────────────────────────────────────────────────

class ValidationErrorDetail(BaseModel):
    field:       str
    item_number: str
    message:     str
    severity:    str  # 'error' | 'warning'


class ValidationResult(BaseModel):
    claim_id:          str
    validation_status: str                         # 'Validated' | 'Failed'
    errors:            List[ValidationErrorDetail] = Field(default_factory=list)


class SendResult(BaseModel):
    claim_id:          str
    validation_status: str  # 'Sent'
    sent_on:           Optional[datetime] = None

