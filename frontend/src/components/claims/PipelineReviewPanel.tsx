import React from 'react';
import { Alert, Button, Descriptions, Modal, Space, Tag, Typography } from 'antd';
import type { PipelineRunResponse } from '@/api/claimsApi';

const { Paragraph, Text, Title } = Typography;

interface PipelineReviewPanelProps {
  open: boolean;
  claimId: string;
  data: PipelineRunResponse | null;
  loading?: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReturn: () => void;
}

const getRiskTone = (risk: number): { color: string; label: string } => {
  if (risk >= 0.5) return { color: 'red', label: 'High' };
  if (risk >= 0.2) return { color: 'orange', label: 'Medium' };
  return { color: 'green', label: 'Low' };
};

const PipelineReviewPanel: React.FC<PipelineReviewPanelProps> = ({
  open,
  claimId,
  data,
  loading = false,
  onClose,
  onApprove,
  onReturn,
}) => {
  const denialRisk = data?.denial_risk ?? 0;
  const risk = getRiskTone(denialRisk);
  const codingSuggestions = data?.coding_result?.suggestions ?? [];
  const validationIssues = data?.validation_result?.issues ?? [];

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={700} title={`AI Pipeline Review — Claim ${claimId.slice(0, 8)}`} destroyOnClose>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          type={validationIssues.length || data?.coding_result?.has_issues ? 'warning' : 'success'}
          message={validationIssues.length || data?.coding_result?.has_issues ? 'Review required before approval.' : 'AI checks completed successfully.'}
          showIcon
        />

        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Pipeline Status">
            <Text>{data?.pipeline_status ?? 'Unknown'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Coding Review">
            <Text>{data?.coding_result?.has_issues ? `${codingSuggestions.length} suggestion(s)` : 'No coding issues found'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Validation">
            <Text>{validationIssues.length ? `${validationIssues.length} issue(s)` : 'All checks passed'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Denial Risk">
            <Tag color={risk.color}>{risk.label} Risk</Tag>
            <Text>{` ${Math.round(denialRisk * 100)}%`}</Text>
          </Descriptions.Item>
        </Descriptions>

        {codingSuggestions.length > 0 ? (
          <div>
            <Title level={5}>Suggested Code Updates</Title>
            {codingSuggestions.map((suggestion, index) => (
              <Paragraph key={`${String(suggestion.current_code ?? suggestion.suggested_code ?? index)}`}>
                {String(suggestion.rationale ?? suggestion.description ?? suggestion.code ?? 'Suggestion available')}
              </Paragraph>
            ))}
          </div>
        ) : null}

        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button aria-label="Return to biller" danger loading={loading} onClick={onReturn}>
            Return to Biller
          </Button>
          <Button aria-label="Approve claim" type="primary" loading={loading} onClick={onApprove}>
            Approve
          </Button>
        </Space>
      </Space>
    </Modal>
  );
};

export default PipelineReviewPanel;
