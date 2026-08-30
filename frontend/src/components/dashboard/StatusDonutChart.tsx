import React from 'react';
import { Card, Empty, Skeleton } from 'antd';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { StatusDistributionPoint } from '@/api/analyticsApi';
import { STATUS_CHART_COLOURS } from '@/constants/claimStatuses';

interface StatusDonutChartProps {
  data: StatusDistributionPoint[];
  loading: boolean;
}

const StatusDonutChart: React.FC<StatusDonutChartProps> = ({ data, loading }) => {
  const filtered = data.filter((item) => item.count > 0);

  return (
    <Card title="Status Distribution">
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : filtered.length === 0 ? (
        <Empty description="No status data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div aria-label="Status distribution chart" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={filtered} dataKey="count" nameKey="status" innerRadius={50} outerRadius={90} paddingAngle={2}>
                {filtered.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_CHART_COLOURS[entry.status as keyof typeof STATUS_CHART_COLOURS] ?? '#1677ff'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, props) => [
                  `${Number(value ?? 0)}`,
                  `${String((props.payload as StatusDistributionPoint).status)} (${String((props.payload as StatusDistributionPoint).percentage)}%)`,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default StatusDonutChart;
