/**
 * DateRangeField — From / To DatePicker pair rendered in antd Row/Col.
 * Stores string values (MM/DD/YY) to match the rest of the form.
 */
import { Col, Row } from 'antd';
import type { Control, FieldValues, FieldPath } from 'react-hook-form';
import FormField from './FormField';

interface DateRangeFieldProps<T extends FieldValues> {
  control:     Control<T>;
  fromName:    FieldPath<T>;
  toName:      FieldPath<T>;
  fromLabel:   string;
  toLabel:     string;
}

function DateRangeField<T extends FieldValues>({
  control,
  fromName,
  toName,
  fromLabel,
  toLabel,
}: DateRangeFieldProps<T>) {
  return (
    <Row gutter={16}>
      <Col xs={12}>
        <FormField
          control={control}
          name={fromName}
          label={fromLabel}
          placeholder="MM/DD/YY"
          maxLength={8}
        />
      </Col>
      <Col xs={12}>
        <FormField
          control={control}
          name={toName}
          label={toLabel}
          placeholder="MM/DD/YY"
          maxLength={8}
        />
      </Col>
    </Row>
  );
}

export default DateRangeField;
