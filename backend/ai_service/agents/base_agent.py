from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseAgent(ABC):
    @abstractmethod
    def run(self, *args: Any, **kwargs: Any) -> dict[str, Any]:
        raise NotImplementedError
