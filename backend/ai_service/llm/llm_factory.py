"""Factory for chat-model providers used by AI features."""
from __future__ import annotations

from langchain_core.language_models import BaseChatModel
from langchain_openai import AzureChatOpenAI, ChatOpenAI

from ai_service.config import AISettings, ai_settings


def get_llm(settings: AISettings | None = None) -> BaseChatModel:
    cfg = settings or ai_settings
    provider = cfg.LLM_PROVIDER.lower()
    if provider == 'openai':
        return ChatOpenAI(model=cfg.OPENAI_MODEL, api_key=cfg.OPENAI_API_KEY, temperature=0)
    if provider == 'azure':
        return AzureChatOpenAI(
            azure_endpoint=cfg.AZURE_ENDPOINT,
            api_key=cfg.AZURE_API_KEY,
            azure_deployment=cfg.AZURE_DEPLOYMENT,
            api_version=cfg.AZURE_API_VERSION,
            temperature=0,
        )
    raise ValueError(f"Unknown LLM_PROVIDER: '{cfg.LLM_PROVIDER}'")
