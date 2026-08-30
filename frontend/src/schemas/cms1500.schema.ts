/**
 * CMS-1500 form Zod schema — all 47 fields across 7 sections.
 * saveAsDraft=true bypasses all mandatory-field checks (draft can be empty).
 */
import { z } from 'zod';

// ── Shared regexes ────────────────────────────────────────────────────────────
const NAME_REGEX        = /^[A-Za-zÀ-ÖØ-öø-ÿ' ,.-]+$/;
const DATE_MM_DD_YY     = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{2}$/;
const ICD_CODE_REGEX    = /^[A-Z0-9.]+$/;
const PROCEDURE_REGEX   = /^[A-Z0-9]{5}$/;
const POS_REGEX         = /^\d{2}$/;
const TAX_ID_REGEX      = /^\d{9}$/;
const NPI_REGEX         = /^\d{10}$/;
const POLICY_REGEX      = /^[A-Za-z0-9\-.]+$/;
const STATE_REGEX_2     = /^[A-Z]{2}$/;

// ── Section 1 — Patient Info (Items 1–6) ─────────────────────────────────────
export const PatientInfoSchema = z.object({
  insuranceType: z
    .enum(['Medicare', 'Medicaid', 'TRICARE', 'CHAMPVA', 'GroupHealthPlan', 'FECA', 'Other'])
    .optional(),
  insuredIdNumber: z.string().optional(),
  patientName: z
    .string()
    .min(1, 'Patient name is required')
    .max(60, 'Max 60 characters')
    .regex(NAME_REGEX, 'Invalid characters in name'),
  patientBirthDate: z
    .string()
    .min(1, 'Date of birth is required')
    .regex(DATE_MM_DD_YY, 'Use MM/DD/YY format'),
  patientSex: z.enum(['M', 'F'], { message: 'Sex is required' }),
  insuredName: z.string().max(60, 'Max 60 characters').optional(),
  patientStreet: z.string().optional(),
  patientCity:   z.string().optional(),
  patientState:  z
    .string()
    .regex(STATE_REGEX_2, 'Use 2-letter state code')
    .optional()
    .or(z.literal('')),
  patientZip:    z.string().optional(),
  patientPhone:  z.string().optional(),
  patientRelationship: z.enum(['Self', 'Spouse', 'Child', 'Other'], {
    message: 'Relationship is required',
  }),
});

// ── Section 2 — Insured Info (Items 7, 11–11d) ───────────────────────────────
export const InsuredInfoSchema = z.object({
  insuredStreet:       z.string().optional(),
  insuredCity:         z.string().optional(),
  insuredState:        z.string().optional(),
  insuredZip:          z.string().optional(),
  insuredPolicyNumber: z
    .string()
    .min(1, 'Policy number is required')
    .regex(POLICY_REGEX, 'Invalid characters in policy number'),
  insuredDOB:          z.string().optional(),
  insuredSex:          z.enum(['M', 'F']).optional(),
  otherClaimId:        z.string().optional(),
  insurancePlanName:   z.string().optional(),
  anotherBenefitPlan:  z.enum(['YES', 'NO']),
});

// ── Section 3 — Other Insurance (Items 9, 9a, 9d, 12, 13) ───────────────────
export const OtherInsuranceSchema = z.object({
  otherInsuredName:    z
    .string()
    .regex(NAME_REGEX, 'Invalid characters in name')
    .max(60, 'Max 60 characters')
    .optional()
    .or(z.literal('')),
  otherPolicyNumber:   z.string().optional(),
  otherPlanName:       z.string().optional(),
  patientSignature:    z.boolean().optional(),
  patientSignatureDate: z.string().optional(),
  insuredSignature:    z.boolean().optional(),
});

// ── Section 4 — Condition Info (Items 10a–c, 14–20) ─────────────────────────
export const ConditionInfoSchema = z
  .object({
    employmentRelated:    z.enum(['YES', 'NO']).optional(),
    autoAccident:         z.enum(['YES', 'NO']).optional(),
    autoAccidentState:    z.string().optional(),
    otherAccident:        z.enum(['YES', 'NO']).optional(),
    illnessDate:          z.string().optional(),
    illnessQualifier:     z.string().optional(),
    otherDate:            z.string().optional(),
    otherDateQualifier:   z.string().optional(),
    unableToWorkFrom:     z.string().optional(),
    unableToWorkTo:       z.string().optional(),
    referringProviderName: z.string().optional(),
    referringProviderNPI: z
      .string()
      .regex(NPI_REGEX, 'NPI must be exactly 10 digits')
      .optional()
      .or(z.literal('')),
    hospitalizationFrom:  z.string().optional(),
    hospitalizationTo:    z.string().optional(),
    additionalClaimInfo:  z.string().optional(),
    outsideLab:           z.enum(['YES', 'NO']).optional(),
    outsideLabCharges:    z.number().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.autoAccident === 'YES' && !data.autoAccidentState) {
      ctx.addIssue({
        path:    ['autoAccidentState'],
        code:    z.ZodIssueCode.custom,
        message: 'State is required when auto accident is YES',
      });
    }
  });

