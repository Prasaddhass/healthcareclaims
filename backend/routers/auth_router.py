"""Auth router — POST /api/auth/login and /logout."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_current_user, get_db
from repositories.db_repository import DBRepository
from schemas.auth_schemas import LoginRequest, TokenResponse, UserSchema
from services.auth_service import AuthService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user and return JWT",
)
def login(
    body: LoginRequest,
    db:   DBRepository = Depends(get_db),
) -> TokenResponse:
    """POST /api/auth/login — no JWT required on this endpoint."""
    service = AuthService(db)
    try:
        result = service.login(body.username, body.password)
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred",
        )

    if result is None:
        # Identical message for wrong password AND unknown user — no enumeration (OWASP A07)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    return result


@router.post(
    "/logout",
    summary="Invalidate client session (stateless — client clears token)",
)
def logout(
    current_user: UserSchema = Depends(get_current_user),
) -> dict:
    """POST /api/auth/logout — JWT required.  Server is stateless; client removes token."""
    logger.info("User logged out: %s", current_user.username)
    return {"message": "Logged out successfully"}
