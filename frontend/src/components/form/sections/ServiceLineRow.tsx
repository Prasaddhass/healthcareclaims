/**
 * ServiceLineRow — single CMS-1500 Item 24A–24J service line row.
 * Rendered inside ServiceLinesSection via useFieldArray.
 */
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Button, Col, Row } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { CMS1500FormValues } from '@/schemas/cms1500.schema';
import FormField     from '@/components/shared/FormField';
import CurrencyField from '@/components/shared/CurrencyField';

interface ServiceLineRowProps {
  index:      number;
  onRemove:   (index: number) => void;
  canRemove:  boolean;
}

const ServiceLineRow: React.FC<ServiceLineRowProps> = ({ index, onRemove, canRemove }) => {
  const { control } = useFormContext<CMS1500FormValues>();

  return (
    <div
      style={{
        border:       '1px solid #f0f0f0',
        borderRadius: 4,
        padding:      '12px 16px',
        marginBottom: 12,
        background:   '#fafafa',
      }}
      data-testid={`service-line-row-${index}`}
    >
      <Row gutter={[12, 0]} align="middle">
        {/* 24A — Date From/To */}
        <Col xs={12} sm={6}>
          <FormField
            control={control}
            name={`serviceLines.${index}.serviceDateFrom`}
            label="24A From (MM/DD/YY)"
            placeholder="MM/DD/YY"
            maxLength={8}
          />
        </Col>
        <Col xs={12} sm={6}>
          <FormField
            control={control}
            name={`serviceLines.${index}.serviceDateTo`}
            label="24A To"
            placeholder="MM/DD/YY"
            maxLength={8}
          />
        </Col>

        {/* 24B — Place of Service */}
        <Col xs={8} sm={3}>
          <FormField
            control={control}
            name={`serviceLines.${index}.placeOfService`}
            label="24B POS"
            placeholder="11"
            maxLength={2}
          />
        </Col>

        {/* 24D — CPT / Procedure Code */}
        <Col xs={16} sm={5}>
          <FormField
            control={control}
            name={`serviceLines.${index}.procedureCode`}
            label="24D Procedure Code"
            placeholder="XXXXX"
            maxLength={5}
            required
            data-testid={`procedure-code-${index}`}
          />
        </Col>

        {/* 24E — Diagnosis Pointer */}
        <Col xs={12} sm={4}>
          <FormField
            control={control}
            name={`serviceLines.${index}.diagnosisPointer`}
            label="24E Dx Pointer"
            placeholder="A"
            maxLength={4}
          />
        </Col>

        {/* 24F — Line Charge */}
        <Col xs={12} sm={4}>
          <CurrencyField
            control={control}
            name={`serviceLines.${index}.lineCharge`}
            label="24F Charge"
            required
          />
        </Col>

        {/* 24G — Days / Units */}
        <Col xs={8} sm={3}>
          <FormField
            control={control}
            name={`serviceLines.${index}.daysUnits`}
            label="24G Units"
            placeholder="1"
            maxLength={3}
          />
        </Col>

        {/* 24H — EPSDT */}
        <Col xs={8} sm={3}>
          <FormField
            control={control}
            name={`serviceLines.${index}.epsdtFamilyPlan`}
            label="24H EPSDT"
            placeholder=""
            maxLength={2}
          />
        </Col>

        {/* 24J — Rendering Provider NPI */}
        <Col xs={16} sm={6}>
          <FormField
            control={control}
            name={`serviceLines.${index}.renderingProviderId`}
            label="24J Rendering NPI"
            placeholder="0000000000"
            maxLength={10}
          />
        </Col>

        {/* Remove button */}
        <Col xs={24} sm={2} style={{ textAlign: 'right' }}>
          <Button
            icon={<DeleteOutlined />}
            danger
            size="small"
            disabled={!canRemove}
            onClick={() => onRemove(index)}
            data-testid={`remove-line-${index}`}
            aria-label={`Remove service line ${index + 1}`}
            style={{ marginTop: 24 }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ServiceLineRow;
