"""AI endpoints for code suggestions, error explanations, and chat."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from config import settings
from dependencies import get_current_user, get_db
from repositories.db_repository import DBRepository
from schemas.ai_schemas import ChatRequest, ChatResponse, ExplainErrorsRequest, ExplainErrorsResponse, SuggestCodesRequest, SuggestCodesResponse
from schemas.auth_schemas import UserSchema

router = APIRouter(dependencies=[Depends(get_current_user)])
logger = logging.getLogger(__name__)


def _check_ai_available() -> None:
    has_openai = bool(getattr(settings, 'OPENAI_API_KEY', ''))
    has_azure = bool(getattr(settings, 'AZURE_ENDPOINT', '') and getattr(settings, 'AZURE_API_KEY', ''))
    if not has_openai and not has_azure:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='AI service not configured ? set OPENAI_API_KEY or AZURE credentials in .env',
        )


@router.post('/suggest-codes', response_model=SuggestCodesResponse, summary='Suggest ICD/CPT codes')
def suggest_codes(body: SuggestCodesRequest, _current_user: UserSchema = Depends(get_current_user)) -> SuggestCodesResponse:
    _check_ai_available()
    try:
        from ai_service.orchestrator import AIOrchestrator

        result = AIOrchestrator().suggest_codes(body.description, body.code_type)
        return SuggestCodesResponse(suggestions=result.get('suggestions', []))
    except Exception as exc:
        logger.error('Code suggestion error: %s', type(exc).__name__)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='An error occurred') from exc


@router.post('/explain-errors', response_model=ExplainErrorsResponse, summary='Explain validation errors')
def explain_errors(body: ExplainErrorsRequest, _current_user: UserSchema = Depends(get_current_user)) -> ExplainErrorsResponse:
    if not body.errors:
        return ExplainErrorsResponse(explanations=[])
    _check_ai_available()
    try:
        from ai_service.orchestrator import AIOrchestrator

        result = AIOrchestrator().explain_errors([item.model_dump() for item in body.errors])
        return ExplainErrorsResponse(explanations=result.get('explanations', []))
    except Exception as exc:
        logger.error('Error explanation error: %s', type(exc).__name__)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='An error occurred') from exc


@router.post('/chat', response_model=ChatResponse, summary='Chat with the AI assistant')
def chat(body: ChatRequest, _current_user: UserSchema = Depends(get_current_user), db: DBRepository = Depends(get_db)) -> ChatResponse:
    _check_ai_available()
    claim_context: dict | None = None
    if body.claim_id:
        try:
            result_sets = db.execute_sp_multi('sp_GetClaimById', (body.claim_id,))
            if result_sets and result_sets[0]:
                claim_context = {
                    'header': result_sets[0][0],
                    'diagnosis': result_sets[1] if len(result_sets) > 1 else [],
                    'service_lines': result_sets[2] if len(result_sets) > 2 else [],
                }
        except Exception:
            claim_context = None

    try:
        from ai_service.orchestrator import AIOrchestrator

        result = AIOrchestrator().chat(message=body.message, claim_context=claim_context, history=[item.model_dump() for item in body.conversation_history])
        return ChatResponse(response=result.get('response', ''), sources=result.get('sources', []))
    except Exception as exc:
        logger.error('Chat error: %s', type(exc).__name__)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='An error occurred') from exc
