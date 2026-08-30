"""Claims router ? CRUD, validation, sending, and AI pipeline actions."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from config import settings
from dependencies import get_current_user, get_db
from repositories.db_repository import DBRepository
from schemas.auth_schemas import UserSchema
from schemas.claim_schemas import ClaimCreateRequest, ClaimCreatedResponse, ClaimDetailResponse, ClaimsListResponse, ClaimUpdatedResponse, SendResult, ValidationResult
from services.claims_service import ClaimsService

router = APIRouter(dependencies=[Depends(get_current_user)])


def _get_service(db: DBRepository = Depends(get_db)) -> ClaimsService:
    return ClaimsService(db)


def _check_ai_available() -> None:
    has_openai = bool(getattr(settings, 'OPENAI_API_KEY', ''))
    has_azure = bool(getattr(settings, 'AZURE_ENDPOINT', '') and getattr(settings, 'AZURE_API_KEY', ''))
    if not has_openai and not has_azure:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='AI service not configured ? set OPENAI_API_KEY or AZURE credentials in .env',
        )


@router.get('', response_model=ClaimsListResponse, summary='List claims (paginated)')
def list_claims(
    page: int = 1,
    page_size: int = 20,
    validation_status: str | None = None,
    search_term: str | None = None,
    current_user: UserSchema = Depends(get_current_user),
    service: ClaimsService = Depends(_get_service),
) -> ClaimsListResponse:
    return service.list_claims(
        page=page,
        page_size=page_size,
        validation_status=validation_status,
        search_term=search_term,
        user_id=current_user.user_id,
    )


@router.post('', response_model=ClaimCreatedResponse, status_code=status.HTTP_201_CREATED, summary='Create a new claim')
def create_claim(
    payload: ClaimCreateRequest,
    current_user: UserSchema = Depends(get_current_user),
    service: ClaimsService = Depends(_get_service),
) -> ClaimCreatedResponse:
    return service.create_claim(payload=payload, user_id=current_user.user_id, username=current_user.username)


@router.get('/{claim_id}', response_model=ClaimDetailResponse, summary='Get claim detail')
def get_claim(claim_id: str, service: ClaimsService = Depends(_get_service)) -> ClaimDetailResponse:
    try:
        return service.get_claim(claim_id)
    except (KeyError, IndexError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Claim not found') from exc


@router.put('/{claim_id}', response_model=ClaimUpdatedResponse, summary='Update a claim')
def update_claim(
    claim_id: str,
    payload: ClaimCreateRequest,
    current_user: UserSchema = Depends(get_current_user),
    service: ClaimsService = Depends(_get_service),
) -> ClaimUpdatedResponse:
    return service.update_claim(claim_id=claim_id, payload=payload, username=current_user.username)


@router.delete('/{claim_id}', status_code=status.HTTP_204_NO_CONTENT, summary='Soft-delete a claim')
def delete_claim(
    claim_id: str,
    current_user: UserSchema = Depends(get_current_user),
    service: ClaimsService = Depends(_get_service),
) -> None:
    service.delete_claim(claim_id=claim_id, username=current_user.username)


@router.post('/{claim_id}/validate', response_model=ValidationResult, summary='Run validation on a claim')
def validate_claim(
    claim_id: str,
    current_user: UserSchema = Depends(get_current_user),
    service: ClaimsService = Depends(_get_service),
) -> ValidationResult:
    return service.validate_claim(claim_id=claim_id, username=current_user.username)


@router.post('/{claim_id}/send', response_model=SendResult, summary='Send a validated claim')
def send_claim(
    claim_id: str,
    current_user: UserSchema = Depends(get_current_user),
    service: ClaimsService = Depends(_get_service),
) -> SendResult:
    return service.send_claim(claim_id=claim_id, username=current_user.username)


@router.post('/{claim_id}/run-pipeline', summary='Start AI agent pipeline for claim processing')
def run_pipeline(
    claim_id: str,
    _current_user: UserSchema = Depends(get_current_user),
    db: DBRepository = Depends(get_db),
) -> dict:
    _check_ai_available()
    result_sets = db.execute_sp_multi('sp_GetClaimById', (claim_id,))
    if not result_sets or not result_sets[0]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Claim not found')

    from ai_service.agents.chat_agent import _strip_phi
    from ai_service.pipeline.claim_pipeline import ClaimPipeline

    claim_data = {
        'header': _strip_phi(result_sets[0][0]),
        'diagnosis': result_sets[1] if len(result_sets) > 1 else [],
        'service_lines': result_sets[2] if len(result_sets) > 2 else [],
    }
    state = ClaimPipeline(db).start(claim_id, claim_data)
    return {
        'claim_id': claim_id,
        'pipeline_status': state.get('pipeline_status'),
        'denial_risk': state.get('denial_risk'),
        'validation_result': state.get('validation_result'),
        'coding_result': state.get('coding_result'),
    }


@router.post('/{claim_id}/pipeline-decision', summary='Submit human decision for suspended pipeline')
def pipeline_decision(
    claim_id: str,
    decision: str = Query(..., pattern='^(approved|returned)$'),
    _current_user: UserSchema = Depends(get_current_user),
    db: DBRepository = Depends(get_db),
) -> dict:
    _check_ai_available()
    from ai_service.pipeline.claim_pipeline import ClaimPipeline

    state = ClaimPipeline(db).resume(claim_id, decision)
    return {'claim_id': claim_id, 'pipeline_status': state.get('pipeline_status'), 'human_decision': decision}
