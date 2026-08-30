import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import LoginForm from '../LoginForm';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/stores/useAuthStore';

vi.mock('@/api/authApi', () => ({
  authApi: { login: vi.fn(), logout: vi.fn() },
}));

const mockLogin = vi.mocked(authApi.login);
const MOCK_RESPONSE = {
  access_token: 'test.jwt',
  token_type:   'bearer',
  user:         { userId: 1, username: 'admin', role: 'Admin' },
};

const LocationDisplay = () => {
  const loc = useLocation();
  return <div data-testid="location">{loc.pathname}</div>;
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
});

describe('LoginForm post-login redirect', () => {
  it('redirects to preserved URL when location.state.from is set', async () => {
    mockLogin.mockResolvedValueOnce(MOCK_RESPONSE);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/claims/new' } }]}>
        <Routes>
          <Route path="/login"       element={<LoginForm />} />
          <Route path="/claims/new"  element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText('Enter your username'), 'admin');
    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'admin');
    await userEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/claims/new');
    });
  });

  it('redirects to /claims when no preserved URL (direct login visit)', async () => {
    mockLogin.mockResolvedValueOnce(MOCK_RESPONSE);

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login"  element={<LoginForm />} />
          <Route path="/claims" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText('Enter your username'), 'admin');
    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'admin');
    await userEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/claims');
    });
  });
});
