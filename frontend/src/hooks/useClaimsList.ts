/**
 * useClaimsList — fetches claims when page/filter deps change.
 * Search input is debounced 300ms to avoid firing on every keystroke.
 */
import { useEffect, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { message } from 'antd';
import { claimsApi } from '@/api/claimsApi';
import { useClaimsStore } from '@/stores/useClaimsStore';

export function useClaimsList() {
  const {
    page, pageSize, filters,
    setClaims, setIsLoading, setPage, setPageSize, setFilters,
    isLoading,
  } = useClaimsStore();

  const fetchClaims = useCallback(async (
    p: number,
    ps: number,
    status: string,
    search: string,
  ) => {
    setIsLoading(true);
    try {
      const resp = await claimsApi.getClaims({
        page:            p,
        pageSize:        ps,
        validationStatus: status || undefined,
        searchTerm:       search || undefined,
      });
      setClaims(resp.claims, resp.total_count);
    } catch {
      void message.error('Failed to load claims');
    } finally {
      setIsLoading(false);
    }
  }, [setClaims, setIsLoading]);

  // Debounced version for search input
  const debouncedFetch = useDebouncedCallback(
    (p: number, ps: number, status: string, search: string) =>
      void fetchClaims(p, ps, status, search),
    300,
  );

  // Re-fetch on page/pageSize/status changes immediately
  useEffect(() => {
    void fetchClaims(page, pageSize, filters.validationStatus, filters.searchTerm);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filters.validationStatus]);

  // Re-fetch on search term change (debounced)
  useEffect(() => {
    debouncedFetch(page, pageSize, filters.validationStatus, filters.searchTerm);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.searchTerm]);

  const refresh = useCallback(() => {
    void fetchClaims(page, pageSize, filters.validationStatus, filters.searchTerm);
  }, [fetchClaims, page, pageSize, filters]);

  return {
    isLoading,
    page,
    pageSize,
    filters,
    setPage,
    setPageSize,
    setFilters,
    refresh,
  };
}
