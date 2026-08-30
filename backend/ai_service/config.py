"""Configuration for optional AI features."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class AISettings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    LLM_PROVIDER: str = 'openai'
    OPENAI_API_KEY: str = ''
    OPENAI_MODEL: str = 'gpt-4o-mini'
    AZURE_ENDPOINT: str = ''
    AZURE_API_KEY: str = ''
    AZURE_DEPLOYMENT: str = ''
    AZURE_API_VERSION: str = '2024-02-01'
    EMBEDDING_PROVIDER: str = 'openai'
    CHROMA_PERSIST_DIR: str = './ai_data/chroma'
    DENIAL_RISK_THRESHOLD: float = 0.20

    def is_configured(self) -> bool:
        if self.LLM_PROVIDER == 'azure':
            return bool(self.AZURE_ENDPOINT and self.AZURE_API_KEY and self.AZURE_DEPLOYMENT)
        return bool(self.OPENAI_API_KEY)


ai_settings = AISettings()
