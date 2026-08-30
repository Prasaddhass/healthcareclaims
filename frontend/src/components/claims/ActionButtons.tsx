import React from 'react';
import { Button, Space, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  RobotOutlined,
  SendOutlined,
} from '@ant-design/icons';
import type { ClaimSummary } from '@/types/claim.types';

interface ActionButtonsProps {
  claim: ClaimSummary;
  validatingId: string | null;
  onEdit: (id: string) => void;
  onDelete: (claim: ClaimSummary) => void;
  onValidate: (id: string) => void;
  onSend: (claim: ClaimSummary) => void;
  onDocuments: (id: string) => void;
  onRunPipeline: (claim: ClaimSummary) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  claim,
  validatingId,
  onEdit,
  onDelete,
  onValidate,
  onSend,
  onDocuments,
  onRunPipeline,
}) => {
  const isSent = claim.validation_status === 'Sent';
  const isValidated = claim.validation_status === 'Validated';
  const isValidating = validatingId === claim.claim_id;
  const canRunPipeline = ['Draft', 'Pending', 'Failed'].includes(claim.validation_status);

  return (
    <Space size="small">
      <Tooltip title={isSent ? 'Cannot edit a sent claim' : 'Edit'}>
        <Button icon={<EditOutlined />} size="small" disabled={isSent} onClick={() => onEdit(claim.claim_id)} data-testid={`edit-${claim.claim_id}`} />
      </Tooltip>

      <Tooltip title={isSent ? 'Cannot delete a sent claim' : 'Delete'}>
        <Button icon={<DeleteOutlined />} size="small" danger disabled={isSent} onClick={() => onDelete(claim)} data-testid={`delete-${claim.claim_id}`} />
      </Tooltip>

      <Tooltip title={isSent ? 'Already sent' : 'Validate'}>
        <Button icon={<CheckCircleOutlined />} size="small" disabled={isSent} loading={isValidating} onClick={() => onValidate(claim.claim_id)} data-testid={`validate-${claim.claim_id}`} />
      </Tooltip>

      <Tooltip title={!isValidated ? 'Claim must be Validated before sending' : 'Send'}>
        <Button icon={<SendOutlined />} size="small" type="primary" disabled={!isValidated} onClick={() => onSend(claim)} data-testid={`send-${claim.claim_id}`} />
      </Tooltip>

      <Tooltip title="Documents">
        <Button icon={<FileTextOutlined />} size="small" onClick={() => onDocuments(claim.claim_id)} data-testid={`docs-${claim.claim_id}`} />
      </Tooltip>

      <Tooltip title="Run AI agent pipeline for automated processing">
        <Button icon={<RobotOutlined />} size="small" disabled={!canRunPipeline} aria-label="Run AI pipeline" onClick={() => onRunPipeline(claim)} data-testid={`pipeline-${claim.claim_id}`} />
      </Tooltip>
    </Space>
  );
};

export default ActionButtons;
