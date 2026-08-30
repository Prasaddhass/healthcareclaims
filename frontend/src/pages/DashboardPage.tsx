import React from 'react';
import { Col, Row, Space, Typography } from 'antd';
import ExportButton from '@/components/dashboard/ExportButton';
import KPICards from '@/components/dashboard/KPICards';
import MonthlyBarChart from '@/components/dashboard/MonthlyBarChart';
import RecentClaimsTable from '@/components/dashboard/RecentClaimsTable';
import StatusDonutChart from '@/components/dashboard/StatusDonutChart';
import WeeklyBarChart from '@/components/dashboard/WeeklyBarChart';
import { useAnalytics } from '@/hooks/useAnalytics';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const { summary, weekly, monthly, statusDistribution, recentClaims, isLoading } = useAnalytics();

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }} id="dashboard-export-root">
      <Row align="middle" justify="space-between">
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Dashboard Analytics
          </Title>
        </Col>
        <Col>
          <ExportButton summary={summary} weekly={weekly} monthly={monthly} statusDistribution={statusDistribution} />
        </Col>
      </Row>

      <KPICards summary={summary} loading={isLoading} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <WeeklyBarChart data={weekly} loading={isLoading} />
        </Col>
        <Col xs={24} lg={12}>
          <MonthlyBarChart data={monthly} loading={isLoading} />
        </Col>
        <Col xs={24} lg={12}>
          <StatusDonutChart data={statusDistribution} loading={isLoading} />
        </Col>
        <Col xs={24} lg={12}>
          <RecentClaimsTable claims={recentClaims} loading={isLoading} />
        </Col>
      </Row>
    </Space>
  );
};

export default DashboardPage;
