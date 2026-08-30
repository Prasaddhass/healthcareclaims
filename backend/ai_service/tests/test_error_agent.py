from __future__ import annotations

from unittest.mock import MagicMock, patch

from ai_service.agents.error_agent import ErrorAgent


def _make_agent() -> ErrorAgent:
    with patch.object(ErrorAgent, '__init__', lambda self: None):
        agent = ErrorAgent.__new__(ErrorAgent)
        agent._llm = MagicMock()
        agent._prompt = MagicMock()
        return agent


def test_run_returns_empty_when_no_errors() -> None:
    assert _make_agent().run([]) == {'explanations': []}


def test_run_sanitizes_and_returns_explanations() -> None:
    agent = _make_agent()
    chain = MagicMock()
    chain.invoke.return_value = MagicMock(content='[{"field":"patient_name","plain_english":"Missing patient name","suggested_fix":"Enter the patient name"}]')
    agent._prompt.__or__ = MagicMock(return_value=chain)
    result = agent.run([{'field': 'patient_name', 'item_number': '2', 'message': 'Required', 'secret': 'omit'}])
    assert result['explanations'][0]['field'] == 'patient_name'


def test_parse_explanations_falls_back_on_invalid_json() -> None:
    result = _make_agent()._parse_explanations('invalid', [{'field': 'f1', 'item_number': '1', 'message': 'Bad'}])
    assert result[0]['field'] == 'f1'


def test_parse_explanations_accepts_dict_wrapper() -> None:
    result = _make_agent()._parse_explanations('{"explanations":[{"field":"f1","plain_english":"Text","suggested_fix":"Fix"}]}', [])
    assert result[0]['suggested_fix'] == 'Fix'
