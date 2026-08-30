"""Validation helpers for uploaded claim documents."""
from __future__ import annotations

from pathlib import Path

from fastapi import HTTPException, status

ALLOWED_EXTENSIONS: frozenset[str] = frozenset({'.pdf', '.doc', '.docx', '.txt', '.jpg', '.png'})
MAX_SIZE_BYTES: int = 10_485_760


def validate_extension(filename: str) -> str:
    extension = Path(filename or '').suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail='File type not allowed',
        )
    return extension


def validate_size(size: int) -> None:
    if size > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail='File size exceeds 10 MB limit',
        )
