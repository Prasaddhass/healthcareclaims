"""Configuration for optional AI features."""
from __future__ import annotations

from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]


class AISettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / '.env',
        env_file_encoding='utf-8',
        extra='ignore',
    )

    LLM_PROVIDER: str = 'openai'
    OPENAI_API_KEY: SecretStr = SecretStr('')
    OPENAI_MODEL: str = 'gpt-4o-mini'
    OPENAI_BASE_URL: str = ''
    AZURE_ENDPOINT: str = ''
    AZURE_API_KEY: SecretStr = SecretStr('')
    AZURE_DEPLOYMENT: str = ''
    AZURE_API_VERSION: str = '2024-02-01'
    EMBEDDING_PROVIDER: str = 'openai'
    OPENAI_EMBEDDING_MODEL: str = 'text-embedding-3-small'
    CHROMA_PERSIST_DIR: str = './ai_data/chroma'
    DENIAL_RISK_THRESHOLD: float = 0.20

    def is_configured(self) -> bool:
        if self.LLM_PROVIDER == 'azure':
            return bool(
                self.AZURE_ENDPOINT
                and self.AZURE_API_KEY.get_secret_value()
                and self.AZURE_DEPLOYMENT
            )
        return bool(self.OPENAI_API_KEY.get_secret_value())


ai_settings = AISettings()
