from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import AIMessage

from ai_service.agents.pipeline_state import AgentState
from ai_service.mcp.mcp_registry import get_mcp_tools
from repositories.db_repository import DBRepository

logger = logging.getLogger(__name__)


class ClaimValidationAgent:
    def __init__(self, db: Any | None = None) -> None:
        self._db = db or DBRepository()

    def __call__(self, state: AgentState) -> AgentState:
        tools = {tool.name: tool for tool in get_mcp_tools(self._db)}
        claim_data = state.get('claim_data', {})
        issues: list[dict[str, Any]] = []
        for diagnosis in claim_data.get('diagnosis', []):
            code = diagnosis.get('IcdCode', '')
            try:
                result = tools['validate_icd_code'].run({'icd_code': code})
                if not result.get('valid'):
                    issues.append({'field': f"diagnosis[{diagnosis.get('Pointer', '')}].icdCode", 'severity': 'error', 'message': f"ICD code '{code}' failed format validation", 'ai_suggestion': 'Verify the diagnosis code against ICD-10-CM references.'})
            except Exception as exc:
                logger.error('ICD validation failed: %s', type(exc).__name__)
                issues.append({'field': f"diagnosis[{diagnosis.get('Pointer', '')}].icdCode", 'severity': 'warning', 'message': 'ICD validation service unavailable', 'ai_suggestion': 'Retry validation later.'})
        for line in claim_data.get('service_lines', []):
            code = line.get('ProcedureCode', '')
            try:
                result = tools['validate_cpt_code'].run({'cpt_code': code})
                if not result.get('valid'):
                    issues.append({'field': f"serviceLines[{line.get('LineSequence', '')}].procedureCode", 'severity': 'error', 'message': f"CPT '{code}' failed format validation", 'ai_suggestion': 'Verify the procedure code against CPT/HCPCS references.'})
            except Exception as exc:
                logger.error('CPT validation failed: %s', type(exc).__name__)
                issues.append({'field': f"serviceLines[{line.get('LineSequence', '')}].procedureCode", 'severity': 'warning', 'message': 'CPT validation service unavailable', 'ai_suggestion': 'Retry validation later.'})
        header = claim_data.get('header', {})
        prior_auth = str(header.get('PriorAuthNumber', '') or '').strip()
        if prior_auth:
            try:
                result = tools['check_prior_authorization'].run({'auth_number': prior_auth, 'payer_id': header.get('InsuranceName', ''), 'cpt_code': claim_data.get('service_lines', [{}])[0].get('ProcedureCode', '')})
                if not result.get('valid'):
                    issues.append({'field': 'priorAuthNumber', 'severity': 'warning', 'message': 'Prior authorization number format is invalid', 'ai_suggestion': 'Confirm the authorization number with the payer.'})
            except Exception as exc:
                logger.error('Prior auth validation failed: %s', type(exc).__name__)
                issues.append({'field': 'priorAuthNumber', 'severity': 'warning', 'message': 'Prior authorization validation service unavailable', 'ai_suggestion': 'Retry validation later.'})
        validation_result = {'passed': not any(issue['severity'] == 'error' for issue in issues), 'issues': issues}
        messages = list(state.get('messages', []))
        messages.append(AIMessage(content=f"Validation complete: {'PASSED' if validation_result['passed'] else 'FAILED'} ({len(issues)} issues)"))
        return {**state, 'validation_result': validation_result, 'messages': messages}
