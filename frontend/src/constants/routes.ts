/** Route path constants — used throughout the application. */
export const ROUTES = {
  LOGIN: '/login',
  CLAIMS: '/claims',
  CLAIMS_NEW: '/claims/new',
  CLAIMS_EDIT: (id: string) => `/claims/${id}/edit`,
  DASHBOARD: '/dashboard',
  NOT_FOUND: '*',
} as const;
