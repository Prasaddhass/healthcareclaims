from __future__ import annotations

from unittest.mock import MagicMock, patch

from ai_service.agents.chat_agent import ChatAgent, _strip_phi


def _make_agent() -> ChatAgent:
    with patch.object(ChatAgent, '__init__', lambda self: None):
        agent = ChatAgent.__new__(ChatAgent)
        agent._rag = MagicMock()
        agent._llm = MagicMock()
        agent._prompt = MagicMock()
        return agent


def test_strip_phi_removes_sensitive_fields() -> None:
    assert _strip_phi({'PatientName': 'Jane', 'InsuranceName': 'Aetna'}) == {'InsuranceName': 'Aetna'}


def test_run_returns_response_and_filtered_sources() -> None:
    agent = _make_agent()
    agent._rag.retrieve.return_value = [{'text': 'Relevant text', 'source': 'policy.pdf', 'relevance': 0.9}, {'text': 'Low text', 'source': 'other.pdf', 'relevance': 0.3}]
    chain = MagicMock()
    chain.invoke.return_value = MagicMock(content='Use prior authorization for this payer.')
    agent._prompt.__or__ = MagicMock(return_value=chain)
    result = agent.run('Need auth?', {'header': {'PatientName': 'Jane', 'InsuranceName': 'Aetna'}}, [])
    assert result['response'] == 'Use prior authorization for this payer.'
    assert len(result['sources']) == 1


def test_run_supports_conversation_history() -> None:
    agent = _make_agent()
    agent._rag.retrieve.return_value = []
    chain = MagicMock()
    chain.invoke.return_value = MagicMock(content='History aware answer')
    agent._prompt.__or__ = MagicMock(return_value=chain)
    assert agent.run('Question', None, [{'role': 'assistant', 'content': 'Earlier'}])['response'] == 'History aware answer'


def test_run_returns_fallback_on_llm_error() -> None:
    agent = _make_agent()
    agent._rag.retrieve.return_value = []
    chain = MagicMock()
    chain.invoke.side_effect = RuntimeError('boom')
    agent._prompt.__or__ = MagicMock(return_value=chain)
    assert 'encountered an error' in agent.run('Question', None, [])['response']
