from __future__ import annotations

from typing import Any

from ai_service.agents.chat_agent import _strip_phi
from ai_service.agents.pipeline_state import AgentState
from ai_service.config import AISettings, ai_settings
from ai_service.llm.llm_factory import get_llm
from ai_service.llm.prompt_templates import CHAT_QA_PROMPT
from ai_service.rag.rag_engine import RAGEngine


class ClaimQAAgentNode:
    def __init__(self, settings: AISettings | None = None, llm: Any | None = None, rag: RAGEngine | None = None) -> None:
        self._settings = settings or ai_settings
        self._llm = llm or get_llm(self._settings)
        self._rag = rag or RAGEngine(self._settings)

    def answer(self, question: str, state: AgentState) -> dict[str, Any]:
        chunks = self._rag.retrieve(question, top_k=5)
        context = '\n\n'.join(f"[{item['source']}]\n{item['text']}" for item in chunks)
        safe_claim = _strip_phi(state.get('claim_data', {}))
        header = safe_claim.get('header', {}) if isinstance(safe_claim, dict) else {}
        claim_context = f"Claim context: Status={header.get('ValidationStatus', 'N/A')}, Insurance={header.get('InsuranceName', 'N/A')}"
        response = (CHAT_QA_PROMPT | self._llm).invoke(
            {
                'message': question,
                'context': context or 'No specific reference context available.',
                'claim_context': claim_context,
                'chat_history': [],
            }
        )
        answer = response.content if hasattr(response, 'content') else str(response)
        sources = [
            {'document': item['source'], 'excerpt': item['text'][:150], 'relevance': float(item['relevance'])}
            for item in chunks
            if float(item['relevance']) > 0.4
        ]
        return {'answer': answer, 'sources': sources}
