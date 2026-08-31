"""Document request/response schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class DocumentUploadResponse(BaseModel):
    document_id: int
    file_name: str
    file_size: int
    document_tag: Literal['PolicyDocument', 'ProviderContractAgreement', 'InsuranceID', 'MISC']


class DocumentEntry(BaseModel):
    document_id: int
    file_name: str
    file_type: str
    document_tag: Literal['PolicyDocument', 'ProviderContractAgreement', 'InsuranceID', 'MISC']
    file_size_bytes: int
    uploaded_on: datetime


class DocumentListResponse(BaseModel):
    documents: list[DocumentEntry] = Field(default_factory=list)
