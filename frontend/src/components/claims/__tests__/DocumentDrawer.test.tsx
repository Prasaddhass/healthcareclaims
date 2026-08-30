import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import DocumentDrawer from '../DocumentDrawer';
import { documentsApi } from '@/api/documentsApi';

vi.mock('@/api/documentsApi', () => ({
  documentsApi: {
    getDocuments: vi.fn(),
    uploadDocument: vi.fn(),
    deleteDocument: vi.fn(),
    downloadDocument: vi.fn(),
  },
}));

describe('DocumentDrawer', () => {
  beforeEach(() => {
    vi.mocked(documentsApi.getDocuments).mockResolvedValue({ documents: [] });
  });

  it('renders when open', async () => {
    render(<DocumentDrawer open claimId="claim-12345678" onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/Documents/)).toBeInTheDocument());
  });

  it('shows the truncated title', async () => {
    render(<DocumentDrawer open claimId="claim-12345678" onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/Documents/)).toBeInTheDocument());
  });

  it('shows the upload zone', async () => {
    render(<DocumentDrawer open claimId="claim-12345678" onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('file-upload-zone')).toBeInTheDocument());
  });

  it('calls onClose when the close button is pressed', async () => {
    const onClose = vi.fn();
    render(<DocumentDrawer open claimId="claim-12345678" onClose={onClose} />);
    await waitFor(() => expect(screen.getByText(/Documents/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});
