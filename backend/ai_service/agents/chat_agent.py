from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage

from ai_service.agents.base_agent import BaseAgent
from ai_service.config import AISettings, ai_settings
from ai_service.llm.llm_factory import get_llm
from ai_service.llm.prompt_templates import CHAT_QA_PROMPT
from ai_service.rag.rag_engine import RAGEngine

logger = logging.getLogger(__name__)
PHI_FIELDS = {
    'PatientName',
    'PatientBirthDate',
    'PatientPhone',
    'PatientStreet',
    'PatientCity',
    'PatientZip',
    'FederalTaxId',
    'InsuredName',
    'InsuredDOB',
    'ReferringProviderName',
}


def _strip_phi(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _strip_phi(item) for key, item in value.items() if key not in PHI_FIELDS}
    if isinstance(value, list):
        return [_strip_phi(item) for item in value]
    return value


class ChatAgent(BaseAgent):
    def __init__(self, settings: AISettings | None = None, llm: Any | None = None, rag: RAGEngine | None = None) -> None:
        self._settings = settings or ai_settings
        self._llm = llm or get_llm(self._settings)
        self._rag = rag or RAGEngine(self._settings)
        self._prompt = CHAT_QA_PROMPT

    def run(self, message: str, claim_context: dict | None, history: list[dict[str, Any]]) -> dict[str, Any]:
        chunks = self._rag.retrieve(query=message, top_k=5)
        context = '\n\n'.join(f"[{item['source']}]\n{item['text']}" for item in chunks)
        sources = [
            {
                'document': str(item['source']),
                'excerpt': item['text'][:200] + ('...' if len(item['text']) > 200 else ''),
                'relevance': float(item['relevance']),
            }
            for item in chunks
            if float(item['relevance']) > 0.4
        ]
        safe_context = _strip_phi(claim_context or {})
        header = safe_context.get('header', {}) if isinstance(safe_context, dict) else {}
        claim_text = ''
        if safe_context:
            diagnosis_codes = [item.get('IcdCode') for item in safe_context.get('diagnosis', [])]
            claim_text = (
                'Claim context (non-PHI only):\n'
                f"Status: {header.get('ValidationStatus', 'Unknown')}\n"
                f"Insurance: {header.get('InsuranceName', 'N/A')}\n"
                f"Policy: {header.get('PolicyId', 'N/A')}\n"
                f'Diagnosis codes: {diagnosis_codes}'
            )
        lc_history: list[Any] = []
        for item in history:
            if item.get('role') == 'assistant':
                lc_history.append(AIMessage(content=str(item.get('content', ''))))
            else:
                lc_history.append(HumanMessage(content=str(item.get('content', ''))))
        chain = self._prompt | self._llm
        try:
            response = chain.invoke(
                {
                    'message': message,
                    'context': context or 'No specific reference context available.',
                    'claim_context': claim_text,
                    'chat_history': lc_history,
                }
            )
            response_text = response.content if hasattr(response, 'content') else str(response)
        except Exception as exc:
            logger.error('LLM invocation error in ChatAgent: %s', type(exc).__name__)
            response_text = 'I encountered an error while processing your question. Please try again.'
        return {'response': response_text, 'sources': sources}
