import api from './axiosInstance';

export interface CodeSuggestion {
  code: string;
  description: string;
  confidence: number;
  rationale: string;
}

export interface ValidationErrorInput {
  field: string;
  item_number: string;
  message: string;
}

export interface ErrorExplanation {
  field: string;
  plain_english: string;
  suggested_fix: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSource {
  document: string;
  excerpt: string;
  relevance: number;
}

export interface ChatResponse {
  response: string;
  sources: ChatSource[];
}

export const aiApi = {
  suggestCodes: (description: string, codeType: 'ICD' | 'CPT'): Promise<{ suggestions: CodeSuggestion[] }> =>
    api.post('/api/ai/suggest-codes', { description, code_type: codeType }).then((response) => response.data),

  explainErrors: (errors: ValidationErrorInput[]): Promise<{ explanations: ErrorExplanation[] }> =>
    api.post('/api/ai/explain-errors', { errors }).then((response) => response.data),

  chat: (
    message: string,
    claimId?: string,
    conversationHistory: ChatMessage[] = [],
  ): Promise<ChatResponse> =>
    api
      .post('/api/ai/chat', {
        message,
        claim_id: claimId,
        conversation_history: conversationHistory,
      })
      .then((response) => response.data),
};
