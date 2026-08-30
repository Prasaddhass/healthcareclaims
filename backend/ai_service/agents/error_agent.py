from __future__ import annotations

import json
import logging
import re
from typing import Any

from ai_service.agents.base_agent import BaseAgent
from ai_service.config import AISettings, ai_settings
from ai_service.llm.llm_factory import get_llm
from ai_service.llm.prompt_templates import ERROR_EXPLANATION_PROMPT

logger = logging.getLogger(__name__)


class ErrorAgent(BaseAgent):
    def __init__(self, settings: AISettings | None = None, llm: Any | None = None) -> None:
        self._settings = settings or ai_settings
        self._llm = llm or get_llm(self._settings)
        self._prompt = ERROR_EXPLANATION_PROMPT

    def run(self, errors: list[dict[str, Any]]) -> dict[str, Any]:
        if not errors:
            return {'explanations': []}
        safe_errors = [{'field': str(error.get('field', '')), 'item_number': str(error.get('item_number', '')), 'message': str(error.get('message', ''))} for error in errors if error.get('field') and error.get('message')]
        if not safe_errors:
            return {'explanations': []}
        chain = self._prompt | self._llm
        try:
            response = chain.invoke({'errors_json': json.dumps(safe_errors, indent=2)})
            content = response.content if hasattr(response, 'content') else str(response)
        except Exception as exc:
            logger.error('LLM invocation error in ErrorAgent: %s', type(exc).__name__)
            return {'explanations': []}
        return {'explanations': self._parse_explanations(content, safe_errors)}

    def _parse_explanations(self, content: str, original_errors: list[dict[str, Any]]) -> list[dict[str, Any]]:
        try:
            cleaned = re.sub(r'```(?:json)?', '', content).strip().strip('`')
            data = json.loads(cleaned)
        except (json.JSONDecodeError, TypeError):
            return [{'field': error['field'], 'plain_english': f"Field '{error['field']}' (Item {error['item_number']}): {error['message']}", 'suggested_fix': 'Please review the CMS-1500 instructions for this field.'} for error in original_errors]
        if isinstance(data, dict):
            data = data.get('explanations', [])
        if not isinstance(data, list):
            return []
        return [self._validate_explanation(item) for item in data if isinstance(item, dict)]

    @staticmethod
    def _validate_explanation(item: dict[str, Any]) -> dict[str, Any]:
        return {'field': str(item.get('field', '')).strip(), 'plain_english': str(item.get('plain_english', '')).strip(), 'suggested_fix': str(item.get('suggested_fix', '')).strip()}
