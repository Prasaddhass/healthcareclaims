"""
ClaimValidationEngine — 7 rule groups for CMS-1500 claim validation.

All monetary math uses Decimal.
No dynamic SQL — purely in-memory rule evaluation against claim data.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any


@dataclass
class ValidationError:
    field:       str
    item_number: str
    message:     str
    severity:    str  # 'error' | 'warning'

    def to_dict(self) -> dict[str, str]:
        return {
            "field":       self.field,
            "item_number": self.item_number,
            "message":     self.message,
            "severity":    self.severity,
        }


# ── Regex constants (mirror cms1500.schema.ts) ──────────────────────────────
_NPI_RE  = re.compile(r"^\d{10}$")
_TAX_RE  = re.compile(r"^\d{9}$")
_ICD_RE  = re.compile(r"^[A-Z0-9.]+$")
_CPT_RE  = re.compile(r"^[A-Z0-9]{5}$")
_DATE_RE = re.compile(r"^(0[1-9]|1[0-2])/(0[1-9]|[12]\d|3[01])/\d{2}$")


def _parse_date(s: str | None):
    """Parse MM/DD/YY string → (month, day, year) tuple for comparison, or None."""
    if not s:
        return None
    try:
        from datetime import datetime
        return datetime.strptime(s, "%m/%d/%y").date()
    except ValueError:
        return None


class ClaimValidationEngine:
    """
    Validates a claim detail dict (as returned by sp_GetClaimById) against
    7 rule groups and returns a list of ValidationError objects.

    Validation passes when errors list is empty.
    """

    def validate(
        self,
        header: dict[str, Any],
        diagnosis: list[dict[str, Any]],
        service_lines: list[dict[str, Any]],
    ) -> list[ValidationError]:
        errors: list[ValidationError] = []

        errors += self._rule_required_fields(header)
        errors += self._rule_npi_format(header)
        errors += self._rule_tax_id_format(header)
        errors += self._rule_icd_codes(diagnosis)
        errors += self._rule_cpt_codes(service_lines)
        errors += self._rule_date_ranges(header, service_lines)
        errors += self._rule_total_charge(header, service_lines)

        return errors

    # ── Rule Group 1: Required Fields ─────────────────────────────────────────

    def _rule_required_fields(self, h: dict[str, Any]) -> list[ValidationError]:
        required = [
            ("PatientName",          "Item 2",  "Patient name is required"),
            ("PatientBirthDate",     "Item 3",  "Patient date of birth is required"),
            ("PatientSex",           "Item 3",  "Patient sex is required"),
            ("InsuredPolicyNumber",  "Item 4",  "Insured policy number is required"),
            ("PatientRelationship",  "Item 6",  "Patient relationship is required"),
            ("FederalTaxId",         "Item 25", "Federal Tax ID is required"),
            ("BillingProviderName",  "Item 33", "Billing provider name is required"),
            ("BillingProviderNPI",   "Item 33a","Billing provider NPI is required"),
            ("AcceptAssignment",     "Item 27", "Accept assignment is required"),
        ]
        errors = []
        for db_col, item_no, msg in required:
            val = h.get(db_col)
            if val is None or str(val).strip() == "":
                errors.append(ValidationError(
                    field=db_col, item_number=item_no, message=msg, severity="error",
                ))
        return errors

    # ── Rule Group 2: NPI Format ──────────────────────────────────────────────

    def _rule_npi_format(self, h: dict[str, Any]) -> list[ValidationError]:
        npi_fields = [
            ("BillingProviderNPI",   "Item 33a"),
            ("ServiceFacilityNPI",   "Item 32a"),
            ("ReferringProviderNPI", "Item 17b"),
        ]
        errors = []
        for col, item_no in npi_fields:
            val = h.get(col)
            if val and str(val).strip() and not _NPI_RE.match(str(val).strip()):
                errors.append(ValidationError(
                    field=col,
                    item_number=item_no,
                    message=f"NPI must be exactly 10 digits (found: {val})",
                    severity="error",
                ))
        return errors

    # ── Rule Group 3: Tax ID Format ───────────────────────────────────────────

    def _rule_tax_id_format(self, h: dict[str, Any]) -> list[ValidationError]:
        errors = []
        tax_id = h.get("FederalTaxId")
        if tax_id and str(tax_id).strip() and not _TAX_RE.match(str(tax_id).strip()):
            errors.append(ValidationError(
                field="FederalTaxId",
                item_number="Item 25",
                message=f"Federal Tax ID must be exactly 9 digits (found: {tax_id})",
                severity="error",
            ))
        return errors

    # ── Rule Group 4: ICD Code Format ─────────────────────────────────────────

    def _rule_icd_codes(self, diagnosis: list[dict[str, Any]]) -> list[ValidationError]:
        errors = []
        filled = [d for d in diagnosis if d.get("IcdCode") or d.get("icd_code")]
        for entry in filled:
            code = str(entry.get("IcdCode") or entry.get("icd_code") or "").strip()
            ptr  = entry.get("Pointer") or entry.get("pointer", "?")
            if code and not _ICD_RE.match(code):
                errors.append(ValidationError(
                    field=f"diagnosis[{ptr}].icdCode",
                    item_number="Item 21",
                    message=f"Invalid ICD-10 code format at pointer {ptr}: '{code}'",
                    severity="error",
                ))
        if not filled:
            errors.append(ValidationError(
                field="diagnosis",
                item_number="Item 21",
                message="At least one diagnosis code is required",
                severity="error",
            ))
        return errors

    # ── Rule Group 5: CPT Code Format ─────────────────────────────────────────

    def _rule_cpt_codes(self, service_lines: list[dict[str, Any]]) -> list[ValidationError]:
        errors = []
        if not service_lines:
            errors.append(ValidationError(
                field="serviceLines",
                item_number="Item 24",
                message="At least one service line is required",
                severity="error",
            ))
            return errors
        for i, line in enumerate(service_lines, start=1):
            code = str(line.get("ProcedureCode") or line.get("procedure_code") or "").strip()
            if not code:
                errors.append(ValidationError(
                    field=f"serviceLines[{i}].procedureCode",
                    item_number=f"Item 24D row {i}",
                    message=f"Procedure code is required on line {i}",
                    severity="error",
                ))
            elif not _CPT_RE.match(code):
                errors.append(ValidationError(
                    field=f"serviceLines[{i}].procedureCode",
                    item_number=f"Item 24D row {i}",
                    message=f"Procedure code must be 5 alphanumeric characters (found: '{code}')",
                    severity="error",
                ))
        return errors

    # ── Rule Group 6: Date From ≤ Date To ────────────────────────────────────

    def _rule_date_ranges(
        self,
        h: dict[str, Any],
        service_lines: list[dict[str, Any]],
    ) -> list[ValidationError]:
        errors = []

        # Hospitalization dates
        hosp_from = _parse_date(h.get("HospitalizationFrom"))
        hosp_to   = _parse_date(h.get("HospitalizationTo"))
        if hosp_from and hosp_to and hosp_from > hosp_to:
            errors.append(ValidationError(
                field="conditionInfo.hospitalizationFrom",
                item_number="Item 18",
                message="Hospitalization From date must be on or before To date",
                severity="error",
            ))

        # Unable-to-work dates
        utw_from = _parse_date(h.get("UnableToWorkFrom"))
        utw_to   = _parse_date(h.get("UnableToWorkTo"))
        if utw_from and utw_to and utw_from > utw_to:
            errors.append(ValidationError(
                field="conditionInfo.unableToWorkFrom",
                item_number="Item 16",
                message="Unable to Work From date must be on or before To date",
                severity="error",
            ))

        # Service line dates
        for i, line in enumerate(service_lines, start=1):
            sdf = _parse_date(str(line.get("ServiceDateFrom") or ""))
            sdt = _parse_date(str(line.get("ServiceDateTo")   or ""))
            if sdf and sdt and sdf > sdt:
                errors.append(ValidationError(
                    field=f"serviceLines[{i}].serviceDateFrom",
                    item_number=f"Item 24A row {i}",
                    message=f"Service date From ({sdf}) must be on or before To ({sdt}) on line {i}",
                    severity="error",
                ))
        return errors

    # ── Rule Group 7: Total Charge = Sum of Line Charges ─────────────────────

    def _rule_total_charge(
        self,
        h: dict[str, Any],
        service_lines: list[dict[str, Any]],
    ) -> list[ValidationError]:
        errors = []
        if not service_lines:
            return errors

        computed = sum(
            Decimal(str(line.get("LineCharge") or line.get("line_charge") or 0))
            for line in service_lines
        )
        stored = Decimal(str(h.get("TotalCharge") or 0))

        if abs(computed - stored) > Decimal("0.01"):
            errors.append(ValidationError(
                field="providerBilling.totalCharge",
                item_number="Item 28",
                message=(
                    f"Total charge ({stored}) does not match sum of service line charges ({computed}). "
                    "Please re-save the claim."
                ),
                severity="warning",
            ))
        return errors
