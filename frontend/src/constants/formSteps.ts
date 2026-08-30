/** CMS-1500 form step definitions used by useClaimForm and FormStepper. */
export const FORM_STEPS = [
  { key: 'patientInfo',     label: 'Patient Info' },
  { key: 'insuredInfo',     label: 'Insured Info' },
  { key: 'otherInsurance',  label: 'Other Insurance' },
  { key: 'conditionInfo',   label: 'Condition Info' },
  { key: 'diagnosis',       label: 'Diagnosis' },
  { key: 'serviceLines',    label: 'Service Lines' },
  { key: 'providerBilling', label: 'Provider/Billing' },
] as const;

export type FormStepKey = (typeof FORM_STEPS)[number]['key'];
