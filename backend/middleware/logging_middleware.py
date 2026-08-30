"""PHI-safe structured logging middleware.  Implemented in US-001-03."""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

# PHI fields that must NEVER appear in log output (NFR-011)
PHI_FIELDS = {
    "patient_name",
    "patient_birth_date",
    "federal_tax_id",
    "patient_phone",
    "patient_street",
    "patient_zip",
}


def scrub_phi(data: dict) -> dict:
    """Recursively remove PHI keys from log payloads."""
    return {
        k: scrub_phi(v) if isinstance(v, dict) else "[REDACTED]" if k in PHI_FIELDS else v
        for k, v in data.items()
    }
