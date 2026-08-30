import React from 'react';
import { Card, Skeleton } from 'antd';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TimeSeriesPoint } from '@/api/analyticsApi';

interface WeeklyBarChartProps {
  data: TimeSeriesPoint[];
  loading: boolean;
}

const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ data, loading }) => (
  <Card title="Weekly Claims">
    {loading ? (
      <Skeleton active paragraph={{ rows: 8 }} />
    ) : (
      <div aria-label="Weekly claims chart" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#1677ff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </Card>
);

export default WeeklyBarChart;
