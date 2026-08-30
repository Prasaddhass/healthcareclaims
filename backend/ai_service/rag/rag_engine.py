"""Simple Chroma-backed retrieval engine for AI features."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_community.vectorstores import Chroma

from ai_service.config import AISettings, ai_settings
from ai_service.rag.embedding_factory import get_embeddings

logger = logging.getLogger(__name__)
CHUNK_SIZE = 512
CHUNK_OVERLAP = 64
COLLECTION_NAME = 'healthcare-claims-kb'


class RAGEngine:
    def __init__(self, settings: AISettings | None = None, embeddings: Any | None = None, vector_store: Any | None = None) -> None:
        self._settings = settings or ai_settings
        self._embeddings = embeddings or get_embeddings(self._settings)
        self._vector_store = vector_store or Chroma(collection_name=COLLECTION_NAME, embedding_function=self._embeddings, persist_directory=self._settings.CHROMA_PERSIST_DIR)

    def ingest(self, docs: list[Document]) -> int:
        if not docs:
            return 0
        Path(self._settings.CHROMA_PERSIST_DIR).mkdir(parents=True, exist_ok=True)
        splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
        chunks = splitter.split_documents(docs)
        self._vector_store.add_documents(chunks)
        persist = getattr(self._vector_store, 'persist', None)
        if callable(persist):
            persist()
        return len(chunks)

    def retrieve(self, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        try:
            results = self._vector_store.similarity_search_with_relevance_scores(query, k=top_k)
        except Exception as exc:
            logger.error('RAG retrieval failed: %s', type(exc).__name__)
            return []
        payload: list[dict[str, Any]] = []
        for document, score in results:
            source = document.metadata.get('source') or document.metadata.get('file_path') or 'unknown'
            payload.append({'text': document.page_content, 'source': str(source), 'relevance': float(score)})
        return payload
