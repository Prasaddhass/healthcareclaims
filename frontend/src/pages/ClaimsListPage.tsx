import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import { useClaimsList } from '@/hooks/useClaimsList';
import { useClaimsStore } from '@/stores/useClaimsStore';
import { claimsApi } from '@/api/claimsApi';
import { ROUTES } from '@/constants/routes';
import type { ClaimSummary } from '@/types/claim.types';

import ClaimsFilter from '@/components/claims/ClaimsFilter';
import ClaimsTable from '@/components/claims/ClaimsTable';
import DocumentDrawer from '@/components/claims/DocumentDrawer';
import PaginationBar from '@/components/claims/PaginationBar';
import PipelineReviewPanel from '@/components/claims/PipelineReviewPanel';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const { Title } = Typography;

const ClaimsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { total, page, pageSize, updateStatus, removeClaim } = useClaimsStore();
  const { filters, setFilters, setPage, setPageSize } = useClaimsList();

  const [deleteTarget, setDeleteTarget] = useState<ClaimSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sendTarget, setSendTarget] = useState<ClaimSummary | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [docClaimId, setDocClaimId] = useState<string | null>(null);
  const [pipelineClaim, setPipelineClaim] = useState<ClaimSummary | null>(null);
  const [pipelineResult, setPipelineResult] = useState<Awaited<ReturnType<typeof claimsApi.runPipeline>> | null>(null);
  const [isPipelineSubmitting, setIsPipelineSubmitting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await claimsApi.deleteClaim(deleteTarget.claim_id);
      removeClaim(deleteTarget.claim_id);
      void message.success('Claim deleted');
    } catch {
      void message.error('Failed to delete claim');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleSendConfirm = async () => {
    if (!sendTarget) return;
    setIsSending(true);
    try {
      await claimsApi.sendClaim(sendTarget.claim_id);
      updateStatus(sendTarget.claim_id, 'Sent');
      void message.success('Claim sent successfully');
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to send claim';
      void message.error(detail);
    } finally {
      setIsSending(false);
      setSendTarget(null);
    }
  };

  const handleRunPipeline = async (claim: ClaimSummary) => {
    setIsPipelineSubmitting(true);
    try {
      const result = await claimsApi.runPipeline(claim.claim_id);
      setPipelineClaim(claim);
      setPipelineResult(result);
      void message.success('AI pipeline started.');
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to run AI pipeline';
      void message.error(detail);
    } finally {
      setIsPipelineSubmitting(false);
    }
  };

  const handlePipelineDecision = async (decision: 'approved' | 'returned') => {
    if (!pipelineClaim) return;
    setIsPipelineSubmitting(true);
    try {
      await claimsApi.submitPipelineDecision(pipelineClaim.claim_id, decision);
      updateStatus(pipelineClaim.claim_id, decision === 'approved' ? 'Sent' : 'Failed');
      void message.success(decision === 'approved' ? 'Claim approved.' : 'Claim returned to biller.');
      setPipelineClaim(null);
      setPipelineResult(null);
    } catch {
      void message.error('Unable to submit pipeline decision.');
    } finally {
      setIsPipelineSubmitting(false);
    }
  };

  const pipelineClaimId = useMemo(() => pipelineClaim?.claim_id ?? '', [pipelineClaim]);

  return (
    <div data-testid="claims-list-page">
      <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }} align="center">
        <Title level={3} style={{ margin: 0 }}>
          Claims
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(ROUTES.CLAIMS_NEW)} data-testid="new-claim-btn">
          New Claim
        </Button>
      </Space>

      <ClaimsFilter
        searchTerm={filters.searchTerm}
        validationStatus={filters.validationStatus}
        onSearch={(value) => setFilters({ searchTerm: value })}
        onStatusChange={(value) => {
          setPage(1);
          setFilters({ validationStatus: value });
        }}
      />

      <ClaimsTable
        onDeleteRequest={setDeleteTarget}
        onSendRequest={setSendTarget}
        onDocumentsRequest={setDocClaimId}
        onRunPipelineRequest={(claim) => void handleRunPipeline(claim)}
      />

      <PaginationBar
        page={page}
        pageSize={pageSize}
        total={total}
        onChange={(nextPage, nextPageSize) => {
          setPage(nextPage);
          setPageSize(nextPageSize);
        }}
      />

      <DocumentDrawer open={Boolean(docClaimId)} claimId={docClaimId} onClose={() => setDocClaimId(null)} />

      <PipelineReviewPanel
        open={Boolean(pipelineClaim && pipelineResult)}
        claimId={pipelineClaimId}
        data={pipelineResult}
        loading={isPipelineSubmitting}
        onClose={() => {
          setPipelineClaim(null);
          setPipelineResult(null);
        }}
        onApprove={() => void handlePipelineDecision('approved')}
        onReturn={() => void handlePipelineDecision('returned')}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Claim"
        description={deleteTarget ? `Delete claim for patient "${deleteTarget.patient_id}"? This action cannot be undone.` : ''}
        okText="Delete"
        okDanger
        loading={isDeleting}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(sendTarget)}
        title="Send Claim"
        description={sendTarget ? `Send claim for patient "${sendTarget.patient_id}" to the payer?` : ''}
        okText="Send"
        loading={isSending}
        onConfirm={() => void handleSendConfirm()}
        onCancel={() => setSendTarget(null)}
      />
    </div>
  );
};

export default ClaimsListPage;
