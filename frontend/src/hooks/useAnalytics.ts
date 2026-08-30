import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { analyticsApi } from '@/api/analyticsApi';
import type { AnalyticsSummary, StatusDistributionPoint, TimeSeriesPoint } from '@/api/analyticsApi';
import type { ClaimSummary } from '@/types/claim.types';

interface UseAnalyticsResult {
  summary: AnalyticsSummary | null;
  weekly: TimeSeriesPoint[];
  monthly: TimeSeriesPoint[];
  statusDistribution: StatusDistributionPoint[];
  recentClaims: ClaimSummary[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useAnalytics = (): UseAnalyticsResult => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [weekly, setWeekly] = useState<TimeSeriesPoint[]>([]);
  const [monthly, setMonthly] = useState<TimeSeriesPoint[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistributionPoint[]>([]);
  const [recentClaims, setRecentClaims] = useState<ClaimSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryResp, weeklyResp, monthlyResp, statusResp, recentResp] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getByPeriod('week'),
        analyticsApi.getByPeriod('month'),
        analyticsApi.getStatusDistribution(),
        analyticsApi.getRecentClaims(),
      ]);
      setSummary(summaryResp);
      setWeekly(weeklyResp.data);
      setMonthly(monthlyResp.data);
      setStatusDistribution(statusResp.data);
      setRecentClaims(recentResp.claims);
    } catch {
      void message.error('Failed to load dashboard analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  return {
    summary,
    weekly,
    monthly,
    statusDistribution,
    recentClaims,
    isLoading,
    refresh: loadAnalytics,
  };
};
