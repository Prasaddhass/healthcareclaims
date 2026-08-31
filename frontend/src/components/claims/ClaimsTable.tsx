import React, { useState } from 'react';
import { Empty, Skeleton, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';

import type { ClaimSummary } from '@/types/claim.types';
import type { ValidationErrorItem } from '@/api/claimsApi';
import { claimsApi } from '@/api/claimsApi';
import { ROUTES } from '@/constants/routes';
import { useClaimsStore } from '@/stores/useClaimsStore';
import StatusBadge from '@/components/shared/StatusBadge';
import ActionButtons from './ActionButtons';
import ValidationErrorPanel from './ValidationErrorPanel';

interface ClaimsTableProps {
  onDeleteRequest: (claim: ClaimSummary) => void;
  onSendRequest: (claim: ClaimSummary) => void;
  onDocumentsRequest: (claimId: string) => void;
  onRunPipelineRequest: (claim: ClaimSummary) => void;
}

const ClaimsTable: React.FC<ClaimsTableProps> = ({
  onDeleteRequest,
  onSendRequest,
  onDocumentsRequest,
  onRunPipelineRequest,
}) => {
  const navigate = useNavigate();
  const { claims, isLoading, updateStatus } = useClaimsStore();
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [expandErrors, setExpandErrors] = useState<Record<string, ValidationErrorItem[]>>({});
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const handleValidate = async (id: string) => {
    setValidatingId(id);
    try {
      const result = await claimsApi.validateClaim(id);
      updateStatus(id, result.validation_status);
      if (result.errors.length > 0) {
        setExpandErrors((prev) => ({ ...prev, [id]: result.errors }));
        setExpandedRows((prev) => (prev.includes(id) ? prev : [...prev, id]));
        void message.warning(`Validation failed: ${result.errors.length} issue(s)`);
      } else {
        void message.success('Claim validated successfully');
      }
    } catch {
      void message.error('Validation request failed');
    } finally {
      setValidatingId(null);
    }
  };

  const columns: ColumnsType<ClaimSummary> = [
    { title: 'Claim ID', dataIndex: 'claim_id', key: 'claim_id', width: 300, ellipsis: true },
    { title: 'Patient', dataIndex: 'patient_id', key: 'patient_id', width: 180 },
    { title: 'Insurance', dataIndex: 'insurance_name', key: 'insurance_name', width: 180 },
    { title: 'Policy', dataIndex: 'policy_id', key: 'policy_id', width: 130 },
    { title: 'Status', dataIndex: 'validation_status', key: 'status', width: 120, render: (status: string) => <StatusBadge status={status} /> },
    { title: 'Sent On', dataIndex: 'sent_on', key: 'sent_on', width: 160, render: (value: string | null) => (value ? new Date(value).toLocaleDateString() : '-') },
    { title: 'Created', dataIndex: 'created_on', key: 'created_on', width: 160, sorter: true, render: (value: string | null) => (value ? new Date(value).toLocaleDateString() : '?') },
    {
      title: 'Actions',
      key: 'actions',
      width: 260,
      render: (_: unknown, record: ClaimSummary) => (
        <ActionButtons
          claim={record}
          validatingId={validatingId}
          onEdit={(id) => navigate(ROUTES.CLAIMS_EDIT(id))}
          onDelete={onDeleteRequest}
          onValidate={(id) => void handleValidate(id)}
          onSend={onSendRequest}
          onDocuments={onDocumentsRequest}
          onRunPipeline={onRunPipelineRequest}
        />
      ),
    },
  ];

  if (isLoading) {
    return (
      <div data-testid="claims-skeleton">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!isLoading && claims.length === 0) {
    return (
      <div data-testid="claims-empty">
        <Empty description="No claims found. Create your first claim." />
      </div>
    );
  }

  return (
    <Table<ClaimSummary>
      columns={columns}
      dataSource={claims.map((claim) => ({ ...claim, key: claim.claim_id }))}
      pagination={false}
      scroll={{ x: 1300 }}
      size="middle"
      expandable={{
        expandedRowKeys: expandedRows,
        onExpandedRowsChange: (keys) => setExpandedRows(keys as string[]),
        rowExpandable: (record) => Boolean(expandErrors[record.claim_id]?.length),
        expandedRowRender: (record) => <ValidationErrorPanel errors={expandErrors[record.claim_id] ?? []} />,
      }}
      data-testid="claims-table"
    />
  );
};

export default ClaimsTable;
