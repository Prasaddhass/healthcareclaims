import React from 'react';
import { Card, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import type { ClaimSummary } from '@/types/claim.types';
import { ROUTES } from '@/constants/routes';

interface RecentClaimsTableProps {
  claims: ClaimSummary[];
  loading: boolean;
}

const RecentClaimsTable: React.FC<RecentClaimsTableProps> = ({ claims, loading }) => {
  const navigate = useNavigate();

  const columns: ColumnsType<ClaimSummary> = [
    { title: 'Claim ID', dataIndex: 'claim_id', key: 'claim_id' },
    { title: 'Patient', dataIndex: 'patient_id', key: 'patient_id' },
    { title: 'Insurance', dataIndex: 'insurance_name', key: 'insurance_name' },
    { title: 'Status', dataIndex: 'validation_status', key: 'validation_status' },
  ];

  return (
    <Card title="Recent Claims">
      <Table
        size="small"
        pagination={false}
        loading={loading}
        columns={columns}
        dataSource={claims.map((claim) => ({ ...claim, key: claim.claim_id }))}
        onRow={(record) => ({
          onClick: () => navigate(ROUTES.CLAIMS_EDIT(record.claim_id)),
          style: { cursor: 'pointer' },
        })}
      />
    </Card>
  );
};

export default RecentClaimsTable;
