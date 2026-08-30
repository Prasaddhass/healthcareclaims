"""Unit tests for dependencies.py — get_current_user with 3 distinct 401 cases."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from fastapi import HTTPException
from jose import jwt


TEST_SECRET = "test-secret-for-dep-tests-32chars!!"
TEST_ALG    = "HS256"
MOCK_S      = type("S", (), {"JWT_SECRET_KEY": TEST_SECRET, "JWT_ALGORITHM": TEST_ALG, "JWT_EXPIRY_HOURS": 8})()


def _valid_token() -> str:
    payload = {
        "sub":    "admin",
        "userId": 1,
        "role":   "Admin",
        "exp":    datetime.now(timezone.utc) + timedelta(hours=8),
    }
    return jwt.encode(payload, TEST_SECRET, algorithm=TEST_ALG)


def _expired_token() -> str:
    payload = {
        "sub":    "admin",
        "userId": 1,
        "role":   "Admin",
        "exp":    datetime.now(timezone.utc) - timedelta(hours=1),
    }
    return jwt.encode(payload, TEST_SECRET, algorithm=TEST_ALG)


# Patch only jwt_utils.settings (which is what decode_token uses)
@patch("utils.jwt_utils.settings", MOCK_S)
def test_valid_token_returns_user_schema() -> None:
    from dependencies import get_current_user

    user = get_current_user(token=_valid_token())
    assert user.username == "admin"
    assert user.user_id  == 1
    assert user.role     == "Admin"


@patch("utils.jwt_utils.settings", MOCK_S)
def test_expired_token_raises_401() -> None:
    from dependencies import get_current_user

    with pytest.raises(HTTPException) as exc:
        get_current_user(token=_expired_token())
    assert exc.value.status_code == 401
    assert "expired" in exc.value.detail.lower() or "invalid" in exc.value.detail.lower()


@patch("utils.jwt_utils.settings", MOCK_S)
def test_tampered_token_raises_401_invalid() -> None:
    from dependencies import get_current_user

    tampered = _valid_token()[:-5] + "ZZZZZ"
    with pytest.raises(HTTPException) as exc:
        get_current_user(token=tampered)
    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid token"


@patch("utils.jwt_utils.settings", MOCK_S)
def test_wrong_secret_token_raises_401() -> None:
    from dependencies import get_current_user

    wrong = jwt.encode({"sub": "admin", "userId": 1, "role": "Admin"}, "wrong", algorithm=TEST_ALG)
    with pytest.raises(HTTPException) as exc:
        get_current_user(token=wrong)
    assert exc.value.status_code == 401


@patch("utils.jwt_utils.settings", MOCK_S)
def test_missing_sub_raises_401() -> None:
    from dependencies import get_current_user

    token = jwt.encode(
        {"userId": 1, "role": "Admin", "exp": datetime.now(timezone.utc) + timedelta(hours=8)},
        TEST_SECRET, algorithm=TEST_ALG,
    )
    with pytest.raises(HTTPException) as exc:
        get_current_user(token=token)
    assert exc.value.status_code == 401
