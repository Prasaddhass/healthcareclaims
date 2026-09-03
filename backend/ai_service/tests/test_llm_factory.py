from __future__ import annotations

from unittest.mock import patch

import pytest
from pydantic import SecretStr

from ai_service.config import AISettings
from ai_service.llm.llm_factory import get_llm


def test_get_llm_returns_openai_client() -> None:
    settings = AISettings(
        OPENAI_API_KEY='key',
        OPENAI_MODEL='gpt-4o-mini',
        OPENAI_BASE_URL='https://example.com/v1',
        LLM_PROVIDER='openai',
    )
    with patch('ai_service.llm.llm_factory.ChatOpenAI', return_value='openai-client') as mocked:
        client = get_llm(settings)
    assert client == 'openai-client'
    mocked.assert_called_once_with(
        model='gpt-4o-mini',
        api_key=SecretStr('key'),
        base_url='https://example.com/v1',
        temperature=0,
    )


def test_get_llm_returns_azure_client() -> None:
    settings = AISettings(LLM_PROVIDER='azure', AZURE_ENDPOINT='https://example.azure.com', AZURE_API_KEY='key', AZURE_DEPLOYMENT='deployment')
    with patch('ai_service.llm.llm_factory.AzureChatOpenAI', return_value='azure-client') as mocked:
        client = get_llm(settings)
    assert client == 'azure-client'
    mocked.assert_called_once()


def test_get_llm_raises_for_unknown_provider() -> None:
    with pytest.raises(ValueError):
        get_llm(AISettings(LLM_PROVIDER='other'))


def test_is_configured_true_for_openai() -> None:
    assert AISettings(OPENAI_API_KEY='key', LLM_PROVIDER='openai').is_configured() is True


def test_is_configured_false_without_credentials() -> None:
    assert AISettings(OPENAI_API_KEY='', LLM_PROVIDER='openai').is_configured() is False
