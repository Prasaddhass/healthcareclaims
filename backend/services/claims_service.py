"""ClaimsService — claim lifecycle management (US-002-10 / US-003-05)."""
from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import HTTPException, status

from schemas.claim_schemas import (
    ClaimCreateRequest,
    ClaimCreatedResponse,
    ClaimDetailResponse,
    ClaimsListResponse,
    ClaimSummary,
    ClaimUpdatedResponse,
    DiagnosisDetail,
    SendResult,
    ServiceLineDetail,
    ValidationErrorDetail,
    ValidationResult,
)
from services.validation_engine import ClaimValidationEngine

logger = logging.getLogger(__name__)


class ClaimsService:
    """Orchestrates SP calls for claim CRUD operations."""

    def __init__(self, db: object) -> None:
        self._db = db

    # ── List ──────────────────────────────────────────────────────────────────

    def list_claims(
        self,
        page: int = 1,
        page_size: int = 20,
        validation_status: Optional[str] = None,
        search_term: Optional[str] = None,
        user_id: int = 0,
    ) -> ClaimsListResponse:
        rows = self._db.execute_sp(
            "sp_GetClaims",
            (page, page_size, validation_status, search_term),
        )
        claims = [
            ClaimSummary(
                claim_id=str(r["ClaimId"]),
                patient_id=r.get("PatientId"),
                insurance_name=r.get("InsuranceName"),
                policy_id=r.get("PolicyId"),
                validation_status=r.get("ValidationStatus", ""),
                created_on=r.get("CreatedOn"),
                updated_on=r.get("UpdatedOn"),
                sent_on=r.get("SentOn"),
                total_count=r.get("TotalCount", 0),
            )
            for r in rows
        ]
        total = rows[0]["TotalCount"] if rows else 0
        return ClaimsListResponse(
            claims=claims,
            total_count=total,
            page=page,
            page_size=page_size,
        )

    # ── Create ────────────────────────────────────────────────────────────────

    def create_claim(
        self,
        payload: ClaimCreateRequest,
        user_id: int,
        username: str,
    ) -> ClaimCreatedResponse:
        p  = payload.patient_info
        pb = payload.provider_billing

        # 1. Create header row — returns ClaimId
        status = "Draft" if payload.save_as_draft else "Pending"
        header_rows = self._db.execute_sp(
            "sp_CreateClaim",
            (
                p.patient_name,            # @PatientId (using name as stub ID)
                pb.billing_provider_name,  # @InsuranceName
                payload.insured_info.insured_policy_number,  # @PolicyId
                status,
                user_id,
            ),
        )
        claim_id = str(header_rows[0]["ClaimId"])

        # 2. Upsert 68 flat form fields
        self._upsert_form_data(claim_id, payload)

        # 3. Upsert diagnosis entries (skip blanks)
        filled_dx = [d for d in payload.diagnosis if d.icd_code and d.icd_code.strip()]
        for seq, dx in enumerate(filled_dx, start=1):
            self._db.execute_sp_no_result(
                "sp_UpsertClaimDiagnosis",
                (claim_id, dx.pointer, dx.icd_code, dx.sequence or seq),
            )

        # 4. Upsert service lines
        for seq, line in enumerate(payload.service_lines, start=1):
            self._db.execute_sp_no_result(
                "sp_UpsertClaimServiceLine",
                (
                    claim_id,
                    line.line_sequence or seq,
                    line.service_date_from or None,
                    line.service_date_to or None,
                    line.place_of_service or None,
                    line.procedure_code,
                    line.diagnosis_pointer or None,
                    line.line_charge,
                    line.days_units or 1,
                    "Y" if line.emg_indicator else None,
                    line.epsdt_family_plan or None,
                    line.id_qualifier or None,
                    line.rendering_provider_id or None,
                ),
            )

        # 5. Set initial validation status + audit log
        self._db.execute_sp_no_result(
            "sp_UpdateValidationStatus",
            (claim_id, status, username, f"Claim created via API ({status})"),
        )

        result_rows = self._db.execute_sp("sp_GetClaims", (1, 1, None, claim_id))
        created_on  = result_rows[0].get("CreatedOn") if result_rows else None
        return ClaimCreatedResponse(
            claim_id=claim_id,
            validation_status=status,
            created_on=created_on,
        )

    # ── Get by ID ─────────────────────────────────────────────────────────────

    def get_claim(self, claim_id: str) -> ClaimDetailResponse:
        result_sets = self._db.execute_sp_multi("sp_GetClaimById", (claim_id,))
        header    = result_sets[0][0] if result_sets and result_sets[0] else {}
        diag_rows = result_sets[1]    if len(result_sets) > 1 else []
        line_rows = result_sets[2]    if len(result_sets) > 2 else []
        doc_rows  = result_sets[3]    if len(result_sets) > 3 else []

        diagnosis = [
            DiagnosisDetail(
                diagnosis_id=str(r.get("DiagnosisId", "")),
                claim_id=claim_id,
                pointer=r["Pointer"],
                icd_code=r["IcdCode"],
                sequence=r["Sequence"],
            )
            for r in diag_rows
        ]
        service_lines = [
            ServiceLineDetail(
                service_line_id=str(r.get("ServiceLineId", "")),
                claim_id=claim_id,
                line_sequence=r["LineSequence"],
                service_date_from=str(r["ServiceDateFrom"]) if r.get("ServiceDateFrom") else None,
                service_date_to=str(r["ServiceDateTo"])     if r.get("ServiceDateTo")   else None,
                place_of_service=r.get("PlaceOfService"),
                emg_indicator=bool(r.get("EmgIndicator")),
                procedure_code=r["ProcedureCode"],
                diagnosis_pointer=r.get("DiagnosisPointer"),
                line_charge=float(r.get("LineCharge", 0)),
                days_units=r.get("DaysUnits"),
                epsdt_family_plan=r.get("EpsdtFamilyPlan"),
                id_qualifier=r.get("IdQualifier"),
                rendering_provider_id=r.get("RenderingProviderId"),
            )
            for r in line_rows
        ]
        # Normalise header keys to strings
        str_header = {k: (str(v) if v is not None else None) for k, v in header.items()}
        return ClaimDetailResponse(
            header=str_header,
            diagnosis=diagnosis,
            service_lines=service_lines,
            documents=doc_rows,
        )

    # ── Update ────────────────────────────────────────────────────────────────

    def update_claim(
        self,
        claim_id: str,
        payload: ClaimCreateRequest,
        username: str,
    ) -> ClaimUpdatedResponse:
        self._upsert_form_data(claim_id, payload)

        # Re-upsert diagnosis
        filled_dx = [d for d in payload.diagnosis if d.icd_code and d.icd_code.strip()]
        for seq, dx in enumerate(filled_dx, start=1):
            self._db.execute_sp_no_result(
                "sp_UpsertClaimDiagnosis",
                (claim_id, dx.pointer, dx.icd_code, dx.sequence or seq),
            )

        # Re-upsert service lines
        for seq, line in enumerate(payload.service_lines, start=1):
            self._db.execute_sp_no_result(
                "sp_UpsertClaimServiceLine",
                (
                    claim_id,
                    line.line_sequence or seq,
                    line.service_date_from or None,
                    line.service_date_to or None,
                    line.place_of_service or None,
                    line.procedure_code,
                    line.diagnosis_pointer or None,
                    line.line_charge,
                    line.days_units or 1,
                    "Y" if line.emg_indicator else None,
                    line.epsdt_family_plan or None,
                    line.id_qualifier or None,
                    line.rendering_provider_id or None,
                ),
            )

        new_status = "Draft" if payload.save_as_draft else "Pending"
        self._db.execute_sp_no_result(
            "sp_UpdateValidationStatus",
            (claim_id, new_status, username, "Claim updated via API"),
        )

        result_rows = self._db.execute_sp("sp_GetClaims", (1, 1, None, claim_id))
        updated_on  = result_rows[0].get("UpdatedOn") if result_rows else None
        return ClaimUpdatedResponse(claim_id=claim_id, updated_on=updated_on)

    # ── Soft Delete ───────────────────────────────────────────────────────────

    def delete_claim(self, claim_id: str, username: str) -> None:
        # Verify claim exists first
        rows = self._db.execute_sp("sp_GetClaims", (1, 1, None, claim_id))
        if not rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Claim {claim_id} not found",
            )
        self._db.execute_sp_no_result("sp_DeleteClaim", (claim_id, username))

    # ── Validate ──────────────────────────────────────────────────────────────

    def validate_claim(self, claim_id: str, username: str) -> ValidationResult:
        """Run in-memory validation engine; update status and audit log."""
        detail = self.get_claim(claim_id)
        engine = ClaimValidationEngine()
        raw_diag  = [d.model_dump() for d in detail.diagnosis]
        raw_lines = [sl.model_dump() for sl in detail.service_lines]

        errors = engine.validate(
            header=detail.header,
            diagnosis=[{
                "Pointer": d["pointer"],
                "IcdCode": d["icd_code"],
            } for d in raw_diag],
            service_lines=[{
                "ProcedureCode":     sl["procedure_code"],
                "LineCharge":        sl["line_charge"],
                "ServiceDateFrom":   sl.get("service_date_from"),
                "ServiceDateTo":     sl.get("service_date_to"),
            } for sl in raw_lines],
        )

        new_status = "Validated" if not errors else "Failed"
        self._db.execute_sp_no_result(
            "sp_UpdateValidationStatus",
            (
                claim_id,
                new_status,
                username,
                f"Validation {'passed' if not errors else 'failed'}: {len(errors)} issue(s)",
            ),
        )

        return ValidationResult(
            claim_id=claim_id,
            validation_status=new_status,
            errors=[ValidationErrorDetail(**e.to_dict()) for e in errors],
        )

    # ── Send ──────────────────────────────────────────────────────────────────

    def send_claim(self, claim_id: str, username: str) -> SendResult:
        """Send claim — requires status=Validated; raises 422 otherwise."""
        rows = self._db.execute_sp("sp_GetClaims", (1, 1, None, claim_id))
        if not rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Claim {claim_id} not found",
            )
        current_status = rows[0].get("ValidationStatus", "")
        if current_status != "Validated":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=(
                    f"Claim must be in Validated status before sending. "
                    f"Current status: {current_status}"
                ),
            )
        self._db.execute_sp_no_result(
            "sp_UpdateValidationStatus",
            (claim_id, "Sent", username, "Claim sent via API"),
        )
        # Re-fetch to get updated SentOn
        updated = self._db.execute_sp("sp_GetClaims", (1, 1, None, claim_id))
        sent_on = updated[0].get("SentOn") if updated else None
        return SendResult(claim_id=claim_id, validation_status="Sent", sent_on=sent_on)

    # ── Private helpers ───────────────────────────────────────────────────────

    def _upsert_form_data(self, claim_id: str, payload: ClaimCreateRequest) -> None:
        """Call sp_UpsertClaimFormData with all 68 flat fields."""
        p  = payload.patient_info
        i  = payload.insured_info
        o  = payload.other_insurance
        c  = payload.condition_info
        pb = payload.provider_billing

        def _yn_to_bit(val: Optional[str]) -> Optional[int]:
            if val is None:
                return None
            return 1 if val == "YES" else 0

        def _parse_date(d: Optional[str]):
            """Convert MM/DD/YY string to a date object for pyodbc."""
            if not d:
                return None
            try:
                from datetime import datetime as _dt
                return _dt.strptime(d, "%m/%d/%y").date()
            except ValueError:
                return None

        self._db.execute_sp_no_result(
            "sp_UpsertClaimFormData",
            (
                claim_id,
                # Section 1
                p.insurance_type,
                p.insured_id_number,
                p.patient_name,
                _parse_date(p.patient_birth_date),
                p.patient_sex,
                p.insured_name or None,
                p.patient_street or None,
                p.patient_city or None,
                p.patient_state or None,
                p.patient_zip or None,
                p.patient_phone or None,
                p.patient_relationship,
                # Section 2
                i.insured_street or None,
                i.insured_city or None,
                i.insured_state or None,
                i.insured_zip or None,
                i.insured_policy_number,
                _parse_date(i.insured_dob),
                i.insured_sex or None,
                i.other_claim_id or None,
                i.insurance_plan_name or None,
                _yn_to_bit(i.another_benefit_plan),
                # Section 3
                o.other_insured_name or None,
                o.other_policy_number or None,
                o.other_plan_name or None,
                1 if o.patient_signature else None,
                _parse_date(o.patient_signature_date),
                1 if o.insured_signature else None,
                # Section 4
                c.employment_related or None,
                c.auto_accident or None,
                c.auto_accident_state or None,
                c.other_accident or None,
                _parse_date(c.illness_date),
                c.illness_qualifier or None,
                _parse_date(c.other_date),
                c.other_date_qualifier or None,
                _parse_date(c.unable_to_work_from),
                _parse_date(c.unable_to_work_to),
                c.referring_provider_name or None,
                c.referring_provider_npi or None,
                _parse_date(c.hospitalization_from),
                _parse_date(c.hospitalization_to),
                c.additional_claim_info or None,
                _yn_to_bit(c.outside_lab),
                c.outside_lab_charges,
                # Section 7 (billing)
                pb.resubmission_code or None,
                pb.original_ref_number or None,
                pb.prior_auth_number or None,
                pb.federal_tax_id,
                pb.patient_account_number or None,
                pb.accept_assignment,
                pb.total_charge,
                pb.amount_paid,
                1 if pb.physician_signature else None,
                _parse_date(pb.physician_signature_date),
                pb.service_facility_name or None,
                pb.service_facility_street or None,
                pb.service_facility_city or None,
                pb.service_facility_state or None,
                pb.service_facility_zip or None,
                pb.service_facility_npi or None,
                pb.billing_provider_name,
                pb.billing_provider_street or None,
                pb.billing_provider_city or None,
                pb.billing_provider_state or None,
                pb.billing_provider_zip or None,
                pb.billing_provider_phone or None,
                pb.billing_provider_npi,
                pb.billing_provider_id_qual or None,
                pb.billing_provider_id or None,
            ),
        )
