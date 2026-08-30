"""
FastAPI application factory.

Middleware registration order: LAST registered = FIRST executed.
All domain routers are registered here with their prefix and tags.
"""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import (
    ai_router,
    analytics_router,
    auth_router,
    claims_router,
    documents_router,
)

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── Application factory ────────────────────────────────────────────────────────
app = FastAPI(
    title="Healthcare Claims API",
    version=settings.VERSION,
    description="CMS-1500 Healthcare Claims Management — REST API",
    # Disable interactive docs in production (NFR: no debug endpoints in prod)
    docs_url="/docs"   if settings.ENV != "production" else None,
    redoc_url="/redoc" if settings.ENV != "production" else None,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
# Must be registered before routers so it runs for every request.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    expose_headers=["Content-Disposition"],  # required for file download filename
)

# ── Domain routers ─────────────────────────────────────────────────────────────
# auth_router has NO auth dependency — login is public
app.include_router(auth_router.router,      prefix="/api/auth",      tags=["Authentication"])
# All other routers carry Depends(get_current_user) via their APIRouter constructor
app.include_router(claims_router.router,    prefix="/api/claims",    tags=["Claims"])
app.include_router(documents_router.router, prefix="/api/claims",    tags=["Documents"])
app.include_router(analytics_router.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(ai_router.router,        prefix="/api/ai",        tags=["AI"])


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"], summary="Application health check")
def health_check() -> dict:
    """Returns service status and version.  No authentication required."""
    return {"status": "ok", "version": settings.VERSION}
