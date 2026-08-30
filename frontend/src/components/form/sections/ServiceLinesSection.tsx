/**
 * ServiceLinesSection — CMS-1500 Items 24A–24J, dynamic rows (1–6).
 * useFieldArray manages rows; Total Charge is auto-calculated from lineCharge sum.
 */
import React, { useEffect } from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { Button, Card, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { CMS1500FormValues } from '@/schemas/cms1500.schema';
import ServiceLineRow from './ServiceLineRow';

const { Title } = Typography;

const MAX_LINES = 6;

const EMPTY_LINE = {
  serviceDateFrom:     '',
  serviceDateTo:       '',
  placeOfService:      '',
  emgIndicator:        false,
  procedureCode:       '',
  diagnosisPointer:    '',
  lineCharge:          0,
  daysUnits:           1,
  epsdtFamilyPlan:     '',
  idQualifier:         '',
  renderingProviderId: '',
  lineSequence:        0,
};

const ServiceLinesSection: React.FC = () => {
  const { control, setValue } = useFormContext<CMS1500FormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'serviceLines' });

  // Auto-calculate total charge whenever any lineCharge changes
  const serviceLines = useWatch({ control, name: 'serviceLines' });
  useEffect(() => {
    const total = (serviceLines ?? []).reduce(
      (sum, line) => sum + (Number(line?.lineCharge) || 0),
      0,
    );
    setValue('providerBilling.totalCharge', Math.round(total * 100) / 100);
  }, [serviceLines, setValue]);

  const handleAdd = () => {
    if (fields.length < MAX_LINES) {
      append({ ...EMPTY_LINE, lineSequence: fields.length + 1 });
    }
  };

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>Section 6 — Service Lines (Items 24A–24J)</Title>}
      style={{ marginBottom: 24 }}
      data-testid="service-lines-section"
      extra={
        <Button
          icon={<PlusOutlined />}
          onClick={handleAdd}
          disabled={fields.length >= MAX_LINES}
          data-testid="add-service-line"
          size="small"
        >
          Add Row {fields.length >= MAX_LINES ? '(max 6)' : `(${fields.length}/6)`}
        </Button>
      }
    >
      {fields.length === 0 && (
        <div
          style={{ textAlign: 'center', color: '#8c8c8c', padding: '24px 0' }}
          data-testid="no-service-lines"
        >
          No service lines. Click "Add Row" to begin.
        </div>
      )}

      {fields.map((field, index) => (
        <ServiceLineRow
          key={field.id}
          index={index}
          onRemove={remove}
          canRemove={fields.length > 1}
        />
      ))}
    </Card>
  );
};

export default ServiceLinesSection;
