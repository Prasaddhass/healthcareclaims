/** Claim-related TypeScript types ? re-exported from schemas for consumers. */
export type {
  CMS1500FormValues,
  PatientInfoValues,
  InsuredInfoValues,
  OtherInsuranceValues,
  ConditionInfoValues,
  DiagnosisEntryValues,
  ServiceLineValues,
  ProviderBillingValues,
} from '@/schemas/cms1500.schema';

export interface DocumentItem {
  document_id: number;
  file_name: string;
  file_type: string;
  document_tag: 'PolicyDocument' | 'ProviderContractAgreement' | 'InsuranceID' | 'MISC';
  file_size_bytes: number;
  uploaded_on: string;
}

/** API response shapes ? snake_case to match FastAPI/Pydantic output */
export interface ClaimSummary {
  claim_id: string;
  patient_id: string | null;
  insurance_name: string | null;
  policy_id: string | null;
  validation_status: string;
  created_on: string | null;
  updated_on: string | null;
  sent_on: string | null;
  total_count: number;
}

export interface ClaimCreatedResponse {
  claim_id: string;
  validation_status: string;
  created_on: string | null;
}

export interface ClaimUpdatedResponse {
  claim_id: string;
  updated_on: string | null;
}

export interface ClaimDiagnosis {
  diagnosisId: string;
  claimId: string;
  pointer: string;
  icdCode: string;
  sequence: number;
}

export interface ClaimServiceLine {
  serviceLineId: string;
  claimId: string;
  lineSequence: number;
  serviceDateFrom: string | null;
  serviceDateTo: string | null;
  placeOfService: string | null;
  emgIndicator: boolean;
  procedureCode: string;
  diagnosisPointer: string | null;
  lineCharge: number;
  daysUnits: number | null;
  epsdtFamilyPlan: string | null;
  idQualifier: string | null;
  renderingProviderId: string | null;
}

export interface ClaimDetailResponse {
  header: Record<string, unknown>;
  diagnosis: ClaimDiagnosis[];
  service_lines: ClaimServiceLine[];
  documents: DocumentItem[];
}
