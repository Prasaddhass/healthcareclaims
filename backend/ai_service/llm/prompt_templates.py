"""Prompt templates shared by the AI agents."""
from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

CODE_SUGGESTION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            'system',
            (
                'You are a certified healthcare billing specialist. Suggest up to 3 {code_type} codes '
                'using only the supplied context. Return JSON only with keys code, description, '
                'confidence, rationale.\n\nReference context:\n{context}'
            ),
        ),
        ('human', 'Clinical description: {description}'),
    ]
)

ERROR_EXPLANATION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            'system',
            (
                'You explain CMS-1500 validation errors in plain English. Return JSON only with items '
                'containing field, plain_english, suggested_fix.'
            ),
        ),
        ('human', 'Validation errors to explain:\n{errors_json}'),
    ]
)

CHAT_QA_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            'system',
            (
                'You are a healthcare claims assistant. Answer using the supplied reference context and '
                'do not fabricate missing rules.\n\nReference context:\n{context}\n\n{claim_context}'
            ),
        ),
        ('placeholder', '{chat_history}'),
        ('human', '{message}'),
    ]
)
