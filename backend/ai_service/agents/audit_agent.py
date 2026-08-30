from __future__ import annotations

from typing import Any

from langchain_core.messages import AIMessage

from ai_service.agents.pipeline_state import AgentState
from ai_service.config import AISettings, ai_settings


class AuditReviewAgent:
    def __init__(self, settings: AISettings | None = None) -> None:
        self._settings = settings or ai_settings

    def __call__(self, state: AgentState, db: Any | None = None) -> AgentState:
        validation_result = state.get('validation_result') or {}
        coding_result = state.get('coding_result') or {}
        denial_risk = float(state.get('denial_risk') or 0.0)
        decision = state.get('human_decision') or 'auto-approved'
        anomalies: list[str] = []
        if denial_risk > self._settings.DENIAL_RISK_THRESHOLD and decision == 'approved':
            anomalies.append(f'High denial risk ({denial_risk:.0%}) approved manually')
        if coding_result.get('has_issues') and decision != 'returned':
            anomalies.append('Coding issues remained at approval time')
        audit_summary = 'AI Pipeline Summary | ' + f"Validation: {'PASSED' if validation_result.get('passed') else 'ISSUES'} | " + f"Coding: {'OK' if not coding_result.get('has_issues') else 'ISSUES'} | " + f'Denial Risk: {denial_risk:.0%} | ' + f'Human Decision: {decision} | ' + f"Anomalies: {'; '.join(anomalies) if anomalies else 'None'}"
        if db is not None:
            db.execute_sp_no_result('sp_UpdateValidationStatus', (state.get('claim_id', ''), 'Sent', 'AI-Pipeline', audit_summary))
        notes = list(state.get('audit_notes', []))
        notes.append(audit_summary)
        messages = list(state.get('messages', []))
        messages.append(AIMessage(content='Audit complete. Claim marked Sent.'))
        return {**state, 'pipeline_status': 'approved', 'audit_notes': notes, 'messages': messages}
