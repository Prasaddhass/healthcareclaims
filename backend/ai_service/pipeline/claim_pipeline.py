from __future__ import annotations

from pathlib import Path

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph

from ai_service.agents.audit_agent import AuditReviewAgent
from ai_service.agents.coding_agent_pipeline import CodingAgentNode
from ai_service.agents.denial_agent import DenialPredictionAgent
from ai_service.agents.pipeline_state import AgentState
from ai_service.agents.validation_agent import ClaimValidationAgent


def _human_review_node(state: AgentState) -> AgentState:
    return {**state, 'pipeline_status': 'human_review'}


def _returned_node(state: AgentState) -> AgentState:
    return {**state, 'pipeline_status': 'returned'}


def _route_after_coding(state: AgentState) -> str:
    return 'human_review' if (state.get('coding_result') or {}).get('has_issues') else 'validation'


def _route_after_validation(state: AgentState) -> str:
    return 'human_review' if not (state.get('validation_result') or {}).get('passed', False) else 'denial_risk'


def _route_after_denial(state: AgentState) -> str:
    return 'human_review' if float(state.get('denial_risk') or 0.0) > 0.20 else 'audit'


def _route_after_human_review(state: AgentState):
    if state.get('human_decision') == 'approved':
        return 'audit'
    if state.get('human_decision') == 'returned':
        return 'returned'
    return END


def build_pipeline(db: object):
    Path('ai_data').mkdir(parents=True, exist_ok=True)
    graph = StateGraph(AgentState)
    graph.add_node('coding', CodingAgentNode())
    graph.add_node('validation', ClaimValidationAgent(db))
    graph.add_node('denial_risk', DenialPredictionAgent())
    graph.add_node('human_review', _human_review_node)
    graph.add_node('audit', lambda state: AuditReviewAgent()(state, db=db))
    graph.add_node('returned', _returned_node)
    graph.add_edge(START, 'coding')
    graph.add_conditional_edges('coding', _route_after_coding, {'validation': 'validation', 'human_review': 'human_review'})
    graph.add_conditional_edges('validation', _route_after_validation, {'denial_risk': 'denial_risk', 'human_review': 'human_review'})
    graph.add_conditional_edges('denial_risk', _route_after_denial, {'audit': 'audit', 'human_review': 'human_review'})
    graph.add_conditional_edges('human_review', _route_after_human_review, {'audit': 'audit', 'returned': 'returned', END: END})
    graph.add_edge('audit', END)
    graph.add_edge('returned', END)
    return graph.compile(checkpointer=SqliteSaver.from_conn_string('ai_data/pipeline_checkpoints.db'))


class ClaimPipeline:
    def __init__(self, db: object) -> None:
        self._graph = build_pipeline(db)

    def start(self, claim_id: str, claim_data: dict) -> AgentState:
        initial_state: AgentState = {'claim_id': claim_id, 'claim_data': claim_data, 'validation_result': None, 'coding_result': None, 'denial_risk': None, 'human_decision': None, 'audit_notes': [], 'messages': [], 'pipeline_status': 'running'}
        return self._graph.invoke(initial_state, config={'configurable': {'thread_id': claim_id}})

    def resume(self, claim_id: str, human_decision: str) -> AgentState:
        return self._graph.invoke({'human_decision': human_decision}, config={'configurable': {'thread_id': claim_id}})
