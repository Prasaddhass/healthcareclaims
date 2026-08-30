/**
 * AddressGroup — responsive grid for Street / City / State / ZIP / Phone fields.
 * Used in Patient, Insured, Service Facility, and Billing Provider sub-forms.
 */
import { Col, Row } from 'antd';
import type { Control, FieldValues, FieldPath } from 'react-hook-form';
import FormField from './FormField';

interface AddressGroupProps<T extends FieldValues> {
  control:       Control<T>;
  streetName:    FieldPath<T>;
  cityName:      FieldPath<T>;
  stateName:     FieldPath<T>;
  zipName:       FieldPath<T>;
  phoneName?:    FieldPath<T>;
  /** Prefix for each label, e.g. "Patient" → "Patient Street" */
  labelPrefix?:  string;
  showPhone?:    boolean;
}

function AddressGroup<T extends FieldValues>({
  control,
  streetName,
  cityName,
  stateName,
  zipName,
  phoneName,
  labelPrefix = '',
  showPhone   = true,
}: AddressGroupProps<T>) {
  const prefix = labelPrefix ? `${labelPrefix} ` : '';
  return (
    <>
      <Row gutter={16}>
        <Col xs={24}>
          <FormField
            control={control}
            name={streetName}
            label={`${prefix}Street Address`}
            placeholder="Street"
            maxLength={100}
          />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={10}>
          <FormField
            control={control}
            name={cityName}
            label={`${prefix}City`}
            placeholder="City"
            maxLength={50}
          />
        </Col>
        <Col xs={12} sm={4}>
          <FormField
            control={control}
            name={stateName}
            label="State"
            placeholder="CA"
            maxLength={2}
          />
        </Col>
        <Col xs={12} sm={5}>
          <FormField
            control={control}
            name={zipName}
            label="ZIP"
            placeholder="ZIP"
            maxLength={10}
          />
        </Col>
        {showPhone && phoneName && (
          <Col xs={24} sm={5}>
            <FormField
              control={control}
              name={phoneName}
              label={`${prefix}Phone`}
              placeholder="(000) 000-0000"
              maxLength={15}
            />
          </Col>
        )}
      </Row>
    </>
  );
}

export default AddressGroup;
