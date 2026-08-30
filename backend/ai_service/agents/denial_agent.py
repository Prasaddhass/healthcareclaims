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

DENIAL_PREDICTION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            'system',
            'You are a healthcare claims denial risk analyst. Return JSON only with keys denial_risk, reasoning, risk_factors. denial_risk must be between 0.0 and 1.0.',
        ),
        (
            'human',
            'Policy context:\n{policy_context}\n\nPayer: {payer}\nDiagnosis: {diagnosis}\nProcedures: {procedures}\nPrior auth present: {has_prior_auth}\nPOS: {pos}',
        ),
    ]
)


class DenialPredictionAgent:
    def __init__(self, settings: AISettings | None = None, llm: Any | None = None, rag: RAGEngine | None = None) -> None:
        self._settings = settings or ai_settings
        self._llm = llm or get_llm(self._settings)
        self._rag = rag or RAGEngine(self._settings)

    def __call__(self, state: AgentState) -> AgentState:
        claim_data = state.get('claim_data', {})
        header = claim_data.get('header', {})
        payer = header.get('InsuranceName', 'Unknown')
        diagnosis = [item.get('IcdCode', '') for item in claim_data.get('diagnosis', [])]
        procedures = [item.get('ProcedureCode', '') for item in claim_data.get('service_lines', [])]
        positions = [str(item.get('PlaceOfService', '')) for item in claim_data.get('service_lines', []) if item.get('PlaceOfService')]
        prior_auth = bool(str(header.get('PriorAuthNumber', '') or '').strip())
        policy_chunks = self._rag.retrieve(f'{payer} denial policy {" ".join(procedures[:2])} {" ".join(diagnosis[:2])}', top_k=5)
        context = '\n\n'.join(item['text'] for item in policy_chunks) or 'No policy context available.'
        response = (DENIAL_PREDICTION_PROMPT | self._llm).invoke(
            {
                'policy_context': context,
                'payer': payer,
                'diagnosis': ', '.join(diagnosis),
                'procedures': ', '.join(procedures),
                'has_prior_auth': 'Yes' if prior_auth else 'No',
                'pos': ', '.join(positions) or 'Unknown',
            }
        )
        content = response.content if hasattr(response, 'content') else str(response)
        try:
            parsed = json.loads(re.sub(r'```(?:json)?', '', content).strip().strip('`'))
            denial_risk = float(parsed.get('denial_risk', 0.5))
        except (json.JSONDecodeError, ValueError):
            parsed = {'denial_risk': 0.5, 'reasoning': 'Parse error', 'risk_factors': []}
            denial_risk = 0.5
        denial_risk = max(0.0, min(1.0, denial_risk))
        notes = list(state.get('audit_notes', []))
        notes.append(f"Denial risk score: {denial_risk:.0%} - {parsed.get('reasoning', '')}")
        messages = list(state.get('messages', []))
        messages.append(AIMessage(content=f'Denial risk estimated at {denial_risk:.0%}'))
        return {**state, 'denial_risk': denial_risk, 'audit_notes': notes, 'messages': messages}
