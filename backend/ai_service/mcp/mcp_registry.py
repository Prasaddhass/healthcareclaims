"""Structured tool registry used by AI agents."""
from __future__ import annotations

import logging
import re
from typing import Any

from langchain_core.tools import StructuredTool

logger = logging.getLogger(__name__)
_PHI_FIELDS = {'PatientName', 'PatientBirthDate', 'PatientPhone', 'PatientStreet', 'PatientCity', 'PatientZip', 'FederalTaxId', 'InsuredName'}


def _strip_phi(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _strip_phi(item) for key, item in value.items() if key not in _PHI_FIELDS}
    if isinstance(value, list):
        return [_strip_phi(item) for item in value]
    return value


def get_mcp_tools(db: Any) -> list[StructuredTool]:
    def get_claim_details(claim_id: str) -> dict[str, Any]:
        try:
            result_sets = db.execute_sp_multi('sp_GetClaimById', (claim_id,))
        except Exception as exc:
            logger.error('Failed to load claim details: %s', type(exc).__name__)
            return {'error': 'Failed to retrieve claim'}
        if not result_sets or not result_sets[0]:
            return {'error': 'Claim not found'}
        return {'header': _strip_phi(result_sets[0][0]), 'diagnosis': _strip_phi(result_sets[1] if len(result_sets) > 1 else []), 'service_lines': _strip_phi(result_sets[2] if len(result_sets) > 2 else [])}

    def validate_icd_code(icd_code: str) -> dict[str, Any]:
        candidate = (icd_code or '').strip().upper()
        return {'code': candidate, 'valid': bool(re.fullmatch(r'[A-TV-Z][0-9][A-Z0-9](\.[A-Z0-9]{1,4})?', candidate))}

    def validate_cpt_code(cpt_code: str) -> dict[str, Any]:
        candidate = (cpt_code or '').strip().upper()
        return {'code': candidate, 'valid': bool(re.fullmatch(r'[A-Z0-9]{5}', candidate))}

    def check_prior_authorization(auth_number: str, payer_id: str, cpt_code: str | None = None) -> dict[str, Any]:
        candidate = (auth_number or '').strip().upper()
        return {'auth_number': candidate, 'payer_id': payer_id, 'cpt_code': cpt_code, 'valid': bool(re.fullmatch(r'[A-Z0-9-]{6,20}', candidate))}

    def get_payer_policy(payer_code: str, query: str) -> dict[str, Any]:
        try:
            rows = db.execute_sp('sp_GetValidationRules', (payer_code or None,))
        except Exception as exc:
            logger.error('Failed to retrieve payer policy: %s', type(exc).__name__)
            return {'error': 'Failed to retrieve payer policy'}
        query_lower = (query or '').lower()
        filtered = [row for row in rows if query_lower in f"{row.get('FieldName', '')} {row.get('Description', '')}".lower() or not query_lower]
        return {'payer_code': payer_code, 'query': query, 'rules': filtered[:5], 'total_found': len(filtered)}

    return [
        StructuredTool.from_function(get_claim_details, name='get_claim_details', description='Get a claim by id with PHI stripped.'),
        StructuredTool.from_function(validate_icd_code, name='validate_icd_code', description='Validate ICD code format.'),
        StructuredTool.from_function(validate_cpt_code, name='validate_cpt_code', description='Validate CPT/HCPCS code format.'),
        StructuredTool.from_function(check_prior_authorization, name='check_prior_authorization', description='Validate prior authorization number format.'),
        StructuredTool.from_function(get_payer_policy, name='get_payer_policy', description='Get payer policy rules relevant to a query.'),
    ]
