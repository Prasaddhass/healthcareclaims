"""Embedding provider factory for the RAG engine."""
from __future__ import annotations

from langchain_core.embeddings import Embeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_openai import OpenAIEmbeddings

from ai_service.config import AISettings, ai_settings


def get_embeddings(settings: AISettings | None = None) -> Embeddings:
    cfg = settings or ai_settings
    if cfg.EMBEDDING_PROVIDER.lower() == 'huggingface' or not cfg.OPENAI_API_KEY.get_secret_value():
        return HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')
    return OpenAIEmbeddings(
        model=cfg.OPENAI_EMBEDDING_MODEL,
        api_key=cfg.OPENAI_API_KEY,
        base_url=cfg.OPENAI_BASE_URL or None,
    )
