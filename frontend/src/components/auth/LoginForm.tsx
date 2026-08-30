import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Input } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginFormValues } from '@/schemas/auth.schema';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/stores/useAuthStore';

/** Inline error message rendered directly below a field. */
const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <div
      role="alert"
      style={{ color: '#ff4d4f', fontSize: 14, marginTop: 4 }}
    >
      {message}
    </div>
  ) : null;

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login    = useAuthStore((s) => s.login);
  const [apiError, setApiError] = useState<string | null>(null);

  // Redirect to the page the user originally tried to visit, or /claims
  const from = (location.state as { from?: string } | null)?.from ?? '/claims';

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver:       zodResolver(loginSchema),
    defaultValues:  { username: '', password: '' },
    mode:           'onSubmit',
    reValidateMode: 'onChange',
  });

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    try {
      const response = await authApi.login(data.username, data.password);
      login(response.access_token, response.user);
      navigate(from, { replace: true });
    } catch {
      // Always generic — never reveal which field was wrong (OWASP A07)
      setApiError('Invalid username or password');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* API-level error (e.g. 401) */}
      {apiError && (
        <Alert
          message={apiError}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          role="alert"
          aria-live="assertive"
        />
      )}

      {/* Username */}
      <div style={{ marginBottom: 16 }}>
        <label
          htmlFor="username"
          style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}
        >
          Username
        </label>
        <Controller
          control={control}
          name="username"
          render={({ field }) => (
            <Input
              {...field}
              id="username"
              prefix={<UserOutlined />}
              placeholder="Enter your username"
              autoComplete="username"
              aria-required="true"
              size="large"
              status={errors.username ? 'error' : ''}
            />
          )}
        />
        <FieldError message={errors.username?.message} />
      </div>

      {/* Password */}
      <div style={{ marginBottom: 24 }}>
        <label
          htmlFor="password"
          style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}
        >
          Password
        </label>
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <Input.Password
              {...field}
              id="password"
              prefix={<LockOutlined />}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-required="true"
              size="large"
              status={errors.password ? 'error' : ''}
            />
          )}
        />
        <FieldError message={errors.password?.message} />
      </div>

      {/* Submit */}
      <Button
        type="primary"
        htmlType="submit"
        loading={isSubmitting}
        disabled={isSubmitting}
        size="large"
        block
        data-testid="submit-btn"
        aria-label="Sign in to Healthcare Claims"
      >
        {isSubmitting ? 'Signing in\u2026' : 'Login'}
      </Button>
    </form>
  );
};

export default LoginForm;