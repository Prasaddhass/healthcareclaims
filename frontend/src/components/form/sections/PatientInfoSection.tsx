/**
 * PatientInfoSection — CMS-1500 Items 1–6.
 * Uses useFormContext so it receives `control` from ClaimFormPage's FormProvider.
 */
import React from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { Card, Col, Radio, Row, Typography } from 'antd';
import type { CMS1500FormValues } from '@/schemas/cms1500.schema';
import FormField    from '@/components/shared/FormField';
import AddressGroup from '@/components/shared/AddressGroup';

const { Title } = Typography;

const INSURANCE_TYPES = [
  'Medicare', 'Medicaid', 'TRICARE', 'CHAMPVA', 'GroupHealthPlan', 'FECA', 'Other',
] as const;

const PatientInfoSection: React.FC = () => {
  const { control } = useFormContext<CMS1500FormValues>();

  // Item 4 — Insured Name: visible only when relationship ≠ Self
  const relationship  = useWatch({ control, name: 'patientInfo.patientRelationship' });
  const showInsuredName = relationship && relationship !== 'Self';

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>Section 1 — Patient Information</Title>}
      style={{ marginBottom: 24 }}
      data-testid="patient-info-section"
    >
      {/* Item 1 — Insurance Type */}
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Item 1 — Insurance Type
            </label>
            <Controller
              control={control}
              name="patientInfo.insuranceType"
              render={({ field }) => (
                <Radio.Group {...field} data-testid="insurance-type-group">
                  <Row gutter={[8, 8]}>
                    {INSURANCE_TYPES.map((t) => (
                      <Col key={t}><Radio value={t}>{t}</Radio></Col>
                    ))}
                  </Row>
                </Radio.Group>
              )}
            />
          </div>
        </Col>
        <Col xs={24} sm={12}>
          <FormField
            control={control}
            name="patientInfo.insuredIdNumber"
            label="Item 1a — Insured's ID Number"
            placeholder="Insured ID"
            maxLength={30}
          />
        </Col>
      </Row>

      {/* Item 2 — Patient Name */}
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <FormField
            control={control}
            name="patientInfo.patientName"
            label="Item 2 — Patient Name (Last, First, MI)"
            placeholder="Doe, John A"
            maxLength={60}
            required
            data-testid="patient-name"
          />
        </Col>

        {/* Item 3 — DOB + Sex */}
        <Col xs={12} sm={6}>
          <FormField
            control={control}
            name="patientInfo.patientBirthDate"
            label="Item 3 — Date of Birth (MM/DD/YY)"
            placeholder="01/01/80"
            maxLength={8}
            required
          />
        </Col>
        <Col xs={12} sm={6}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Item 3 — Sex <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <Controller
              control={control}
              name="patientInfo.patientSex"
              render={({ field, fieldState: { error } }) => (
                <>
                  <Radio.Group {...field} data-testid="patient-sex">
                    <Radio value="M">Male</Radio>
                    <Radio value="F">Female</Radio>
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

      {/* Item 4 — Insured Name (conditional fade-in) */}
      <div
        style={{
          maxHeight:  showInsuredName ? 120 : 0,
          opacity:    showInsuredName ? 1   : 0,
          overflow:   'hidden',
          transition: 'max-height 0.3s ease, opacity 0.3s ease',
        }}
        data-testid="insured-name-wrapper"
        aria-hidden={!showInsuredName}
      >
        <FormField
          control={control}
          name="patientInfo.insuredName"
          label="Item 4 — Insured's Name (Last, First, MI)"
          placeholder="Insured name"
          maxLength={60}
        />
      </div>

      {/* Item 5 — Patient Address */}
      <Title level={5} style={{ marginTop: 8 }}>Item 5 — Patient Address</Title>
      <AddressGroup<CMS1500FormValues>
        control={control}
        streetName="patientInfo.patientStreet"
        cityName="patientInfo.patientCity"
        stateName="patientInfo.patientState"
        zipName="patientInfo.patientZip"
        phoneName="patientInfo.patientPhone"
        labelPrefix="Patient"
        showPhone
      />

      {/* Item 6 — Patient Relationship to Insured */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
          Item 6 — Patient Relationship to Insured <span style={{ color: '#ff4d4f' }}>*</span>
        </label>
        <Controller
          control={control}
          name="patientInfo.patientRelationship"
          render={({ field, fieldState: { error } }) => (
            <>
              <Radio.Group {...field} data-testid="patient-relationship">
                <Radio value="Self">Self</Radio>
                <Radio value="Spouse">Spouse</Radio>
                <Radio value="Child">Child</Radio>
                <Radio value="Other">Other</Radio>
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
    </Card>
  );
};

export default PatientInfoSection;
