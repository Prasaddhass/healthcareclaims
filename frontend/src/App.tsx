import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

// Eager-loaded public page
import LoginPage from '@/pages/LoginPage';

// Lazy-loaded protected pages (code splitting)
const ClaimsListPage = lazy(() => import('@/pages/ClaimsListPage'));
const ClaimFormPage  = lazy(() => import('@/pages/ClaimFormPage'));
const DashboardPage  = lazy(() => import('@/pages/DashboardPage'));
const NotFoundPage   = lazy(() => import('@/pages/NotFoundPage'));

// Layout + auth guard
const AppShell    = lazy(() => import('@/components/layout/AppShell'));
const PrivateRoute = lazy(() => import('@/components/auth/PrivateRoute'));

const App: React.FC = () => (
  <BrowserRouter>
    <Suspense fallback={null}>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />

        {/* Public */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* Protected — PrivateRoute checks isAuthenticated, AppShell provides layout */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppShell />}>
            <Route path={ROUTES.CLAIMS}     element={<ClaimsListPage />} />
            <Route path={ROUTES.CLAIMS_NEW} element={<ClaimFormPage />} />
            <Route path="/claims/:id/edit"  element={<ClaimFormPage />} />
            <Route path={ROUTES.DASHBOARD}  element={<DashboardPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;