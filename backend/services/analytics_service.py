"""Dashboard analytics service backed by stored procedures."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from schemas.analytics_schemas import KPISummaryResponse, RecentClaimsResponse, StatusDistPoint, StatusDistResponse, TimeSeriesPoint, TimeSeriesResponse

logger = logging.getLogger(__name__)
_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


class AnalyticsService:
    def __init__(self, db: object) -> None:
        self._db = db

    def get_summary(self) -> KPISummaryResponse:
        result_sets = self._get_analytics_result_sets('month')
        row = result_sets[0][0] if result_sets and result_sets[0] else {}
        return KPISummaryResponse(
            total_claims=int(row.get('TotalClaims') or 0),
            claims_this_week=int(row.get('ClaimsThisWeek') or 0),
            claims_this_month=int(row.get('ClaimsThisMonth') or 0),
            validated_claims=int(row.get('ValidatedClaims') or 0),
            sent_claims=int(row.get('SentClaims') or 0),
        )

    def get_by_period(self, period: str) -> TimeSeriesResponse:
        result_sets = self._get_analytics_result_sets(period)
        rows = result_sets[1] if len(result_sets) > 1 else []
        data = [
            TimeSeriesPoint(
                label=self._format_label(period, int(row.get('Year') or 0), int(row.get('Period') or 0)),
                count=int(row.get('ClaimCount') or 0),
                year=int(row.get('Year') or 0),
            )
            for row in rows
        ]
        return TimeSeriesResponse(period=period, data=data)

    def get_status_distribution(self) -> StatusDistResponse:
        result_sets = self._get_analytics_result_sets('month')
        rows = result_sets[2] if len(result_sets) > 2 else []
        total = sum(int(row.get('Count', 0)) for row in rows)
        if total == 0:
            return StatusDistResponse(data=[])
        return StatusDistResponse(
            data=[
                StatusDistPoint(
                    status=str(row.get('ValidationStatus', '')),
                    count=int(row.get('Count', 0)),
                    percentage=round(int(row.get('Count', 0)) / total * 100, 1),
                )
                for row in rows
            ]
        )

    def get_recent_claims(self) -> RecentClaimsResponse:
        try:
            rows = self._db.execute_sp('sp_GetClaims', (1, 10, None, None))
        except Exception as exc:
            logger.error('DB error fetching recent claims: %s', type(exc).__name__)
            raise RuntimeError('Database error') from exc
        return RecentClaimsResponse(claims=[self._to_claim_summary(row) for row in rows])

    def _get_analytics_result_sets(self, period: str) -> list[list[dict[str, Any]]]:
        try:
            return self._db.execute_sp_multi('sp_GetClaimsAnalytics', (period,))
        except Exception as exc:
            logger.error('DB error fetching analytics: %s', type(exc).__name__)
            raise RuntimeError('Database error') from exc

    @staticmethod
    def _format_label(period: str, year: int, value: int) -> str:
        if period == 'week':
            return f"Wk {value} '{str(year)[2:]}"
        month_index = min(max(value - 1, 0), len(_MONTH_NAMES) - 1)
        return f"{_MONTH_NAMES[month_index]} '{str(year)[2:]}"

    @staticmethod
    def _to_claim_summary(row: dict[str, Any]) -> dict[str, Any]:
        return {
            'claim_id': str(row.get('ClaimId', '')),
            'patient_id': row.get('PatientId'),
            'insurance_name': row.get('InsuranceName'),
            'policy_id': row.get('PolicyId'),
            'validation_status': row.get('ValidationStatus'),
            'created_on': AnalyticsService._to_iso(row.get('CreatedOn')),
            'updated_on': AnalyticsService._to_iso(row.get('UpdatedOn')),
            'sent_on': AnalyticsService._to_iso(row.get('SentOn')),
        }

    @staticmethod
    def _to_iso(value: Any) -> str | None:
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value) if value else None
