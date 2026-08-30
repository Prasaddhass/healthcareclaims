"""Document request/response schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class DocumentUploadResponse(BaseModel):
    document_id: int
    file_name: str
    file_size: int


class DocumentEntry(BaseModel):
    document_id: int
    file_name: str
    file_type: str
    file_size_bytes: int
    uploaded_on: datetime


class DocumentListResponse(BaseModel):
    documents: list[DocumentEntry] = Field(default_factory=list)
