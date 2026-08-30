"""Analytics response schemas."""
from __future__ import annotations

from pydantic import BaseModel, Field


class KPISummaryResponse(BaseModel):
    total_claims: int
    claims_this_week: int
    claims_this_month: int
    validated_claims: int
    sent_claims: int


class TimeSeriesPoint(BaseModel):
    label: str
    count: int
    year: int


class TimeSeriesResponse(BaseModel):
    period: str
    data: list[TimeSeriesPoint] = Field(default_factory=list)


class StatusDistPoint(BaseModel):
    status: str
    count: int
    percentage: float


class StatusDistResponse(BaseModel):
    data: list[StatusDistPoint] = Field(default_factory=list)


class RecentClaimsResponse(BaseModel):
    claims: list[dict] = Field(default_factory=list)
