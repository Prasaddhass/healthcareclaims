"""Filesystem helpers for claim document storage."""
from __future__ import annotations

import re
import uuid
from pathlib import Path

from config import settings


class FileRepository:
    """Stores uploaded claim files under UPLOAD_DIR/claims/{claim_id}."""

    def __init__(self, base_dir: str | None = None) -> None:
        self._base = Path(base_dir or settings.UPLOAD_DIR).resolve()

    def save(self, claim_id: str, file_bytes: bytes, filename: str) -> str:
        claim_dir = self._base / 'claims' / claim_id
        claim_dir.mkdir(parents=True, exist_ok=True)
        safe_name = self._safe_filename(filename)
        stored_name = f'{uuid.uuid4().hex}_{safe_name}'
        file_path = claim_dir / stored_name
        file_path.write_bytes(file_bytes)
        return str(file_path)

    def read(self, filepath: str) -> bytes:
        return Path(filepath).read_bytes()

    def delete(self, filepath: str) -> None:
        path = Path(filepath)
        if path.exists():
            path.unlink()

    def exists(self, filepath: str) -> bool:
        return Path(filepath).exists()

    @staticmethod
    def _safe_filename(name: str) -> str:
        filename = Path(name or '').name
        safe = re.sub(r'[^A-Za-z0-9._-]', '_', filename).lstrip('.')
        return safe or 'file'
