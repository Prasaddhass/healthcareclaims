import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { ROUTES } from '@/constants/routes';

/**
 * PrivateRoute — wraps protected routes.
 *
 * If the user is NOT authenticated, redirects to /login while
 * saving the attempted URL in location.state.from so we can
 * redirect back after login.
 *
 * If authenticated, renders child routes via <Outlet />.
 */
const PrivateRoute: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location        = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
};

export default PrivateRoute;
