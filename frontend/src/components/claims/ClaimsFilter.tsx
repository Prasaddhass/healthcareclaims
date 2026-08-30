/** ClaimsFilter — Search Input + Validation Status Select for the claims table. */
import { Input, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ValidationStatus } from '@/constants/claimStatuses';

interface ClaimsFilterProps {
  searchTerm:       string;
  validationStatus: string;
  onSearch:         (val: string) => void;
  onStatusChange:   (val: string) => void;
}

const STATUS_OPTIONS: { value: ValidationStatus | ''; label: string }[] = [
  { value: '',          label: 'All Statuses' },
  { value: 'Draft',     label: 'Draft' },
  { value: 'Pending',   label: 'Pending' },
  { value: 'Validated', label: 'Validated' },
  { value: 'Failed',    label: 'Failed' },
  { value: 'Sent',      label: 'Sent' },
];

const ClaimsFilter: React.FC<ClaimsFilterProps> = ({
  searchTerm,
  validationStatus,
  onSearch,
  onStatusChange,
}) => (
  <Space wrap style={{ marginBottom: 16 }}>
    <Input
      prefix={<SearchOutlined />}
      placeholder="Search by patient, policy, or ID"
      value={searchTerm}
      onChange={(e) => onSearch(e.target.value)}
      allowClear
      style={{ width: 300 }}
      data-testid="claims-search"
    />
    <Select
      value={validationStatus}
      onChange={onStatusChange}
      options={STATUS_OPTIONS}
      style={{ width: 160 }}
      data-testid="claims-status-filter"
    />
  </Space>
);

export default ClaimsFilter;
