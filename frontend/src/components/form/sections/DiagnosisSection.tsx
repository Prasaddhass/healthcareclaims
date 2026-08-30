/**
 * DiagnosisSection — CMS-1500 Item 21 (A–L), 12 ICD-10 code inputs.
 * useFieldArray with 12 pre-populated blank entries.
 * Input is forced to uppercase on every keystroke.
 */
import React from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Card, Col, Input, Row, Tag, Typography } from 'antd';
import type { CMS1500FormValues } from '@/schemas/cms1500.schema';

const { Title } = Typography;

const POINTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;

const DiagnosisSection: React.FC = () => {
  const { control } = useFormContext<CMS1500FormValues>();
  const { fields } = useFieldArray({ control, name: 'diagnosis' });

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>Section 5 — Diagnosis Codes (Item 21, A–L)</Title>}
      style={{ marginBottom: 24 }}
      data-testid="diagnosis-section"
    >
      <Row gutter={[16, 0]}>
        {fields.map((field, index) => {
          const pointer = POINTERS[index];
          const errorId = `diagnosis-${index}-error`;
          return (
            <Col xs={24} sm={12} md={8} key={field.id}>
              <Controller
                control={control}
                name={`diagnosis.${index}.icdCode`}
                render={({ field: f, fieldState: { error } }) => (
                  <div style={{ marginBottom: 16 }}>
                    <label
                      htmlFor={`dx-${pointer}`}
                      style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}
                    >
                      {pointer}
                    </label>
                    <Input
                      id={`dx-${pointer}`}
                      value={f.value ?? ''}
                      onChange={(e) => f.onChange(e.target.value.toUpperCase())}
                      onBlur={f.onBlur}
                      placeholder={`ICD-10 Code ${pointer}`}
                      maxLength={10}
                      status={error ? 'error' : ''}
                      aria-describedby={error ? errorId : undefined}
                      addonBefore={<Tag color="blue">{pointer}</Tag>}
                      data-testid={`dx-input-${pointer}`}
                    />
                    {error && (
                      <div
                        id={errorId}
                        role="alert"
                        style={{ color: '#ff4d4f', fontSize: 13, marginTop: 4 }}
                      >
                        {error.message}
                      </div>
                    )}
                  </div>
                )}
              />
            </Col>
          );
        })}
      </Row>
    </Card>
  );
};

export default DiagnosisSection;
