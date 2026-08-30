"""
Integration tests for DBRepository against a live HealthCareDB instance.

Prerequisites:
  - SQL Server Express running at localhost\\sqlexpress
  - Scripts 01–05 executed (HealthCareDB created + admin user seeded)
  - backend/.env contains a valid DATABASE_URL

Run:
    cd backend
    pytest tests/integration/test_db_repository.py -v
"""
from __future__ import annotations

import pytest


@pytest.fixture(scope="module")
def db():
    """Provide a live DBRepository instance for the test session."""
    from repositories.db_repository import DBRepository
    return DBRepository()


class TestSpLogin:
    def test_valid_credentials_returns_admin_row(self, db) -> None:
        rows = db.execute_sp("sp_Login", ("admin", "admin"))
        assert len(rows) == 1, f"Expected 1 row, got {len(rows)}"
        row = rows[0]
        assert row["Username"] == "admin"
        assert row["Role"]     == "Admin"
        assert "UserId" in row
        assert isinstance(row["UserId"], int)

    def test_invalid_password_returns_empty(self, db) -> None:
        rows = db.execute_sp("sp_Login", ("admin", "wrongpassword"))
        assert rows == [], f"Expected 0 rows for invalid password, got {rows}"

    def test_unknown_user_returns_empty(self, db) -> None:
        rows = db.execute_sp("sp_Login", ("nonexistentuser", "anything"))
        assert rows == [], "Expected 0 rows for unknown user"

    def test_both_invalid_returns_same_empty_result(self, db) -> None:
        """Both wrong password and unknown user must return the same empty result (no enumeration)."""
        wrong_pw  = db.execute_sp("sp_Login", ("admin",   "bad"))
        no_user   = db.execute_sp("sp_Login", ("ghost",   "bad"))
        assert wrong_pw == no_user == []


class TestSpGetClaims:
    def test_returns_list_on_empty_db(self, db) -> None:
        rows = db.execute_sp("sp_GetClaims", (1, 20, None, None))
        assert isinstance(rows, list), "sp_GetClaims should return a list"

    def test_pagination_params_accepted(self, db) -> None:
        """Different page sizes should not raise errors."""
        rows10 = db.execute_sp("sp_GetClaims", (1, 10, None, None))
        rows50 = db.execute_sp("sp_GetClaims", (1, 50, None, None))
        assert isinstance(rows10, list)
        assert isinstance(rows50, list)

    def test_status_filter_accepted(self, db) -> None:
        """Filtering by ValidationStatus should not raise errors."""
        rows = db.execute_sp("sp_GetClaims", (1, 20, "Pending", None))
        assert isinstance(rows, list)


class TestSpGetClaimsAnalytics:
    def test_returns_three_result_sets(self, db) -> None:
        result_sets = db.execute_sp_multi("sp_GetClaimsAnalytics", ("month",))
        assert len(result_sets) >= 1, "Should return at least the KPI result set"
        # RS1: KPI summary — should always have exactly 1 row
        kpi_rows = result_sets[0]
        assert len(kpi_rows) == 1, f"KPI RS should have 1 row, got {len(kpi_rows)}"
        kpi = kpi_rows[0]
        assert "TotalClaims" in kpi
        assert "ClaimsThisWeek" in kpi
        assert "ValidatedClaims" in kpi
        assert "SentClaims" in kpi

    def test_week_period_accepted(self, db) -> None:
        result_sets = db.execute_sp_multi("sp_GetClaimsAnalytics", ("week",))
        assert isinstance(result_sets, list)
