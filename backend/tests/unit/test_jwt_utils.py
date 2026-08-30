"""Unit tests for jwt_utils.py — 6 tests covering all key behaviours."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from jose import jwt


# ── Helpers ─────────────────────────────────────────────────────────────────

TEST_SECRET    = "test-secret-for-unit-tests-only-32chars"
TEST_ALGORITHM = "HS256"

MOCK_SETTINGS = type("S", (), {
    "JWT_SECRET_KEY":  TEST_SECRET,
    "JWT_ALGORITHM":   TEST_ALGORITHM,
    "JWT_EXPIRY_HOURS": 8,
})()


def _make_expired_token() -> str:
    payload = {
        "sub":    "admin",
        "userId": 1,
        "role":   "Admin",
        "exp":    datetime.now(timezone.utc) - timedelta(hours=1),
    }
    return jwt.encode(payload, TEST_SECRET, algorithm=TEST_ALGORITHM)


def _make_valid_token_with_mock() -> str:
    with patch("utils.jwt_utils.settings", MOCK_SETTINGS):
        from utils.jwt_utils import create_access_token
        return create_access_token({"sub": "admin", "userId": 1, "role": "Admin"})


# ── Tests ────────────────────────────────────────────────────────────────────

@patch("utils.jwt_utils.settings", MOCK_SETTINGS)
def test_create_token_contains_sub_userId_role_exp() -> None:
    from utils.jwt_utils import create_access_token

    token   = create_access_token({"sub": "admin", "userId": 1, "role": "Admin"})
    payload = jwt.decode(token, TEST_SECRET, algorithms=[TEST_ALGORITHM])

    assert payload["sub"]    == "admin"
    assert payload["userId"] == 1
    assert payload["role"]   == "Admin"
    assert "exp" in payload


@patch("utils.jwt_utils.settings", MOCK_SETTINGS)
def test_expiry_is_8_hours() -> None:
    from utils.jwt_utils import create_access_token

    before  = datetime.now(timezone.utc)
    token   = create_access_token({"sub": "admin", "userId": 1, "role": "Admin"})
    after   = datetime.now(timezone.utc)
    payload = jwt.decode(token, TEST_SECRET, algorithms=[TEST_ALGORITHM])

    exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    assert before + timedelta(hours=7, minutes=59) <= exp <= after + timedelta(hours=8, minutes=1)


@patch("utils.jwt_utils.settings", MOCK_SETTINGS)
def test_decode_valid_token_returns_payload() -> None:
    from utils.jwt_utils import create_access_token, decode_token

    token   = create_access_token({"sub": "admin", "userId": 1, "role": "Admin"})
    payload = decode_token(token)

    assert payload is not None
    assert payload["sub"] == "admin"


@patch("utils.jwt_utils.settings", MOCK_SETTINGS)
def test_decode_expired_token_returns_none() -> None:
    from utils.jwt_utils import decode_token

    expired = _make_expired_token()
    assert decode_token(expired) is None


@patch("utils.jwt_utils.settings", MOCK_SETTINGS)
def test_decode_tampered_token_returns_none() -> None:
    from utils.jwt_utils import create_access_token, decode_token

    token   = create_access_token({"sub": "admin", "userId": 1, "role": "Admin"})
    tampered = token[:-8] + "ZZZZZZZZ"
    assert decode_token(tampered) is None


@patch("utils.jwt_utils.settings", MOCK_SETTINGS)
def test_decode_wrong_secret_returns_none() -> None:
    from utils.jwt_utils import decode_token

    wrong_secret_token = jwt.encode(
        {"sub": "admin", "userId": 1, "role": "Admin"},
        "wrong-secret",
        algorithm=TEST_ALGORITHM,
    )
    assert decode_token(wrong_secret_token) is None
