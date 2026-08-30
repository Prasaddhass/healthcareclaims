/**
 * ProviderBillingSection — CMS-1500 Items 22–33b.
 * Item 28 (totalCharge) is read-only, auto-populated from ServiceLinesSection.
 */
import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Card, Col, Radio, Row, Typography } from 'antd';
import type { CMS1500FormValues } from '@/schemas/cms1500.schema';
import FormField     from '@/components/shared/FormField';
import NPIField      from '@/components/shared/NPIField';
import CurrencyField from '@/components/shared/CurrencyField';
import AddressGroup  from '@/components/shared/AddressGroup';

const { Title } = Typography;

const ProviderBillingSection: React.FC = () => {
  const { control } = useFormContext<CMS1500FormValues>();

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>Section 7 — Provider & Billing</Title>}
      style={{ marginBottom: 24 }}
      data-testid="provider-billing-section"
    >
      {/* Items 22–23 */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <FormField
            control={control}
            name="providerBilling.resubmissionCode"
            label="Item 22 — Resubmission Code"
            placeholder=""
            maxLength={5}
          />
        </Col>
        <Col xs={24} sm={8}>
          <FormField
            control={control}
            name="providerBilling.originalRefNumber"
            label="Item 22 — Original Ref Number"
            placeholder=""
            maxLength={50}
          />
        </Col>
        <Col xs={24} sm={8}>
          <FormField
            control={control}
            name="providerBilling.priorAuthNumber"
            label="Item 23 — Prior Authorization Number"
            placeholder=""
            maxLength={50}
          />
        </Col>
      </Row>

      {/* Item 25 — Federal Tax ID */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <FormField
            control={control}
            name="providerBilling.federalTaxId"
            label="Item 25 — Federal Tax ID (9 digits)"
            placeholder="123456789"
            maxLength={9}
            required
            data-testid="federal-tax-id"
          />
        </Col>
        <Col xs={24} sm={8}>
          <FormField
            control={control}
            name="providerBilling.patientAccountNumber"
            label="Item 26 — Patient Account Number"
            placeholder=""
            maxLength={50}
          />
        </Col>

        {/* Item 27 — Accept Assignment */}
        <Col xs={24} sm={8}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Item 27 — Accept Assignment <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <Controller
              control={control}
              name="providerBilling.acceptAssignment"
              render={({ field, fieldState: { error } }) => (
                <>
                  <Radio.Group {...field} data-testid="accept-assignment">
                    <Radio value="YES">YES</Radio>
                    <Radio value="NO">NO</Radio>
                  </Radio.Group>
                  {error && (
                    <div role="alert" style={{ color: '#ff4d4f', fontSize: 13, marginTop: 4 }}>
                      {error.message}
                    </div>
                  )}
                </>
              )}
            />
          </div>
        </Col>
      </Row>

      {/* Item 28 — Total Charge (read-only, set by ServiceLinesSection) */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <CurrencyField
            control={control}
            name="providerBilling.totalCharge"
            label="Item 28 — Total Charge"
            readOnly
          />
        </Col>
        <Col xs={24} sm={8}>
          <CurrencyField
            control={control}
            name="providerBilling.amountPaid"
            label="Item 29 — Amount Paid"
          />
        </Col>
      </Row>

      {/* Item 32 — Service Facility */}
      <Title level={5} style={{ marginTop: 8 }}>Item 32 — Service Facility Location</Title>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <FormField
            control={control}
            name="providerBilling.serviceFacilityName"
            label="Facility Name"
            placeholder="Facility name"
            maxLength={100}
          />
        </Col>
        <Col xs={24} sm={12}>
          <NPIField
            control={control}
            name="providerBilling.serviceFacilityNPI"
            label="Item 32a — Service Facility NPI"
          />
        </Col>
      </Row>
      <AddressGroup<CMS1500FormValues>
        control={control}
        streetName="providerBilling.serviceFacilityStreet"
        cityName="providerBilling.serviceFacilityCity"
        stateName="providerBilling.serviceFacilityState"
        zipName="providerBilling.serviceFacilityZip"
        labelPrefix="Facility"
        showPhone={false}
      />

      {/* Item 33 — Billing Provider */}
      <Title level={5} style={{ marginTop: 8 }}>Item 33 — Billing Provider</Title>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <FormField
            control={control}
            name="providerBilling.billingProviderName"
            label="Billing Provider Name"
            placeholder="Provider or org name"
            maxLength={100}
            required
          />
        </Col>
        <Col xs={24} sm={12}>
          <NPIField
            control={control}
            name="providerBilling.billingProviderNPI"
            label="Item 33a — Billing Provider NPI"
            required
          />
        </Col>
      </Row>
      <AddressGroup<CMS1500FormValues>
        control={control}
        streetName="providerBilling.billingProviderStreet"
        cityName="providerBilling.billingProviderCity"
        stateName="providerBilling.billingProviderState"
        zipName="providerBilling.billingProviderZip"
        phoneName="providerBilling.billingProviderPhone"
        labelPrefix="Billing"
        showPhone
      />
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <FormField
            control={control}
            name="providerBilling.billingProviderIdQual"
            label="Item 33b — ID Qualifier"
            placeholder=""
            maxLength={2}
          />
        </Col>
        <Col xs={24} sm={8}>
          <FormField
            control={control}
            name="providerBilling.billingProviderId"
            label="Item 33b — Additional ID"
            placeholder=""
            maxLength={50}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default ProviderBillingSection;