// ── Section 5 — Diagnosis Codes (Item 21, A–L) ───────────────────────────────
export const DiagnosisEntrySchema = z.object({
  pointer:  z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']),
  icdCode:  z
    .string()
    .regex(ICD_CODE_REGEX, 'Invalid ICD code format')
    .optional()
    .or(z.literal('')),
  sequence: z.number().int().optional(),
});

// ── Section 6 — Service Lines (Items 24A–24J) ────────────────────────────────
export const ServiceLineSchema = z.object({
  serviceDateFrom:     z.string().optional(),
  serviceDateTo:       z.string().optional(),
  placeOfService:      z
    .string()
    .regex(POS_REGEX, 'Place of service must be 2 digits')
    .optional()
    .or(z.literal('')),
  emgIndicator:        z.boolean().optional(),
  procedureCode:       z
    .string()
    .min(1, 'Procedure code is required')
    .regex(PROCEDURE_REGEX, 'Procedure code must be 5 alphanumeric characters'),
  diagnosisPointer:    z.string().optional(),
  lineCharge:          z.number().min(0, 'Charge must be non-negative'),
  daysUnits:           z.number().int().min(1).optional(),
  epsdtFamilyPlan:     z.string().optional(),
  idQualifier:         z.string().optional(),
  renderingProviderId: z.string().optional(),
  lineSequence:        z.number().int().optional(),
});

// ── Section 7 — Provider & Billing (Items 22–33b) ────────────────────────────
export const ProviderBillingSchema = z.object({
  resubmissionCode:       z.string().optional(),
  originalRefNumber:      z.string().optional(),
  priorAuthNumber:        z.string().optional(),
  federalTaxId:           z
    .string()
    .min(1, 'Federal Tax ID is required')
    .regex(TAX_ID_REGEX, 'Tax ID must be exactly 9 digits'),
  patientAccountNumber:   z.string().optional(),
  acceptAssignment:       z.enum(['YES', 'NO'], {
    message: 'Accept assignment is required',
  }),
  totalCharge:            z.number().min(0),
  amountPaid:             z.number().min(0).optional(),
  physicianSignature:     z.boolean().optional(),
  physicianSignatureDate: z.string().optional(),
  serviceFacilityName:    z.string().optional(),
  serviceFacilityStreet:  z.string().optional(),
  serviceFacilityCity:    z.string().optional(),
  serviceFacilityState:   z.string().optional(),
  serviceFacilityZip:     z.string().optional(),
  serviceFacilityNPI:     z
    .string()
    .regex(NPI_REGEX, 'NPI must be exactly 10 digits')
    .optional()
    .or(z.literal('')),
  billingProviderName:    z.string().min(1, 'Billing provider name is required'),
  billingProviderStreet:  z.string().optional(),
  billingProviderCity:    z.string().optional(),
  billingProviderState:   z.string().optional(),
  billingProviderZip:     z.string().optional(),
  billingProviderPhone:   z.string().optional(),
  billingProviderNPI:     z
    .string()
    .min(1, 'Billing provider NPI is required')
    .regex(NPI_REGEX, 'NPI must be exactly 10 digits'),
  billingProviderIdQual:  z.string().optional(),
  billingProviderId:      z.string().optional(),
});

// ── Root CMS-1500 schema ─────────────────────────────────────────────────────
export const CMS1500Schema = z
  .object({
    saveAsDraft:     z.boolean(),
    patientInfo:     PatientInfoSchema,
    insuredInfo:     InsuredInfoSchema,
    otherInsurance:  OtherInsuranceSchema,
    conditionInfo:   ConditionInfoSchema,
    diagnosis:       z.array(DiagnosisEntrySchema).max(12, 'Maximum 12 diagnosis codes'),
    serviceLines:    z.array(ServiceLineSchema).max(6, 'Maximum 6 service lines'),
    providerBilling: ProviderBillingSchema,
  })
  .superRefine((data, ctx) => {
    if (data.saveAsDraft) return; // draft bypasses all mandatory checks
    const filledDx = data.diagnosis.filter((d) => d.icdCode && d.icdCode.trim() !== '');
    if (filledDx.length === 0) {
      ctx.addIssue({
        path:    ['diagnosis'],
        code:    z.ZodIssueCode.custom,
        message: 'At least 1 diagnosis code is required',
      });
    }
    if (data.serviceLines.length === 0) {
      ctx.addIssue({
        path:    ['serviceLines'],
        code:    z.ZodIssueCode.custom,
        message: 'At least 1 service line is required',
      });
    }
  });

export type CMS1500FormValues  = z.infer<typeof CMS1500Schema>;
export type PatientInfoValues  = z.infer<typeof PatientInfoSchema>;
export type InsuredInfoValues  = z.infer<typeof InsuredInfoSchema>;
export type OtherInsuranceValues = z.infer<typeof OtherInsuranceSchema>;
export type ConditionInfoValues = z.infer<typeof ConditionInfoSchema>;
export type DiagnosisEntryValues = z.infer<typeof DiagnosisEntrySchema>;
export type ServiceLineValues  = z.infer<typeof ServiceLineSchema>;
export type ProviderBillingValues = z.infer<typeof ProviderBillingSchema>;
