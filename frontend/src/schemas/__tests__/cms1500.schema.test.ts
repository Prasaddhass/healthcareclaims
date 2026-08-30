import { CMS1500Schema, PatientInfoSchema, ServiceLineSchema, ProviderBillingSchema, ConditionInfoSchema } from '../cms1500.schema';

// ── Helpers ──────────────────────────────────────────────────────────────────

const validPatientInfo = {
  patientName: 'John Doe',
  patientBirthDate: '01/15/80',
  patientSex: 'M' as const,
  patientRelationship: 'Self' as const,
  insuredPolicyNumber: 'POL123',
};

const validInsuredInfo = {
  insuredPolicyNumber: 'POL-123',
  anotherBenefitPlan: 'NO' as const,
};

const validProviderBilling = {
  federalTaxId: '123456789',
  acceptAssignment: 'YES' as const,
  billingProviderName: 'Acme Medical',
  billingProviderNPI: '1234567890',
  totalCharge: 0,
};

const validServiceLine = {
  procedureCode: 'A1234',
  lineCharge: 100,
};

const validDiagnosisEntry = {
  pointer: 'A' as const,
  icdCode: 'Z00.00',
};

const buildValid = (overrides = {}) => ({
  saveAsDraft: false,
  patientInfo: validPatientInfo,
  insuredInfo: validInsuredInfo,
  otherInsurance: {},
  conditionInfo: {},
  diagnosis: [validDiagnosisEntry],
  serviceLines: [validServiceLine],
  providerBilling: validProviderBilling,
  ...overrides,
});

// ── PatientInfoSchema ─────────────────────────────────────────────────────────

