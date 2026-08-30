import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import AIAssistPanel from '../AIAssistPanel';

vi.mock('@/api/aiApi', () => ({
  aiApi: {
    chat: vi.fn(),
    suggestCodes: vi.fn(),
    explainErrors: vi.fn(),
  },
}));

describe('AIAssistPanel', () => {
  it('renders the panel title when open', () => {
    render(<AIAssistPanel open onClose={vi.fn()} />);
    expect(screen.getByText('AI Assist')).toBeInTheDocument();
  });

  it('shows all three tabs', () => {
    render(<AIAssistPanel open onClose={vi.fn()} />);
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Suggest Codes')).toBeInTheDocument();
    expect(screen.getByText('Explain Errors')).toBeInTheDocument();
  });

  it('renders the chat input', () => {
    render(<AIAssistPanel open onClose={vi.fn()} />);
    expect(screen.getByLabelText('AI chat input')).toBeInTheDocument();
  });

  it('disables explain errors when no validation errors are provided', () => {
    render(<AIAssistPanel open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Explain Errors' }));
    expect(screen.getByRole('button', { name: 'Explain Current Errors' })).toBeDisabled();
  });
});
