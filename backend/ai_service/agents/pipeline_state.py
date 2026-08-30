from __future__ import annotations

from typing import Any, TypedDict


class AgentState(TypedDict, total=False):
    claim_id: str
    claim_data: dict[str, Any]
    validation_result: dict[str, Any] | None
    coding_result: dict[str, Any] | None
    denial_risk: float | None
    human_decision: str | None
    audit_notes: list[str]
    messages: list[Any]
    pipeline_status: str
