/**
 * useClaimsStore — Zustand store for the claims list page.
 * Holds paginated claim data, filter state, and loading flag.
 */
import { create } from 'zustand';
import type { ClaimSummary } from '@/types/claim.types';

interface ClaimsFilters {
  validationStatus: string;
  searchTerm:       string;
}

interface ClaimsState {
  claims:     ClaimSummary[];
  total:      number;
  page:       number;
  pageSize:   number;
  filters:    ClaimsFilters;
  isLoading:  boolean;

  setClaims:     (claims: ClaimSummary[], total: number) => void;
  setPage:       (page: number) => void;
  setPageSize:   (size: number) => void;
  setFilters:    (filters: Partial<ClaimsFilters>) => void;
  setIsLoading:  (loading: boolean) => void;
  removeClaim:   (claimId: string) => void;
  updateStatus:  (claimId: string, newStatus: string) => void;
}

export const useClaimsStore = create<ClaimsState>((set) => ({
  claims:    [],
  total:     0,
  page:      1,
  pageSize:  20,
  filters:   { validationStatus: '', searchTerm: '' },
  isLoading: false,

  setClaims:    (claims, total) => set({ claims, total }),
  setPage:      (page)          => set({ page }),
  setPageSize:  (pageSize)      => set({ pageSize }),
  setFilters:   (partial)       => set((s) => ({ filters: { ...s.filters, ...partial } })),
  setIsLoading: (isLoading)     => set({ isLoading }),
  removeClaim:  (claimId)       => set((s) => ({
    claims: s.claims.filter((c) => c.claim_id !== claimId),
    total:  Math.max(0, s.total - 1),
  })),
  updateStatus: (claimId, newStatus) => set((s) => ({
    claims: s.claims.map((c) =>
      c.claim_id === claimId ? { ...c, validation_status: newStatus } : c,
    ),
  })),
}));
