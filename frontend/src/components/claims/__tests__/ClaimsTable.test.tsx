import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import ClaimsTable from '../ClaimsTable';
import { useClaimsStore } from '@/stores/useClaimsStore';
import type { ClaimSummary } from '@/types/claim.types';

const MOCK_CLAIMS: ClaimSummary[] = [
  {
    claim_id: 'claim-001',
    patient_id: 'Doe, John',
    insurance_name: 'Medicare',
    policy_id: 'POL-001',
    validation_status: 'Pending',
    created_on: '2024-01-15T00:00:00Z',
    updated_on: null,
    sent_on: null,
    total_count: 3,
  },
  {
    claim_id: 'claim-002',
    patient_id: 'Smith, Jane',
    insurance_name: 'Medicaid',
    policy_id: 'POL-002',
    validation_status: 'Validated',
    created_on: '2024-01-16T00:00:00Z',
    updated_on: null,
    sent_on: null,
    total_count: 3,
  },
  {
    claim_id: 'claim-003',
    patient_id: 'Jones, Bob',
    insurance_name: 'TRICARE',
    policy_id: 'POL-003',
    validation_status: 'Sent',
    created_on: '2024-01-17T00:00:00Z',
    updated_on: null,
    sent_on: '2024-01-18T00:00:00Z',
    total_count: 3,
  },
];

const noop = vi.fn();

const renderTable = () =>
  render(
    <MemoryRouter>
      <ClaimsTable
        onDeleteRequest={noop}
        onSendRequest={noop}
        onDocumentsRequest={noop}
        onRunPipelineRequest={noop}
      />
    </MemoryRouter>,
  );

beforeEach(() => {
  useClaimsStore.setState({ claims: MOCK_CLAIMS, isLoading: false });
  vi.clearAllMocks();
});

describe('ClaimsTable', () => {
  it('renders claims data in the table', () => {
    renderTable();
    expect(screen.getByTestId('claims-table')).toBeInTheDocument();
    expect(screen.getByText('Doe, John')).toBeInTheDocument();
    expect(screen.getByText('Smith, Jane')).toBeInTheDocument();
  }, 10000);

  it('shows Skeleton when loading', () => {
    useClaimsStore.setState({ claims: [], isLoading: true });
    renderTable();
    expect(screen.getByTestId('claims-skeleton')).toBeInTheDocument();
  });

  it('shows Empty state when no claims', () => {
    useClaimsStore.setState({ claims: [], isLoading: false });
    renderTable();
    expect(screen.getByTestId('claims-empty')).toBeInTheDocument();
  });

  it('Send button disabled for non-Validated claim', () => {
    renderTable();
    expect(screen.getByTestId('send-claim-001')).toBeDisabled();
  });

  it('Send button enabled for Validated claim', () => {
    renderTable();
    expect(screen.getByTestId('send-claim-002')).not.toBeDisabled();
  });

  it('Edit and Delete disabled for Sent claim', () => {
    renderTable();
    expect(screen.getByTestId('edit-claim-003')).toBeDisabled();
    expect(screen.getByTestId('delete-claim-003')).toBeDisabled();
  });
});
