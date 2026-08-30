import React, { useState } from 'react';
import { Button, Space, message } from 'antd';
import type { AnalyticsSummary, StatusDistributionPoint, TimeSeriesPoint } from '@/api/analyticsApi';
import { buildAnalyticsCSV, buildCSVFilename, downloadCSV, exportDashboardToPDF } from '@/utils/exportUtils';

interface ExportButtonProps {
  summary: AnalyticsSummary | null;
  weekly: TimeSeriesPoint[];
  monthly: TimeSeriesPoint[];
  statusDistribution: StatusDistributionPoint[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ summary, weekly, monthly, statusDistribution }) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportDashboardToPDF('dashboard-export-root', summary);
      void message.success('Dashboard exported to PDF.');
    } catch {
      void message.error('Unable to export dashboard PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <Space>
      <Button onClick={() => downloadCSV(buildAnalyticsCSV(weekly, monthly, statusDistribution), buildCSVFilename())}>
        Export CSV
      </Button>
      <Button type="primary" loading={isExportingPdf} onClick={() => void handleExportPdf()}>
        Export PDF
      </Button>
    </Space>
  );
};

export default ExportButton;
