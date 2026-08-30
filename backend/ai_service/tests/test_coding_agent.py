from __future__ import annotations

from unittest.mock import MagicMock, patch

from ai_service.agents.coding_agent import CodingAgent


def _make_agent() -> CodingAgent:
    with patch.object(CodingAgent, '__init__', lambda self: None):
        agent = CodingAgent.__new__(CodingAgent)
        agent._rag = MagicMock()
        agent._llm = MagicMock()
        agent._prompt = MagicMock()
        return agent


def test_run_returns_max_three_suggestions() -> None:
    agent = _make_agent()
    agent._rag.retrieve.return_value = [{'text': 'context', 'source': 'codes.csv', 'relevance': 0.9}]
    chain = MagicMock()
    chain.invoke.return_value = MagicMock(content='[{"code":"A1234","description":"One","confidence":0.9,"rationale":"r1"},{"code":"A1235","description":"Two","confidence":0.8,"rationale":"r2"},{"code":"A1236","description":"Three","confidence":0.7,"rationale":"r3"},{"code":"A1237","description":"Four","confidence":0.6,"rationale":"r4"}]')
    agent._prompt.__or__ = MagicMock(return_value=chain)
    result = agent.run('office visit', 'CPT')
    assert len(result['suggestions']) == 3


def test_parse_suggestions_extracts_fields() -> None:
    result = _make_agent()._parse_suggestions('[{"code":"z00.00","description":"Exam","confidence":0.85,"rationale":"annual"}]')
    assert result[0]['code'] == 'Z00.00'
    assert result[0]['confidence'] == 0.85


def test_parse_suggestions_returns_empty_for_invalid_json() -> None:
    assert _make_agent()._parse_suggestions('not-json') == []
