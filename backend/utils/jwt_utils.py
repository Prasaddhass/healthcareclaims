"""JWT utility functions.  Fully implemented in US-001-02."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import ExpiredSignatureError, JWTError, jwt

from config import settings


def create_access_token(data: dict) -> str:
    """Create a signed JWT with configured expiry (JWT_EXPIRY_HOURS)."""
    to_encode = data.copy()
    expire    = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRY_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify JWT.  Returns payload dict on success, None on any failure."""
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except (ExpiredSignatureError, JWTError):
        return None


def get_token_expiry_detail(token: str) -> str:
    """Return a string describing why a token was rejected (for logging only)."""
    try:
        jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return "valid"
    except ExpiredSignatureError:
        return "expired"
    except JWTError:
        return "invalid"
