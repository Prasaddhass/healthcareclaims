"""
DBRepository — single pyodbc entry point.
All database access MUST go through this class using stored procedures.
No raw SQL strings anywhere in application code.
"""
from __future__ import annotations

import logging
from typing import Any

import pyodbc

from config import settings

logger = logging.getLogger(__name__)


class DBRepository:
    """Encapsulates all pyodbc stored-procedure calls.

    Calling convention (ADO-style):
        cursor.execute("{CALL sp_name(?,?)}", params)
    """

    def __init__(self) -> None:
        self._connection_string: str = settings.DATABASE_URL

    # ── Internal helpers ────────────────────────────────────────────────────────

    def _connect(self) -> pyodbc.Connection:
        return pyodbc.connect(self._connection_string)

    @staticmethod
    def _rows_to_dicts(cursor: pyodbc.Cursor) -> list[dict[str, Any]]:
        """Convert a result set to a list of column-name-keyed dicts."""
        if cursor.description is None:
            return []
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

    # ── Public API ──────────────────────────────────────────────────────────────

    def execute_sp(
        self,
        sp_name: str,
        params: tuple[Any, ...] = (),
    ) -> list[dict[str, Any]]:
        """Execute a stored procedure and return the first result set as list[dict]."""
        placeholders = ",".join("?" * len(params))
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute(f"{{CALL {sp_name}({placeholders})}}", params)
            return self._rows_to_dicts(cursor)

    def execute_sp_no_result(
        self,
        sp_name: str,
        params: tuple[Any, ...] = (),
    ) -> None:
        """Execute a stored procedure that writes data (INSERT / UPDATE / DELETE)."""
        placeholders = ",".join("?" * len(params))
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute(f"{{CALL {sp_name}({placeholders})}}", params)
            conn.commit()

    def execute_sp_multi(
        self,
        sp_name: str,
        params: tuple[Any, ...] = (),
    ) -> list[list[dict[str, Any]]]:
        """Execute a stored procedure that returns multiple result sets.

        Returns a list of result sets, each as a list[dict].
        """
        placeholders = ",".join("?" * len(params))
        result_sets: list[list[dict[str, Any]]] = []
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute(f"{{CALL {sp_name}({placeholders})}}", params)
            while True:
                if cursor.description:
                    result_sets.append(self._rows_to_dicts(cursor))
                if not cursor.nextset():
                    break
        return result_sets
