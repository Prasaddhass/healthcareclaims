/**
 * NPIField — 10-digit NPI input with numeric keyboard on mobile.
 */
import type { Control, FieldValues, FieldPath } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input } from 'antd';

interface NPIFieldProps<T extends FieldValues> {
  control:   Control<T>;
  name:      FieldPath<T>;
  label:     string;
  required?: boolean;
}

function NPIField<T extends FieldValues>({
  control,
  name,
  label,
  required,
}: NPIFieldProps<T>) {
  const errorId = `${String(name)}-error`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor={String(name)}
            style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}
          >
            {label}
            {required && <span style={{ color: '#ff4d4f', marginLeft: 2 }}>*</span>}
          </label>
          <Input
            {...field}
            id={String(name)}
            inputMode="numeric"
            maxLength={10}
            placeholder="0000000000"
            status={error ? 'error' : ''}
            aria-describedby={error ? errorId : undefined}
            aria-required={required}
            value={field.value as string ?? ''}
            data-testid={`npi-${String(name)}`}
          />
          {error && (
            <div id={errorId} role="alert" style={{ color: '#ff4d4f', fontSize: 13, marginTop: 4 }}>
              {error.message}
            </div>
          )}
        </div>
      )}
    />
  );
}

export default NPIField;
