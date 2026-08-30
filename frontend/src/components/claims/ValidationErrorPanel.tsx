/**
 * ValidationErrorPanel — expandable error table shown inside a ClaimsTable row
 * when validate returns errors.  Columns: Field / Item # / Message / Severity.
 */
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ValidationErrorItem } from '@/api/claimsApi';

interface ValidationErrorPanelProps {
  errors: ValidationErrorItem[];
}

const columns: ColumnsType<ValidationErrorItem> = [
  {
    title:     'Field',
    dataIndex: 'field',
    key:       'field',
    width:     220,
    ellipsis:  true,
  },
  {
    title:     'Item #',
    dataIndex: 'item_number',
    key:       'item_number',
    width:     100,
  },
  {
    title:    'Message',
    dataIndex: 'message',
    key:      'message',
  },
  {
    title:  'Severity',
    dataIndex: 'severity',
    key:    'severity',
    width:  90,
    render: (sev: string) => (
      <Tag color={sev === 'error' ? 'red' : 'gold'}>
        {sev.toUpperCase()}
      </Tag>
    ),
  },
];

const ValidationErrorPanel: React.FC<ValidationErrorPanelProps> = ({ errors }) => (
  <Table<ValidationErrorItem>
    columns={columns}
    dataSource={errors.map((e, i) => ({ ...e, key: i }))}
    size="small"
    pagination={false}
    data-testid="validation-error-panel"
  />
);

export default ValidationErrorPanel;
