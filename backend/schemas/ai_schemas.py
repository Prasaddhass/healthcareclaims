"""AI request and response schemas."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class SuggestCodesRequest(BaseModel):
    description: str
    code_type: Literal['ICD', 'CPT']


class CodeSuggestion(BaseModel):
    code: str
    description: str
    confidence: float
    rationale: str


class SuggestCodesResponse(BaseModel):
    suggestions: list[CodeSuggestion] = Field(default_factory=list)


class ValidationErrorInput(BaseModel):
    field: str
    item_number: str
    message: str


class ExplainErrorsRequest(BaseModel):
    errors: list[ValidationErrorInput] = Field(default_factory=list)


class ErrorExplanation(BaseModel):
    field: str
    plain_english: str
    suggested_fix: str


class ExplainErrorsResponse(BaseModel):
    explanations: list[ErrorExplanation] = Field(default_factory=list)


class ChatMessage(BaseModel):
    role: Literal['user', 'assistant']
    content: str


class ChatRequest(BaseModel):
    message: str
    claim_id: str | None = None
    conversation_history: list[ChatMessage] = Field(default_factory=list)


class ChatSource(BaseModel):
    document: str
    excerpt: str
    relevance: float


class ChatResponse(BaseModel):
    response: str
    sources: list[ChatSource] = Field(default_factory=list)
