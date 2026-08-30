from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from ai_service.mcp.mcp_registry import get_mcp_tools


@pytest.fixture()
def tools_and_db() -> tuple[dict[str, object], MagicMock]:
    db = MagicMock()
    db.execute_sp_multi.return_value = [[{'PatientName': 'Jane Doe', 'InsuranceName': 'Aetna', 'PolicyId': 'POL-1'}], [{'Pointer': 'A', 'IcdCode': 'Z00.00'}], [{'LineSequence': 1, 'ProcedureCode': '99213'}]]
    db.execute_sp.return_value = [{'FieldName': 'PriorAuthNumber', 'Description': 'Prior auth required for some services'}, {'FieldName': 'ProcedureCode', 'Description': 'Procedure specific policy'}]
    return {tool.name: tool for tool in get_mcp_tools(db)}, db


def test_registry_returns_five_tools(tools_and_db: tuple[dict[str, object], MagicMock]) -> None:
    tools, _ = tools_and_db
    assert len(tools) == 5


def test_get_claim_details_strips_phi(tools_and_db: tuple[dict[str, object], MagicMock]) -> None:
    tools, _ = tools_and_db
    result = tools['get_claim_details'].run({'claim_id': 'claim-1'})
    assert 'PatientName' not in result['header']
    assert result['header']['InsuranceName'] == 'Aetna'


def test_validate_icd_code_accepts_valid_code(tools_and_db: tuple[dict[str, object], MagicMock]) -> None:
    tools, _ = tools_and_db
    assert tools['validate_icd_code'].run({'icd_code': 'Z00.00'})['valid'] is True


def test_validate_icd_code_rejects_invalid_code(tools_and_db: tuple[dict[str, object], MagicMock]) -> None:
    tools, _ = tools_and_db
    assert tools['validate_icd_code'].run({'icd_code': 'BAD'})['valid'] is False


def test_validate_cpt_code_accepts_valid_code(tools_and_db: tuple[dict[str, object], MagicMock]) -> None:
    tools, _ = tools_and_db
    assert tools['validate_cpt_code'].run({'cpt_code': '99213'})['valid'] is True


def test_validate_cpt_code_rejects_invalid_code(tools_and_db: tuple[dict[str, object], MagicMock]) -> None:
    tools, _ = tools_and_db
    assert tools['validate_cpt_code'].run({'cpt_code': '99'})['valid'] is False


def test_prior_auth_accepts_expected_format(tools_and_db: tuple[dict[str, object], MagicMock]) -> None:
    tools, _ = tools_and_db
    assert tools['check_prior_authorization'].run({'auth_number': 'AUTH-1234', 'payer_id': 'Aetna', 'cpt_code': '99213'})['valid'] is True


def test_prior_auth_rejects_short_value(tools_and_db: tuple[dict[str, object], MagicMock]) -> None:
    tools, _ = tools_and_db
    assert tools['check_prior_authorization'].run({'auth_number': '123', 'payer_id': 'Aetna', 'cpt_code': '99213'})['valid'] is False


def test_get_payer_policy_filters_results(tools_and_db: tuple[dict[str, object], MagicMock]) -> None:
    tools, _ = tools_and_db
    result = tools['get_payer_policy'].run({'payer_code': 'Aetna', 'query': 'prior auth'})
    assert result['total_found'] == 1
