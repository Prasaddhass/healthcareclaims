"""
FastAPI dependency injection functions.

get_db()            — yields a DBRepository instance per request
get_current_user()  — decodes JWT Bearer token and returns UserSchema
"""
from __future__ import annotations

import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from repositories.db_repository import DBRepository
from schemas.auth_schemas import UserSchema
from utils.jwt_utils import decode_token, get_token_expiry_detail

logger = logging.getLogger(__name__)

# tokenUrl is the login endpoint — shown in OpenAPI "Authorize" dialog
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_db() -> DBRepository:
    """Dependency: returns a fresh DBRepository instance per request."""
    return DBRepository()


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
) -> UserSchema:
    """
    Dependency: decodes JWT Bearer token and returns the authenticated user.
    Raises HTTP 401 for missing, expired, or tampered tokens.
    """
    payload = decode_token(token)

    if payload is None:
        reason = get_token_expiry_detail(token)
        logger.warning("Token rejected: %s", reason)
        detail = "Token expired" if reason == "expired" else "Invalid token"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

    username = payload.get("sub")
    user_id  = payload.get("userId")
    role     = payload.get("role")

    if not username or user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return UserSchema(user_id=user_id, username=username, role=role or "")
