/**
 * FormField — generic RHF-bound antd Input wrapper.
 * Renders: label, Input (or children), inline error, aria-describedby linkage.
 */
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input } from 'antd';
import type { InputProps } from 'antd';

interface FormFieldProps<T extends FieldValues> extends Omit<InputProps, 'name'> {
  name:     FieldPath<T>;
  control:  Control<T>;
  label:    string;
  required?: boolean;
}

function FormField<T extends FieldValues>({
  name,
  control,
  label,
  required,
  ...inputProps
}: FormFieldProps<T>) {
  const errorId = `${name}-error`;

  return (
    <Controller
      name={name}
      control={control}
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
            {...inputProps}
            id={String(name)}
            status={error ? 'error' : ''}
            aria-describedby={error ? errorId : undefined}
            aria-required={required}
            value={field.value as string ?? ''}
          />
          {error && (
            <div
              id={errorId}
              role="alert"
              style={{ color: '#ff4d4f', fontSize: 13, marginTop: 4 }}
            >
              {error.message}
            </div>
          )}
        </div>
      )}
    />
  );
}

export default FormField;
