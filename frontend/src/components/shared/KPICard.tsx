import React from 'react';
import { Card, Skeleton, Statistic } from 'antd';

interface KPICardProps {
  title: string;
  value: number;
  loading: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, loading }) => (
  <Card>
    {loading ? <Skeleton active paragraph={false} /> : <Statistic title={title} value={value} />}
  </Card>
);

export default KPICard;
