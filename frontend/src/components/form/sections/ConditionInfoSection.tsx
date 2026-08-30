/**
 * ConditionInfoSection — CMS-1500 Items 10a–c, 14–20.
 * Item 10b: auto accident state fades in when autoAccident=YES.
 * Item 20: outside lab charges appear when outsideLab=YES.
 */
import React from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { Card, Col, Radio, Row, Typography } from 'antd';
import type { CMS1500FormValues } from '@/schemas/cms1500.schema';
import FormField      from '@/components/shared/FormField';
import DateRangeField from '@/components/shared/DateRangeField';
import NPIField       from '@/components/shared/NPIField';
import CurrencyField  from '@/components/shared/CurrencyField';

const { Title } = Typography;

const ConditionInfoSection: React.FC = () => {
  const { control } = useFormContext<CMS1500FormValues>();

  const autoAccident = useWatch({ control, name: 'conditionInfo.autoAccident' });
  const outsideLab   = useWatch({ control, name: 'conditionInfo.outsideLab' });
  const showAutoState   = autoAccident === 'YES';
  const showLabCharges  = outsideLab === 'YES';

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>Section 4 — Condition Information</Title>}
      style={{ marginBottom: 24 }}
      data-testid="condition-info-section"
    >
      {/* Items 10a–c */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Item 10a — Employment Related?
            </label>
            <Controller
              control={control}
              name="conditionInfo.employmentRelated"
              render={({ field }) => (
                <Radio.Group {...field} data-testid="employment-related">
                  <Radio value="YES">YES</Radio>
                  <Radio value="NO">NO</Radio>
                </Radio.Group>
              )}
            />
          </div>
        </Col>

        <Col xs={24} sm={8}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Item 10b — Auto Accident?
            </label>
            <Controller
              control={control}
              name="conditionInfo.autoAccident"
              render={({ field }) => (
                <Radio.Group {...field} data-testid="auto-accident">
                  <Radio value="YES">YES</Radio>
                  <Radio value="NO">NO</Radio>
                </Radio.Group>
              )}
            />
          </div>
          {/* 10b State — conditional fade */}
          <div
            style={{
              maxHeight:  showAutoState ? 80 : 0,
              opacity:    showAutoState ? 1  : 0,
              overflow:   'hidden',
              transition: 'max-height 0.3s ease, opacity 0.3s ease',
            }}
            data-testid="auto-accident-state-wrapper"
            aria-hidden={!showAutoState}
          >
            <FormField
              control={control}
              name="conditionInfo.autoAccidentState"
              label="State"
              placeholder="CA"
              maxLength={2}
              data-testid="auto-accident-state"
            />
          </div>
        </Col>

        <Col xs={24} sm={8}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Item 10c — Other Accident?
            </label>
            <Controller
              control={control}
              name="conditionInfo.otherAccident"
              render={({ field }) => (
                <Radio.Group {...field} data-testid="other-accident">
                  <Radio value="YES">YES</Radio>
                  <Radio value="NO">NO</Radio>
                </Radio.Group>
              )}
            />
          </div>
        </Col>
      </Row>

      {/* Items 14–16 Dates */}
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <FormField
            control={control}
            name="conditionInfo.illnessDate"
            label="Item 14 — Date of Illness / Injury / Pregnancy (MM/DD/YY)"
            placeholder="MM/DD/YY"
            maxLength={8}
          />
        </Col>
        <Col xs={24} sm={12}>
          <FormField
            control={control}
            name="conditionInfo.illnessQualifier"
            label="Item 14 — Qualifier (431/484/453)"
            placeholder="431"
            maxLength={3}
          />
        </Col>
      </Row>

      {/* Item 17 — Referring Provider */}
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <FormField
            control={control}
            name="conditionInfo.referringProviderName"
            label="Item 17 — Referring Provider Name"
            placeholder="Dr. Last, First"
            maxLength={60}
          />
        </Col>
        <Col xs={24} sm={12}>
          <NPIField
            control={control}
            name="conditionInfo.referringProviderNPI"
            label="Item 17b — Referring Provider NPI"
          />
        </Col>
      </Row>

      {/* Items 18 — Hospitalisation Dates */}
      <DateRangeField<CMS1500FormValues>
        control={control}
        fromName="conditionInfo.hospitalizationFrom"
        toName="conditionInfo.hospitalizationTo"
        fromLabel="Item 18 — Hospitalisation From"
        toLabel="Item 18 — To"
      />

      {/* Item 19 — Additional Claim Info */}
      <FormField
        control={control}
        name="conditionInfo.additionalClaimInfo"
        label="Item 19 — Additional Claim Info"
        placeholder="Additional information"
        maxLength={80}
      />

      {/* Item 20 — Outside Lab */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Item 20 — Outside Lab?
            </label>
            <Controller
              control={control}
              name="conditionInfo.outsideLab"
              render={({ field }) => (
                <Radio.Group {...field} data-testid="outside-lab">
                  <Radio value="YES">YES</Radio>
                  <Radio value="NO">NO</Radio>
                </Radio.Group>
              )}
            />
          </div>
        </Col>
        {showLabCharges && (
          <Col xs={24} sm={8}>
            <CurrencyField
              control={control}
              name="conditionInfo.outsideLabCharges"
              label="Item 20 — Lab Charges"
            />
          </Col>
        )}
      </Row>

      {/* Unable to Work Dates */}
      <DateRangeField<CMS1500FormValues>
        control={control}
        fromName="conditionInfo.unableToWorkFrom"
        toName="conditionInfo.unableToWorkTo"
        fromLabel="Item 16 — Unable to Work From"
        toLabel="Item 16 — To"
      />
    </Card>
  );
};

export default ConditionInfoSection;
