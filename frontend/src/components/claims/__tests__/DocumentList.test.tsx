import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import DocumentList from '../DocumentList';
import { documentsApi } from '@/api/documentsApi';
import type { DocumentItem } from '@/types/claim.types';

vi.mock('@/api/documentsApi', () => ({
  documentsApi: {
    deleteDocument: vi.fn(),
    downloadDocument: vi.fn(),
  },
}));

const mockDocuments: DocumentItem[] = [
  {
    document_id: 1,
    file_name: 'note.pdf',
    file_type: 'pdf',
    file_size_bytes: 1536,
    uploaded_on: '2026-08-29T10:00:00Z',
  },
];

describe('DocumentList', () => {
  it('renders document metadata', () => {
    render(<DocumentList claimId="claim-1" documents={mockDocuments} onDeleted={vi.fn()} />);
    expect(screen.getByText('note.pdf')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
  });

  it('shows an empty state when no documents exist', () => {
    render(<DocumentList claimId="claim-1" documents={[]} onDeleted={vi.fn()} />);
    expect(screen.getByText('No documents uploaded yet')).toBeInTheDocument();
  });

  it('deletes a document after confirmation', async () => {
    const onDeleted = vi.fn();
    vi.mocked(documentsApi.deleteDocument).mockResolvedValue(undefined);

    render(<DocumentList claimId="claim-1" documents={mockDocuments} onDeleted={onDeleted} />);
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(documentsApi.deleteDocument).toHaveBeenCalledWith('claim-1', 1));
    expect(onDeleted).toHaveBeenCalled();
  });
});
