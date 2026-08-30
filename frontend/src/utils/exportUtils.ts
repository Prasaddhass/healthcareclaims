import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { AnalyticsSummary, StatusDistributionPoint, TimeSeriesPoint } from '@/api/analyticsApi';

export const buildCSVFilename = (): string => `claims-analytics-${new Date().toISOString().slice(0, 10)}.csv`;

export const buildAnalyticsCSV = (
  weekly: TimeSeriesPoint[],
  monthly: TimeSeriesPoint[],
  statusDist: StatusDistributionPoint[],
): string => {
  const lines = [
    'Weekly Claims',
    'label,count',
    ...weekly.map((point) => `${point.label},${point.count}`),
    '',
    'Monthly Claims',
    'label,count',
    ...monthly.map((point) => `${point.label},${point.count}`),
    '',
    'Status Distribution',
    'status,count,percentage',
    ...statusDist.map((point) => `${point.status},${point.count},${point.percentage}`),
  ];

  return lines.join('\n');
};

export const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = filename;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const exportDashboardToPDF = async (rootId: string, summary: AnalyticsSummary | null): Promise<void> => {
  const root = window.document.getElementById(rootId);
  if (!root) {
    throw new Error('Export root not found');
  }

  const canvas = await html2canvas(root, { backgroundColor: '#ffffff', scale: 2 });
  const imageData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = (canvas.height * pageWidth) / canvas.width;

  pdf.text(`Claims Analytics${summary ? ` — ${summary.total_claims} claims` : ''}`, 10, 10);
  pdf.addImage(imageData, 'PNG', 10, 16, pageWidth - 20, Math.min(pageHeight, 260));
  pdf.save(buildCSVFilename().replace('.csv', '.pdf'));
};
