import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import PrivateRoute from '../PrivateRoute';
import { useAuthStore } from '@/stores/useAuthStore';

const Protected  = () => <div>Protected Content</div>;
const LoginPage  = () => <div>Login Page</div>;

const renderRoutes = (initialPath: string, isAuthenticated: boolean) => {
  useAuthStore.setState({
    isAuthenticated,
    token: isAuthenticated ? 'test-token' : null,
    user:  isAuthenticated ? { userId: 1, username: 'admin', role: 'Admin' } : null,
  });

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<PrivateRoute />}>
          <Route path="/claims"       element={<Protected />} />
          <Route path="/claims/new"   element={<Protected />} />
          <Route path="/dashboard"    element={<Protected />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => vi.clearAllMocks());

describe('PrivateRoute', () => {
  it('renders protected content for authenticated users at /claims', () => {
    renderRoutes('/claims', true);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated user from /claims to /login', () => {
    renderRoutes('/claims', false);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated user from /claims/new to /login', () => {
    renderRoutes('/claims/new', false);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects unauthenticated user from /dashboard to /login', () => {
    renderRoutes('/dashboard', false);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('authenticated user at /dashboard sees protected content', () => {
    renderRoutes('/dashboard', true);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
