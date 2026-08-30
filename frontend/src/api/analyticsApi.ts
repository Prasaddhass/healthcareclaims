import api from './axiosInstance';
import type { ClaimSummary } from '@/types/claim.types';

export type AnalyticsPeriod = 'week' | 'month';

export interface AnalyticsSummary {
  total_claims: number;
  claims_this_week: number;
  claims_this_month: number;
  validated_claims: number;
  sent_claims: number;
}

export interface TimeSeriesPoint {
  label: string;
  count: number;
  year: number;
}

export interface TimeSeriesResponse {
  period: AnalyticsPeriod;
  data: TimeSeriesPoint[];
}

export interface StatusDistributionPoint {
  status: string;
  count: number;
  percentage: number;
}

export interface StatusDistributionResponse {
  data: StatusDistributionPoint[];
}

export interface RecentClaimsResponse {
  claims: ClaimSummary[];
}

export const analyticsApi = {
  getSummary: (): Promise<AnalyticsSummary> =>
    api.get('/api/analytics/summary').then((response) => response.data),

  getByPeriod: (period: AnalyticsPeriod): Promise<TimeSeriesResponse> =>
    api.get('/api/analytics/claims-by-period', { params: { period } }).then((response) => response.data),

  getStatusDistribution: (): Promise<StatusDistributionResponse> =>
    api.get('/api/analytics/status-distribution').then((response) => response.data),

  getRecentClaims: (): Promise<RecentClaimsResponse> =>
    api.get('/api/analytics/recent-claims').then((response) => response.data),
};
