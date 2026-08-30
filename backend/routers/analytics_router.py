"""Analytics endpoints for dashboard KPIs, charts, and recent claims."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from dependencies import get_current_user, get_db
from repositories.db_repository import DBRepository
from schemas.analytics_schemas import KPISummaryResponse, RecentClaimsResponse, StatusDistResponse, TimeSeriesResponse
from services.analytics_service import AnalyticsService

router = APIRouter(dependencies=[Depends(get_current_user)])


def _get_service(db: DBRepository = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(db)


@router.get('/summary', response_model=KPISummaryResponse, summary='Dashboard KPI summary')
def get_summary(service: AnalyticsService = Depends(_get_service)) -> KPISummaryResponse:
    try:
        return service.get_summary()
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Database error') from exc


@router.get('/claims-by-period', response_model=TimeSeriesResponse, summary='Time-series claim counts')
def get_claims_by_period(period: str = Query(default='month', pattern='^(week|month)$'), service: AnalyticsService = Depends(_get_service)) -> TimeSeriesResponse:
    try:
        return service.get_by_period(period)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Database error') from exc


@router.get('/status-distribution', response_model=StatusDistResponse, summary='Claim count by validation status')
def get_status_distribution(service: AnalyticsService = Depends(_get_service)) -> StatusDistResponse:
    try:
        return service.get_status_distribution()
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Database error') from exc


@router.get('/recent-claims', response_model=RecentClaimsResponse, summary='Most recent claims')
def get_recent_claims(service: AnalyticsService = Depends(_get_service)) -> RecentClaimsResponse:
    try:
        return service.get_recent_claims()
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Database error') from exc
