/**
 * CurrencyField — antd InputNumber with $ prefix, 2 decimal precision, min=0.
 * Pass readOnly=true to disable user editing (used for auto-calculated totals).
 */
import type { Control, FieldValues, FieldPath } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { InputNumber } from 'antd';

interface CurrencyFieldProps<T extends FieldValues> {
  control:   Control<T>;
  name:      FieldPath<T>;
  label:     string;
  readOnly?: boolean;
  required?: boolean;
}

function CurrencyField<T extends FieldValues>({
  control,
  name,
  label,
  readOnly  = false,
  required,
}: CurrencyFieldProps<T>) {
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
          <InputNumber
            id={String(name)}
            prefix="$"
            precision={2}
            min={0}
            disabled={readOnly}
            value={field.value as number ?? 0}
            onChange={(val) => field.onChange(val ?? 0)}
            onBlur={field.onBlur}
            status={error ? 'error' : ''}
            aria-describedby={error ? errorId : undefined}
            aria-required={required}
            aria-readonly={readOnly}
            style={{ width: '100%' }}
            data-testid={`currency-${String(name)}`}
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

export default CurrencyField;
