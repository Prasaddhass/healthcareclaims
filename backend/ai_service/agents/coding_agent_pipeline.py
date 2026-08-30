from __future__ import annotations

import json
import re
from typing import Any

from langchain_core.messages import AIMessage
from langchain_core.prompts import ChatPromptTemplate

from ai_service.agents.pipeline_state import AgentState
from ai_service.config import AISettings, ai_settings
from ai_service.llm.llm_factory import get_llm
from ai_service.rag.rag_engine import RAGEngine

CODING_REVIEW_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            'system',
            'You are a medical coding specialist. Review the claim codes against the supplied guidance and return JSON only with keys has_issues and suggestions.',
        ),
        ('human', 'Guidelines:\n{guidelines}\n\nDiagnosis: {diagnosis_codes}\nProcedures: {procedure_codes}'),
    ]
)


class CodingAgentNode:
    def __init__(self, settings: AISettings | None = None, llm: Any | None = None, rag: RAGEngine | None = None) -> None:
        self._settings = settings or ai_settings
        self._llm = llm or get_llm(self._settings)
        self._rag = rag or RAGEngine(self._settings)

    def __call__(self, state: AgentState) -> AgentState:
        claim_data = state.get('claim_data', {})
        diagnosis_codes = [item.get('IcdCode', '') for item in claim_data.get('diagnosis', [])]
        procedure_codes = [item.get('ProcedureCode', '') for item in claim_data.get('service_lines', [])]
        guidelines = self._rag.retrieve(
            f"coding guidelines for {' '.join(diagnosis_codes[:3])} {' '.join(procedure_codes[:3])}",
            top_k=5,
        )
        context = '\n\n'.join(item['text'] for item in guidelines) or 'No specific guidelines found.'
        response = (CODING_REVIEW_PROMPT | self._llm).invoke(
            {
                'guidelines': context,
                'diagnosis_codes': ', '.join(diagnosis_codes),
                'procedure_codes': ', '.join(procedure_codes),
            }
        )
        content = response.content if hasattr(response, 'content') else str(response)
        try:
            coding_result = json.loads(re.sub(r'```(?:json)?', '', content).strip().strip('`'))
        except json.JSONDecodeError:
            coding_result = {'has_issues': False, 'suggestions': []}
        messages = list(state.get('messages', []))
        messages.append(AIMessage(content='Coding review complete'))
        return {**state, 'coding_result': coding_result, 'messages': messages}
