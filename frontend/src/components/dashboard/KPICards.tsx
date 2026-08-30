import React from 'react';
import { Col, Row } from 'antd';
import type { AnalyticsSummary } from '@/api/analyticsApi';
import KPICard from '@/components/shared/KPICard';

interface KPICardsProps {
  summary: AnalyticsSummary | null;
  loading: boolean;
}

const KPICards: React.FC<KPICardsProps> = ({ summary, loading }) => {
  const cards = [
    { title: 'Total Claims', value: summary?.total_claims ?? 0 },
    { title: 'This Week', value: summary?.claims_this_week ?? 0 },
    { title: 'This Month', value: summary?.claims_this_month ?? 0 },
    { title: 'Validated', value: summary?.validated_claims ?? 0 },
    { title: 'Sent', value: summary?.sent_claims ?? 0 },
  ];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card) => (
        <Col key={card.title} xs={24} sm={12} xl={4}>
          <KPICard title={card.title} value={card.value} loading={loading} />
        </Col>
      ))}
    </Row>
  );
};

export default KPICards;
