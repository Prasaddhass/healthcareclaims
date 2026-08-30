import React from 'react';
import { Card, Skeleton } from 'antd';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TimeSeriesPoint } from '@/api/analyticsApi';

interface MonthlyBarChartProps {
  data: TimeSeriesPoint[];
  loading: boolean;
}

const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({ data, loading }) => (
  <Card title="Monthly Claims">
    {loading ? (
      <Skeleton active paragraph={{ rows: 8 }} />
    ) : (
      <div aria-label="Monthly claims chart" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#722ed1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </Card>
);

export default MonthlyBarChart;
