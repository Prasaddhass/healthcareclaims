/** PaginationBar — antd Pagination with "Showing X–Y of Z" label. */
import { Pagination, Typography } from 'antd';

const { Text } = Typography;

interface PaginationBarProps {
  page:      number;
  pageSize:  number;
  total:     number;
  onChange:  (page: number, pageSize: number) => void;
}

const PaginationBar: React.FC<PaginationBarProps> = ({
  page, pageSize, total, onChange,
}) => {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  return (
    <div
      style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginTop:      16,
      }}
      data-testid="pagination-bar"
    >
      <Text type="secondary">
        {total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}
      </Text>
      <Pagination
        current={page}
        pageSize={pageSize}
        total={total}
        onChange={onChange}
        showSizeChanger
        pageSizeOptions={['10', '20', '50']}
        showQuickJumper={total > 50}
        data-testid="pagination"
      />
    </div>
  );
};

export default PaginationBar;
