from __future__ import annotations

from unittest.mock import MagicMock

from services.analytics_service import AnalyticsService


def test_get_summary_maps_kpi_row() -> None:
    db = MagicMock()
    db.execute_sp_multi.return_value = [[{'TotalClaims': 25, 'ClaimsThisWeek': 3, 'ClaimsThisMonth': 11, 'ValidatedClaims': 15, 'SentClaims': 7}], [], []]
    result = AnalyticsService(db).get_summary()
    assert result.total_claims == 25
    assert result.sent_claims == 7


def test_get_by_period_formats_month_labels() -> None:
    db = MagicMock()
    db.execute_sp_multi.return_value = [[], [{'Year': 2026, 'Period': 8, 'ClaimCount': 14}], []]
    result = AnalyticsService(db).get_by_period('month')
    assert result.period == 'month'
    assert result.data[0].label == "Aug '26"
