/**
 * OtherInsuranceSection — CMS-1500 Items 9, 9a, 9d, 12, 13.
 * Shows N/A message when Item 11d (anotherBenefitPlan) is not YES.
 */
import React from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { Card, Checkbox, Col, Empty, Row, Typography } from 'antd';
import type { CMS1500FormValues } from '@/schemas/cms1500.schema';
import FormField from '@/components/shared/FormField';

const { Title } = Typography;

const OtherInsuranceSection: React.FC = () => {
  const { control } = useFormContext<CMS1500FormValues>();
  const isActive = useWatch({ control, name: 'insuredInfo.anotherBenefitPlan' }) === 'YES';

  if (!isActive) {
    return (
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Section 3 — Other Insurance</Title>}
        data-testid="other-insurance-section"
      >
        <Empty description="Not applicable — set Item 11d to YES to activate" />
      </Card>
    );
  }

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>Section 3 — Other Insurance</Title>}
      style={{ marginBottom: 24 }}
      data-testid="other-insurance-section"
    >
      {/* Item 9 — Other Insured Name */}
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <FormField
            control={control}
            name="otherInsurance.otherInsuredName"
            label="Item 9 — Other Insured's Name"
            placeholder="Last, First, MI"
            maxLength={60}
          />
        </Col>

        {/* Item 9a — Other Insured's Policy Number */}
        <Col xs={24} sm={12}>
          <FormField
            control={control}
            name="otherInsurance.otherPolicyNumber"
            label="Item 9a — Other Insured's Policy Number"
            placeholder="Policy number"
            maxLength={50}
          />
        </Col>
      </Row>

      {/* Item 9d — Other Insurance Plan Name */}
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <FormField
            control={control}
            name="otherInsurance.otherPlanName"
            label="Item 9d — Other Insurance Plan Name"
            placeholder="Plan name"
            maxLength={100}
          />
        </Col>
      </Row>

      {/* Item 12 — Patient Signature */}
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <div style={{ marginBottom: 16 }}>
            <Controller
              control={control}
              name="otherInsurance.patientSignature"
              render={({ field }) => (
                <Checkbox
                  checked={field.value ?? false}
                  onChange={(e) => field.onChange(e.target.checked)}
                  data-testid="patient-signature"
                >
                  Item 12 — Patient Signature on File
                </Checkbox>
              )}
            />
          </div>
        </Col>
        <Col xs={24} sm={12}>
          <FormField
            control={control}
            name="otherInsurance.patientSignatureDate"
            label="Item 12 — Signature Date (MM/DD/YY)"
            placeholder="01/01/24"
            maxLength={8}
          />
        </Col>
      </Row>

      {/* Item 13 — Insured Signature */}
      <Row gutter={16}>
        <Col xs={24}>
          <div style={{ marginBottom: 16 }}>
            <Controller
              control={control}
              name="otherInsurance.insuredSignature"
              render={({ field }) => (
                <Checkbox
                  checked={field.value ?? false}
                  onChange={(e) => field.onChange(e.target.checked)}
                  data-testid="insured-signature"
                >
                  Item 13 — Insured's or Authorized Person's Signature on File
                </Checkbox>
              )}
            />
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default OtherInsuranceSection;
