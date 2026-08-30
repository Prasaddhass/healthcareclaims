import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { analyticsApi } from '@/api/analyticsApi';
import { useAnalytics } from '../useAnalytics';

vi.mock('@/api/analyticsApi', () => ({
  analyticsApi: {
    getSummary: vi.fn(),
    getByPeriod: vi.fn(),
    getStatusDistribution: vi.fn(),
    getRecentClaims: vi.fn(),
  },
}));

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsApi.getSummary).mockResolvedValue({
      total_claims: 12,
      claims_this_week: 3,
      claims_this_month: 8,
      validated_claims: 6,
      sent_claims: 2,
    });
    vi.mocked(analyticsApi.getByPeriod).mockImplementation(async (period) => ({
      period,
      data: [{ label: period === 'week' ? 'Wk 35' : 'Aug 26', count: period === 'week' ? 3 : 8, year: 2026 }],
    }));
    vi.mocked(analyticsApi.getStatusDistribution).mockResolvedValue({ data: [{ status: 'Pending', count: 3, percentage: 25 }] });
    vi.mocked(analyticsApi.getRecentClaims).mockResolvedValue({ claims: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads analytics on mount', async () => {
    const { result } = renderHook(() => useAnalytics());
    await waitFor(() => expect(result.current.summary?.total_claims).toBe(12));
  });

  it('clears loading state after success', async () => {
    const { result } = renderHook(() => useAnalytics());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('refresh loads data again', async () => {
    const { result } = renderHook(() => useAnalytics());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await result.current.refresh();
    expect(analyticsApi.getSummary).toHaveBeenCalledTimes(2);
  });

  it('handles API errors and stops loading', async () => {
    vi.mocked(analyticsApi.getSummary).mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useAnalytics());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.summary).toBeNull();
  });
});
