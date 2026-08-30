from __future__ import annotations

from unittest.mock import MagicMock, patch

from ai_service.agents.validation_agent import ClaimValidationAgent


class _Tool:
    def __init__(self, name: str, response: dict):
        self.name = name
        self.run = MagicMock(return_value=response)


def _base_state() -> dict:
    return {'claim_id': 'claim-1', 'claim_data': {'header': {'InsuranceName': 'Aetna', 'PriorAuthNumber': 'AUTH-1234'}, 'diagnosis': [{'Pointer': 'A', 'IcdCode': 'Z00.00'}], 'service_lines': [{'LineSequence': 1, 'ProcedureCode': '99213'}]}, 'messages': [], 'audit_notes': []}


def test_validation_agent_calls_validate_icd_for_each_diagnosis() -> None:
    icd = _Tool('validate_icd_code', {'valid': True})
    cpt = _Tool('validate_cpt_code', {'valid': True})
    auth = _Tool('check_prior_authorization', {'valid': True})
    with patch('ai_service.agents.validation_agent.get_mcp_tools', return_value=[icd, cpt, auth]):
        result = ClaimValidationAgent(db=MagicMock())(_base_state())
    icd.run.assert_called_once()
    assert result['validation_result']['passed'] is True


def test_validation_agent_calls_validate_cpt_for_each_service_line() -> None:
    icd = _Tool('validate_icd_code', {'valid': True})
    cpt = _Tool('validate_cpt_code', {'valid': True})
    auth = _Tool('check_prior_authorization', {'valid': True})
    with patch('ai_service.agents.validation_agent.get_mcp_tools', return_value=[icd, cpt, auth]):
        ClaimValidationAgent(db=MagicMock())(_base_state())
    cpt.run.assert_called_once()


def test_validation_agent_returns_passed_true_when_all_valid() -> None:
    icd = _Tool('validate_icd_code', {'valid': True})
    cpt = _Tool('validate_cpt_code', {'valid': True})
    auth = _Tool('check_prior_authorization', {'valid': True})
    with patch('ai_service.agents.validation_agent.get_mcp_tools', return_value=[icd, cpt, auth]):
        result = ClaimValidationAgent(db=MagicMock())(_base_state())
    assert result['validation_result']['passed'] is True


def test_validation_agent_flags_invalid_icd_code() -> None:
    icd = _Tool('validate_icd_code', {'valid': False})
    cpt = _Tool('validate_cpt_code', {'valid': True})
    auth = _Tool('check_prior_authorization', {'valid': True})
    with patch('ai_service.agents.validation_agent.get_mcp_tools', return_value=[icd, cpt, auth]):
        result = ClaimValidationAgent(db=MagicMock())(_base_state())
    assert result['validation_result']['issues'][0]['field'].startswith('diagnosis[')


def test_validation_agent_flags_invalid_cpt_code() -> None:
    icd = _Tool('validate_icd_code', {'valid': True})
    cpt = _Tool('validate_cpt_code', {'valid': False})
    auth = _Tool('check_prior_authorization', {'valid': True})
    with patch('ai_service.agents.validation_agent.get_mcp_tools', return_value=[icd, cpt, auth]):
        result = ClaimValidationAgent(db=MagicMock())(_base_state())
    assert any(issue['field'].startswith('serviceLines[') for issue in result['validation_result']['issues'])
