"""Stateless orchestrator for backend AI endpoints."""
from __future__ import annotations

from ai_service.config import AISettings, ai_settings


class AIOrchestrator:
    def __init__(self, settings: AISettings | None = None) -> None:
        self._settings = settings or ai_settings

    def is_available(self) -> bool:
        return self._settings.is_configured()

    def _ensure_available(self) -> None:
        if not self.is_available():
            raise NotImplementedError('AI service not configured')

    def suggest_codes(self, description: str, code_type: str) -> dict:
        self._ensure_available()
        from ai_service.agents.coding_agent import CodingAgent
        return CodingAgent(self._settings).run(description, code_type)

    def explain_errors(self, errors: list[dict]) -> dict:
        self._ensure_available()
        from ai_service.agents.error_agent import ErrorAgent
        return ErrorAgent(self._settings).run(errors)

    def chat(self, message: str, claim_context: dict | None, history: list[dict]) -> dict:
        self._ensure_available()
        from ai_service.agents.chat_agent import ChatAgent
        return ChatAgent(self._settings).run(message, claim_context, history)
