import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import PipelineReviewPanel from '../PipelineReviewPanel';
import type { PipelineRunResponse } from '@/api/claimsApi';

const pipelineData: PipelineRunResponse = {
  claim_id: 'claim-1',
  pipeline_status: 'human_review',
  denial_risk: 0.34,
  validation_result: { passed: true, issues: [] },
  coding_result: {
    has_issues: true,
    suggestions: [{ rationale: 'Use a more specific CPT code' }],
  },
};

describe('PipelineReviewPanel', () => {
  it('renders the modal title when open', () => {
    render(
      <PipelineReviewPanel
        open
        claimId="claim-12345678"
        data={pipelineData}
        onClose={vi.fn()}
        onApprove={vi.fn()}
        onReturn={vi.fn()}
      />,
    );
    expect(screen.getByText(/AI Pipeline Review/)).toBeInTheDocument();
  });

  it('shows denial risk details', () => {
    render(
      <PipelineReviewPanel
        open
        claimId="claim-12345678"
        data={pipelineData}
        onClose={vi.fn()}
        onApprove={vi.fn()}
        onReturn={vi.fn()}
      />,
    );
    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    expect(screen.getByText(/34%/)).toBeInTheDocument();
  });

  it('calls approve handler', () => {
    const onApprove = vi.fn();
    render(
      <PipelineReviewPanel
        open
        claimId="claim-12345678"
        data={pipelineData}
        onClose={vi.fn()}
        onApprove={onApprove}
        onReturn={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText('Approve claim'));
    expect(onApprove).toHaveBeenCalled();
  });

  it('calls return handler', () => {
    const onReturn = vi.fn();
    render(
      <PipelineReviewPanel
        open
        claimId="claim-12345678"
        data={pipelineData}
        onClose={vi.fn()}
        onApprove={vi.fn()}
        onReturn={onReturn}
      />,
    );
    fireEvent.click(screen.getByLabelText('Return to biller'));
    expect(onReturn).toHaveBeenCalled();
  });
});
