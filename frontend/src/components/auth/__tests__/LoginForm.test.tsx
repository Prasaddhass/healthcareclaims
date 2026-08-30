import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import LoginForm from '../LoginForm';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/stores/useAuthStore';

vi.mock('@/api/authApi', () => ({
  authApi: { login: vi.fn(), logout: vi.fn() },
}));

const mockLogin = vi.mocked(authApi.login);

const renderForm = () =>
  render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
});

describe('LoginForm', () => {
  it('shows "Username is required" when username is empty on submit', async () => {
    renderForm();
    await userEvent.click(screen.getByTestId('submit-btn'));
    expect(await screen.findByText('Username is required')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows "Password is required" when password is empty on submit', async () => {
    renderForm();
    await userEvent.type(screen.getByPlaceholderText('Enter your username'), 'admin');
    await userEvent.click(screen.getByTestId('submit-btn'));
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows loading state during in-flight request', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}));
    renderForm();
    await userEvent.type(screen.getByPlaceholderText('Enter your username'), 'admin');
    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'admin');
    await userEvent.click(screen.getByTestId('submit-btn'));
    expect(await screen.findByText(/signing in/i)).toBeInTheDocument();
  });

  it('shows generic error on 401 â€” no field-specific message', async () => {
    mockLogin.mockRejectedValueOnce({ response: { status: 401 } });
    renderForm();
    await userEvent.type(screen.getByPlaceholderText('Enter your username'), 'admin');
    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'wrong');
    await userEvent.click(screen.getByTestId('submit-btn'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password');
    expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
  });

  it('stores token in Zustand on successful login', async () => {
    mockLogin.mockResolvedValueOnce({
      access_token: 'test.jwt.token',
      token_type:   'bearer',
      user:         { userId: 1, username: 'admin', role: 'Admin' },
    });
    renderForm();
    await userEvent.type(screen.getByPlaceholderText('Enter your username'), 'admin');
    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'admin');
    await userEvent.click(screen.getByTestId('submit-btn'));
    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().token).toBe('test.jwt.token');
    });
  });
});
