"""AuthService — credential verification and JWT generation.  Implemented in US-001-02."""
from __future__ import annotations

import logging

import pyodbc

from schemas.auth_schemas import TokenResponse, UserSchema
from utils.jwt_utils import create_access_token

logger = logging.getLogger(__name__)


class AuthService:
    """Handles user authentication against the Users table via sp_Login."""

    def __init__(self, db: object) -> None:
        self._db = db

    def login(self, username: str, password: str) -> TokenResponse | None:
        """
        Authenticate user via sp_Login stored procedure.

        Returns TokenResponse on success, None on invalid credentials.
        Raises RuntimeError (caller converts to HTTP 500) on DB errors.
        Never raises on auth failure — always returns None for security.
        """
        try:
            rows = self._db.execute_sp("sp_Login", (username, password))
        except pyodbc.Error as exc:
            # Log without PHI — only exception type, never username+password together
            logger.error("Database error during authentication: %s", type(exc).__name__)
            raise RuntimeError("Database error") from exc

        if not rows:
            return None  # Invalid credentials — caller returns 401

        row  = rows[0]
        user = UserSchema(
            user_id  = row["UserId"],
            username = row["Username"],
            role     = row["Role"],
        )
        token = create_access_token({
            "sub":    user.username,
            "userId": user.user_id,
            "role":   user.role,
        })
        return TokenResponse(access_token=token, user=user)
