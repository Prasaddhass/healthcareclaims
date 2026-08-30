/**
 * InsuredInfoSection — CMS-1500 Items 7, 11, 11a, 11b, 11c, 11d.
 * Item 11d YES/NO radio — when YES activates Section 3 (OtherInsurance).
 */
import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Card, Col, Radio, Row, Typography } from 'antd';
import type { CMS1500FormValues } from '@/schemas/cms1500.schema';
import FormField    from '@/components/shared/FormField';
import AddressGroup from '@/components/shared/AddressGroup';

const { Title } = Typography;

const InsuredInfoSection: React.FC = () => {
  const { control } = useFormContext<CMS1500FormValues>();

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>Section 2 — Insured Information</Title>}
      style={{ marginBottom: 24 }}
      data-testid="insured-info-section"
    >
      {/* Item 7 — Insured Policy Number */}
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <FormField
            control={control}
            name="insuredInfo.insuredPolicyNumber"
            label="Item 7 — Insured's Policy / FECA Number"
            placeholder="ABC-123"
            maxLength={100}
            required
            data-testid="insured-policy-number"
          />
        </Col>
        <Col xs={24} sm={12}>
          <FormField
            control={control}
            name="insuredInfo.otherClaimId"
            label="Item 11 — Other Claim ID"
            placeholder="Other Claim ID"
            maxLength={50}
          />
        </Col>
      </Row>

      {/* Item 11a — Insured DOB + Sex */}
      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <FormField
            control={control}
            name="insuredInfo.insuredDOB"
            label="Item 11a — Insured DOB (MM/DD/YY)"
            placeholder="01/01/60"
            maxLength={8}
          />
        </Col>
        <Col xs={12} sm={6}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Item 11a — Insured Sex
            </label>
            <Controller
              control={control}
              name="insuredInfo.insuredSex"
              render={({ field }) => (
                <Radio.Group {...field} data-testid="insured-sex">
                  <Radio value="M">Male</Radio>
                  <Radio value="F">Female</Radio>
                </Radio.Group>
              )}
            />
          </div>
        </Col>

        {/* Item 11b — Insurance Plan Name */}
        <Col xs={24} sm={12}>
          <FormField
            control={control}
            name="insuredInfo.insurancePlanName"
            label="Item 11b — Employer Name / School"
            placeholder="Employer or plan name"
            maxLength={100}
          />
        </Col>
      </Row>

      {/* Item 11c — Insurance Plan Name */}
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <FormField
            control={control}
            name="insuredInfo.insurancePlanName"
            label="Item 11c — Insurance Plan Name"
            placeholder="Plan name"
            maxLength={100}
          />
        </Col>
      </Row>

      {/* Item 11d — Another Health Benefit Plan */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
          Item 11d — Another Health Benefit Plan?
        </label>
        <Controller
          control={control}
          name="insuredInfo.anotherBenefitPlan"
          render={({ field }) => (
            <Radio.Group {...field} data-testid="another-benefit-plan">
              <Radio value="YES">YES — complete Items 9, 9a, 9d</Radio>
              <Radio value="NO">NO</Radio>
            </Radio.Group>
          )}
        />
      </div>

      {/* Item 7 — Insured Address */}
      <Title level={5} style={{ marginTop: 8 }}>Item 7 — Insured Address</Title>
      <AddressGroup<CMS1500FormValues>
        control={control}
        streetName="insuredInfo.insuredStreet"
        cityName="insuredInfo.insuredCity"
        stateName="insuredInfo.insuredState"
        zipName="insuredInfo.insuredZip"
        labelPrefix="Insured"
        showPhone={false}
      />
    </Card>
  );
};

export default InsuredInfoSection;
