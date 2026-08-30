from __future__ import annotations

import json
import logging
import re
from typing import Any

from ai_service.agents.base_agent import BaseAgent
from ai_service.config import AISettings, ai_settings
from ai_service.llm.llm_factory import get_llm
from ai_service.llm.prompt_templates import CODE_SUGGESTION_PROMPT
from ai_service.rag.rag_engine import RAGEngine

logger = logging.getLogger(__name__)


class CodingAgent(BaseAgent):
    def __init__(self, settings: AISettings | None = None, llm: Any | None = None, rag: RAGEngine | None = None) -> None:
        self._settings = settings or ai_settings
        self._llm = llm or get_llm(self._settings)
        self._rag = rag or RAGEngine(self._settings)
        self._prompt = CODE_SUGGESTION_PROMPT

    def run(self, description: str, code_type: str) -> dict[str, Any]:
        rag_chunks = self._rag.retrieve(query=f'{code_type} codes for: {description}', top_k=5)
        context = '\n\n'.join(f"Source: {item['source']}\n{item['text']}" for item in rag_chunks)
        chain = self._prompt | self._llm
        try:
            response = chain.invoke(
                {
                    'description': description,
                    'code_type': code_type,
                    'context': context or 'No context available.',
                }
            )
            content = response.content if hasattr(response, 'content') else str(response)
        except Exception as exc:
            logger.error('LLM invocation error in CodingAgent: %s', type(exc).__name__)
            return {'suggestions': []}
        return {'suggestions': self._parse_suggestions(content)[:3]}

    def _parse_suggestions(self, content: str) -> list[dict[str, Any]]:
        try:
            cleaned = re.sub(r'```(?:json)?', '', content).strip().strip('`')
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            return []
        if isinstance(data, dict):
            data = data.get('suggestions', [])
        if not isinstance(data, list):
            return []
        return [self._validate_suggestion(item) for item in data if isinstance(item, dict)]

    @staticmethod
    def _validate_suggestion(item: dict[str, Any]) -> dict[str, Any]:
        return {
            'code': str(item.get('code', '')).strip().upper(),
            'description': str(item.get('description', '')).strip(),
            'confidence': float(item.get('confidence', 0.0)),
            'rationale': str(item.get('rationale', '')).strip(),
        }
