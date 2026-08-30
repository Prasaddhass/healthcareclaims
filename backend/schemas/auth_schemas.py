"""Authentication request/response schemas."""
from __future__ import annotations

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, description="Login username")
    password: str = Field(..., min_length=1, description="Login password")


class UserSchema(BaseModel):
    user_id:  int
    username: str
    role:     str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserSchema
