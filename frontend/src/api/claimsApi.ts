/**
 * claimsApi ? frontend API client for the claims CRUD + validate + send endpoints.
 */
import api from './axiosInstance';
import type {
  ClaimCreatedResponse,
  ClaimUpdatedResponse,
  ClaimDetailResponse,
  ClaimSummary,
} from '@/types/claim.types';
import type { CMS1500FormValues } from '@/schemas/cms1500.schema';

export interface ClaimListParams {
  page?: number;
  pageSize?: number;
  validationStatus?: string;
  searchTerm?: string;
}

export interface ClaimsListResponse {
  claims: ClaimSummary[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface ValidationErrorItem {
  field: string;
  item_number: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  claim_id: string;
  validation_status: string;
  errors: ValidationErrorItem[];
}

export interface IcdProcedureMapping {
  Procedure_Code: string;
  ICD10CM_Code: string;
}

export interface ProcedureMasterDetail {
  Procedure_Code: number | string;
  Procedure_Description: string;
  Possible_Modifiers: string;
}

export interface DenialClaimServiceLine {
  ServiceDateFrom: string;
  ProcedureCode: string;
  Modifier: string | null;
  LineCharge: number;
  DaysUnits: number;
  PlaceOfService: string;
  ProcedureMaster: ProcedureMasterDetail | null;
  ICDProcedureMappings: IcdProcedureMapping[];
  IsServiceCovered: boolean | null;
  CoverageSections: string[];
}

export interface SourceOrReference {
  PolicyDocumentFileReference: string;
  PageNumberReference: number | null;
  TextReference: string;
  SectionReference: string;
  RelevanceReference: string;
}

export interface DenialReason {
  denialReason: string;
  denialResult: string;
  SourceOrReference: SourceOrReference;
}

/** JSON response returned by sp_GetClaimDetails_ByClaimId. */
export interface DenialClaimDetail {
  ClaimId: string;
  PatientName: string;
  PayerName: string;
  PolicyId: string;
  InsuredPolicyNumber: string;
  ProviderNPI: string;
  IcdCode: string;
  DiagnosisCode: string;
  DiagnosisDescription: string;
  ServiceLines: DenialClaimServiceLine[];
  denialReasons: DenialReason[];
}

export interface SendResult {
  claim_id: string;
  validation_status: string;
  sent_on: string | null;
}

export interface PipelineSuggestion {
  code?: string;
  current_code?: string;
  suggested_code?: string;
  description?: string;
  rationale?: string;
}

export interface PipelineCodingResult {
  has_issues?: boolean;
  suggestions?: PipelineSuggestion[];
}

export interface PipelineValidationResult {
  passed?: boolean;
  issues?: ValidationErrorItem[];
}

export interface PipelineRunResponse {
  claim_id: string;
  pipeline_status: string;
  denial_risk: number;
  validation_result?: PipelineValidationResult | null;
  coding_result?: PipelineCodingResult | null;
}

export interface PipelineDecisionResponse {
  claim_id: string;
  pipeline_status: string;
  human_decision: 'approved' | 'returned';
}

/** Map camelCase form values ? snake_case API payload */
function toApiPayload(data: CMS1500FormValues) {
  const p = data.patientInfo;
  const i = data.insuredInfo;
  const o = data.otherInsurance;
  const c = data.conditionInfo;
  const pb = data.providerBilling;

  return {
    save_as_draft: data.saveAsDraft,
    patient_info: {
      insurance_type: p.insuranceType,
      insured_id_number: p.insuredIdNumber,
      patient_name: p.patientName,
      patient_birth_date: p.patientBirthDate,
      patient_sex: p.patientSex,
      insured_name: p.insuredName,
      patient_street: p.patientStreet,
      patient_city: p.patientCity,
      patient_state: p.patientState,
      patient_zip: p.patientZip,
      patient_phone: p.patientPhone,
      patient_relationship: p.patientRelationship,
    },
    insured_info: {
      insured_street: i.insuredStreet,
      insured_city: i.insuredCity,
      insured_state: i.insuredState,
      insured_zip: i.insuredZip,
      insured_policy_number: i.insuredPolicyNumber,
      insured_dob: i.insuredDOB,
      insured_sex: i.insuredSex,
      other_claim_id: i.otherClaimId,
      insurance_plan_name: i.insurancePlanName,
      another_benefit_plan: i.anotherBenefitPlan,
    },
    other_insurance: {
      other_insured_name: o.otherInsuredName,
      other_policy_number: o.otherPolicyNumber,
      other_plan_name: o.otherPlanName,
      patient_signature: o.patientSignature,
      patient_signature_date: o.patientSignatureDate,
      insured_signature: o.insuredSignature,
    },
    condition_info: {
      employment_related: c.employmentRelated,
      auto_accident: c.autoAccident,
      auto_accident_state: c.autoAccidentState,
      other_accident: c.otherAccident,
      illness_date: c.illnessDate,
      illness_qualifier: c.illnessQualifier,
      other_date: c.otherDate,
      other_date_qualifier: c.otherDateQualifier,
      unable_to_work_from: c.unableToWorkFrom,
      unable_to_work_to: c.unableToWorkTo,
      referring_provider_name: c.referringProviderName,
      referring_provider_npi: c.referringProviderNPI,
      hospitalization_from: c.hospitalizationFrom,
      hospitalization_to: c.hospitalizationTo,
      additional_claim_info: c.additionalClaimInfo,
      outside_lab: c.outsideLab,
      outside_lab_charges: c.outsideLabCharges,
    },
    diagnosis: data.diagnosis
      .filter((d) => d.icdCode && d.icdCode.trim() !== '')
      .map((d) => ({
        pointer: d.pointer,
        icd_code: d.icdCode,
        sequence: d.sequence,
      })),
    service_lines: data.serviceLines.map((sl, idx) => ({
      service_date_from: sl.serviceDateFrom,
      service_date_to: sl.serviceDateTo,
      place_of_service: sl.placeOfService,
      emg_indicator: sl.emgIndicator,
      procedure_code: sl.procedureCode,
      diagnosis_pointer: sl.diagnosisPointer,
      line_charge: sl.lineCharge,
      days_units: sl.daysUnits,
      epsdt_family_plan: sl.epsdtFamilyPlan,
      id_qualifier: sl.idQualifier,
      rendering_provider_id: sl.renderingProviderId,
      line_sequence: sl.lineSequence ?? idx + 1,
    })),
    provider_billing: {
      resubmission_code: pb.resubmissionCode,
      original_ref_number: pb.originalRefNumber,
      prior_auth_number: pb.priorAuthNumber,
      federal_tax_id: pb.federalTaxId,
      patient_account_number: pb.patientAccountNumber,
      accept_assignment: pb.acceptAssignment,
      total_charge: pb.totalCharge,
      amount_paid: pb.amountPaid,
      physician_signature: pb.physicianSignature,
      physician_signature_date: pb.physicianSignatureDate,
      service_facility_name: pb.serviceFacilityName,
      service_facility_street: pb.serviceFacilityStreet,
      service_facility_city: pb.serviceFacilityCity,
      service_facility_state: pb.serviceFacilityState,
      service_facility_zip: pb.serviceFacilityZip,
      service_facility_npi: pb.serviceFacilityNPI,
      billing_provider_name: pb.billingProviderName,
      billing_provider_street: pb.billingProviderStreet,
      billing_provider_city: pb.billingProviderCity,
      billing_provider_state: pb.billingProviderState,
      billing_provider_zip: pb.billingProviderZip,
      billing_provider_phone: pb.billingProviderPhone,
      billing_provider_npi: pb.billingProviderNPI,
      billing_provider_id_qual: pb.billingProviderIdQual,
      billing_provider_id: pb.billingProviderId,
    },
  };
}

export const claimsApi = {
  getClaims: (params: ClaimListParams = {}): Promise<ClaimsListResponse> =>
    api
      .get('/api/claims', {
        params: {
          page: params.page ?? 1,
          page_size: params.pageSize ?? 20,
          validation_status: params.validationStatus,
          search_term: params.searchTerm,
        },
      })
      .then((r) => r.data),

  createClaim: (data: CMS1500FormValues): Promise<ClaimCreatedResponse> =>
    api.post('/api/claims', toApiPayload(data)).then((r) => r.data),

  getClaim: (id: string): Promise<ClaimDetailResponse> => api.get(`/api/claims/${id}`).then((r) => r.data),

  updateClaim: (id: string, data: CMS1500FormValues): Promise<ClaimUpdatedResponse> =>
    api.put(`/api/claims/${id}`, toApiPayload(data)).then((r) => r.data),

  deleteClaim: (id: string): Promise<void> => api.delete(`/api/claims/${id}`).then(() => undefined),

  validateClaim: (id: string): Promise<ValidationResult> => api.post(`/api/claims/${id}/validate`).then((r) => r.data),

  validateDenialClaim: (id: string): Promise<DenialClaimDetail> => api.post(`/api/claims/${id}/validatedenialclaim`).then((r) => r.data),

  sendClaim: (id: string): Promise<SendResult> => api.post(`/api/claims/${id}/send`).then((r) => r.data),

  runPipeline: (id: string): Promise<PipelineRunResponse> => api.post(`/api/claims/${id}/run-pipeline`).then((r) => r.data),

  submitPipelineDecision: (id: string, decision: 'approved' | 'returned'): Promise<PipelineDecisionResponse> =>
    api.post(`/api/claims/${id}/pipeline-decision`, null, { params: { decision } }).then((r) => r.data),
};
