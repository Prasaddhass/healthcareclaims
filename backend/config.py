"""
Application settings loaded from .env via pydantic-settings.
Every value can be overridden with an environment variable of the same name.
"""
from __future__ import annotations

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        extra='ignore',
    )

    ENV: str = 'development'
    VERSION: str = '1.0.0'

    DATABASE_URL: str = (
        'DRIVER={ODBC Driver 17 for SQL Server};'
        'Server=localhost\\sqlexpress;'
        'Database=HealthCareDB;'
        'Trusted_Connection=yes;'
    )

    JWT_SECRET_KEY: str = 'CHANGE_ME_BEFORE_PRODUCTION'
    JWT_ALGORITHM: str = 'HS256'
    JWT_EXPIRY_HOURS: int = 8

    CORS_ORIGINS: List[str] = ['http://localhost:5173']
    UPLOAD_DIR: str = '../uploads'

    LLM_PROVIDER: str = 'openai'
    OPENAI_API_KEY: str = ''
    AZURE_ENDPOINT: str = ''
    AZURE_API_KEY: str = ''
    AZURE_DEPLOYMENT: str = ''


settings = Settings()