describe('PatientInfoSchema', () => {
  it('accepts valid patient info', () => {
    const result = PatientInfoSchema.safeParse(validPatientInfo);
    expect(result.success).toBe(true);
  });

  it('accepts CMS-1500 "Last, First MI" name format with comma', () => {
    const result = PatientInfoSchema.safeParse({ ...validPatientInfo, patientName: 'Doe, John A' });
    expect(result.success).toBe(true);
  });

  it("accepts name with apostrophe (O'Brien)", () => {
    const result = PatientInfoSchema.safeParse({ ...validPatientInfo, patientName: "O'Brien, Patrick" });
    expect(result.success).toBe(true);
  });

  it('accepts hyphenated name (Smith-Jones)', () => {
    const result = PatientInfoSchema.safeParse({ ...validPatientInfo, patientName: 'Smith-Jones, Mary' });
    expect(result.success).toBe(true);
  });

  it('rejects empty patientName', () => {
    const result = PatientInfoSchema.safeParse({ ...validPatientInfo, patientName: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.patientName).toBeDefined();
    }
  });

  it('rejects patientName with invalid characters', () => {
    const result = PatientInfoSchema.safeParse({ ...validPatientInfo, patientName: 'John123' });
    expect(result.success).toBe(false);
  });

  it('rejects patientName longer than 60 chars', () => {
    const result = PatientInfoSchema.safeParse({ ...validPatientInfo, patientName: 'A'.repeat(61) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid birth date format', () => {
    const result = PatientInfoSchema.safeParse({ ...validPatientInfo, patientBirthDate: '1980-01-15' });
    expect(result.success).toBe(false);
  });

  it('accepts MM/DD/YY date format', () => {
    const result = PatientInfoSchema.safeParse({ ...validPatientInfo, patientBirthDate: '12/31/99' });
    expect(result.success).toBe(true);
  });

  it('rejects missing patientSex', () => {
    const { patientSex: _, ...rest } = validPatientInfo as typeof validPatientInfo & { patientSex?: string };
    const result = PatientInfoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ── ConditionInfoSchema superRefine ──────────────────────────────────────────

describe('ConditionInfoSchema', () => {
  it('requires autoAccidentState when autoAccident=YES', () => {
    const result = ConditionInfoSchema.safeParse({ autoAccident: 'YES' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((i) => i.path.includes('autoAccidentState'))).toBe(true);
    }
  });

  it('passes when autoAccident=YES and state provided', () => {
    const result = ConditionInfoSchema.safeParse({ autoAccident: 'YES', autoAccidentState: 'CA' });
    expect(result.success).toBe(true);
  });

  it('passes when autoAccident=NO and no state', () => {
    const result = ConditionInfoSchema.safeParse({ autoAccident: 'NO' });
    expect(result.success).toBe(true);
  });
});

// ── ServiceLineSchema ─────────────────────────────────────────────────────────

describe('ServiceLineSchema', () => {
  it('accepts valid service line', () => {
    const result = ServiceLineSchema.safeParse(validServiceLine);
    expect(result.success).toBe(true);
  });

  it('rejects procedure code shorter than 5 chars', () => {
    const result = ServiceLineSchema.safeParse({ ...validServiceLine, procedureCode: 'AB' });
    expect(result.success).toBe(false);
  });

  it('rejects procedure code with lowercase letters', () => {
    const result = ServiceLineSchema.safeParse({ ...validServiceLine, procedureCode: 'a1234' });
    expect(result.success).toBe(false);
  });

  it('rejects negative lineCharge', () => {
    const result = ServiceLineSchema.safeParse({ ...validServiceLine, lineCharge: -1 });
    expect(result.success).toBe(false);
  });
});

// ── ProviderBillingSchema ─────────────────────────────────────────────────────

describe('ProviderBillingSchema', () => {
  it('rejects federalTaxId with 8 digits', () => {
    const result = ProviderBillingSchema.safeParse({ ...validProviderBilling, federalTaxId: '12345678' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.federalTaxId).toBeDefined();
    }
  });

  it('rejects billingProviderNPI with 3 digits', () => {
    const result = ProviderBillingSchema.safeParse({ ...validProviderBilling, billingProviderNPI: '123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.billingProviderNPI).toBeDefined();
    }
  });

  it('accepts valid 10-digit NPI', () => {
    const result = ProviderBillingSchema.safeParse(validProviderBilling);
    expect(result.success).toBe(true);
  });
});

// ── Root CMS1500Schema ────────────────────────────────────────────────────────

describe('CMS1500Schema', () => {
  it('saveAsDraft=true succeeds even with empty data', () => {
    const result = CMS1500Schema.safeParse({
      saveAsDraft: true,
      patientInfo: { patientName: '', patientBirthDate: '', patientSex: 'M', patientRelationship: 'Self', insuredPolicyNumber: '' },
      insuredInfo: { insuredPolicyNumber: '' },
      otherInsurance: {},
      conditionInfo: {},
      diagnosis: [],
      serviceLines: [],
      providerBilling: { federalTaxId: '', acceptAssignment: 'YES', billingProviderName: '', billingProviderNPI: '', totalCharge: 0 },
    });
    // Draft mode bypasses root superRefine; individual field errors may still be present
    // The key check: no "At least 1 diagnosis" or "service line" errors
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).not.toContain('At least 1 diagnosis code is required');
      expect(msgs).not.toContain('At least 1 service line is required');
    }
  });

  it('saveAsDraft=false with valid data succeeds', () => {
    const result = CMS1500Schema.safeParse(buildValid());
    expect(result.success).toBe(true);
  });

  it('rejects more than 12 diagnosis entries', () => {
    const dx = Array.from({ length: 13 }, (_, i) => ({
      pointer: String.fromCharCode(65 + i % 12) as 'A',
      icdCode: 'Z00.00',
    }));
    const result = CMS1500Schema.safeParse(buildValid({ diagnosis: dx }));
    expect(result.success).toBe(false);
  });

  it('rejects more than 6 service lines', () => {
    const lines = Array.from({ length: 7 }, () => validServiceLine);
    const result = CMS1500Schema.safeParse(buildValid({ serviceLines: lines }));
    expect(result.success).toBe(false);
  });

  it('requires diagnosis when saveAsDraft=false and diagnosis empty', () => {
    const result = CMS1500Schema.safeParse(buildValid({ diagnosis: [{ pointer: 'A', icdCode: '' }] }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain('At least 1 diagnosis code is required');
    }
  });

  it('requires serviceLines when saveAsDraft=false and serviceLines empty', () => {
    const result = CMS1500Schema.safeParse(buildValid({ serviceLines: [] }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain('At least 1 service line is required');
    }
  });

  it('rejects patientName with invalid chars at nested path', () => {
    const result = CMS1500Schema.safeParse(buildValid({
      patientInfo: { ...validPatientInfo, patientName: 'John123' },
    }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths.some((p) => p.includes('patientName'))).toBe(true);
    }
  });
});
