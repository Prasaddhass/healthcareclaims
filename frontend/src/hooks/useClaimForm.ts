/**
 * useClaimForm — central RHF form state for the CMS-1500 claim form.
 *
 * Provides:
 *   - `form`        — full UseFormReturn for passing control/register/etc to sections
 *   - `currentStep` — 0-based index into FORM_STEPS
 *   - `goToStep / nextStep / prevStep`
 *   - `saveDraft / submitClaim / loadClaim`
 */
import { useState, useCallback } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

import { CMS1500Schema, type CMS1500FormValues } from '@/schemas/cms1500.schema';
import { FORM_STEPS } from '@/constants/formSteps';
import { claimsApi } from '@/api/claimsApi';
import { ROUTES } from '@/constants/routes';

const POINTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;

const toFormDate = (value: unknown): string => {
  const text = String(value ?? '');
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  return isoMatch ? `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1].slice(-2)}` : text;
};

const toBoolean = (value: unknown): boolean => value === true || value === 1 || value === '1';

/** Blank form state — all fields initialised to empty strings / defaults. */
export const EMPTY_CLAIM: CMS1500FormValues = {
  saveAsDraft: false,
  patientInfo: {
    insuranceType:      undefined,
    insuredIdNumber:    '',
    patientName:        '',
    patientBirthDate:   '',
    patientSex:         'M',
    insuredName:        '',
    patientStreet:      '',
    patientCity:        '',
    patientState:       '',
    patientZip:         '',
    patientPhone:       '',
    patientRelationship: 'Self',
  },
  insuredInfo: {
    insuredStreet:      '',
    insuredCity:        '',
    insuredState:       '',
    insuredZip:         '',
    insuredPolicyNumber: '',
    insuredDOB:         '',
    insuredSex:         undefined,
    otherClaimId:       '',
    insurancePlanName:  '',
    anotherBenefitPlan: 'NO',
  },
  otherInsurance: {
    otherInsuredName:    '',
    otherPolicyNumber:   '',
    otherPlanName:       '',
    patientSignature:    false,
    patientSignatureDate: '',
    insuredSignature:    false,
  },
  conditionInfo: {
    employmentRelated:    undefined,
    autoAccident:         undefined,
    autoAccidentState:    '',
    otherAccident:        undefined,
    illnessDate:          '',
    illnessQualifier:     '',
    otherDate:            '',
    otherDateQualifier:   '',
    unableToWorkFrom:     '',
    unableToWorkTo:       '',
    referringProviderName: '',
    referringProviderNPI: '',
    hospitalizationFrom:  '',
    hospitalizationTo:    '',
    additionalClaimInfo:  '',
    outsideLab:           undefined,
    outsideLabCharges:    undefined,
  },
  diagnosis: POINTERS.map((p) => ({ pointer: p, icdCode: '', sequence: POINTERS.indexOf(p) + 1 })),
  serviceLines: [],
  providerBilling: {
    resubmissionCode:       '',
    originalRefNumber:      '',
    priorAuthNumber:        '',
    federalTaxId:           '',
    patientAccountNumber:   '',
    acceptAssignment:       'YES',
    totalCharge:            0,
    amountPaid:             undefined,
    physicianSignature:     false,
    physicianSignatureDate: '',
    serviceFacilityName:    '',
    serviceFacilityStreet:  '',
    serviceFacilityCity:    '',
    serviceFacilityState:   '',
    serviceFacilityZip:     '',
    serviceFacilityNPI:     '',
    billingProviderName:    '',
    billingProviderStreet:  '',
    billingProviderCity:    '',
    billingProviderState:   '',
    billingProviderZip:     '',
    billingProviderPhone:   '',
    billingProviderNPI:     '',
    billingProviderIdQual:  '',
    billingProviderId:      '',
  },
};

export function useClaimForm(claimId?: string) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<CMS1500FormValues>({
    resolver:       zodResolver(CMS1500Schema) as Resolver<CMS1500FormValues>,
    defaultValues:  EMPTY_CLAIM,
    mode:           'onSubmit',
    reValidateMode: 'onChange',
  });

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, FORM_STEPS.length - 1)));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, FORM_STEPS.length - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  /** populateForm — maps API response (PascalCase) back into the RHF form. */
  const populateForm = useCallback(
    (detail: { header: Record<string, unknown>; diagnosis: unknown[]; service_lines: unknown[] }) => {
      const h = detail.header;
      const dx = detail.diagnosis as Array<Record<string, unknown>>;
      const lines = detail.service_lines as Array<Record<string, unknown>>;

      form.reset({
        ...EMPTY_CLAIM,
        patientInfo: {
          insuranceType: h['InsuranceType'] as CMS1500FormValues['patientInfo']['insuranceType'],
          insuredIdNumber: String(h['InsuredIdNumber'] ?? ''), patientName: String(h['PatientName'] ?? ''),
          patientBirthDate: toFormDate(h['PatientBirthDate']), patientSex: (h['PatientSex'] as 'M' | 'F') ?? 'M',
          insuredName: String(h['InsuredName'] ?? ''), patientStreet: String(h['PatientStreet'] ?? ''),
          patientCity: String(h['PatientCity'] ?? ''), patientState: String(h['PatientState'] ?? ''),
          patientZip: String(h['PatientZip'] ?? ''), patientPhone: String(h['PatientPhone'] ?? ''),
          patientRelationship: (h['PatientRelationship'] as CMS1500FormValues['patientInfo']['patientRelationship']) ?? 'Self',
        },
        insuredInfo: {
          insuredStreet: String(h['InsuredStreet'] ?? ''), insuredCity: String(h['InsuredCity'] ?? ''),
          insuredState: String(h['InsuredState'] ?? ''), insuredZip: String(h['InsuredZip'] ?? ''),
          insuredPolicyNumber: String(h['InsuredPolicyNumber'] ?? ''), insuredDOB: toFormDate(h['InsuredDOB']),
          insuredSex: h['InsuredSex'] as 'M' | 'F' | undefined, otherClaimId: String(h['OtherClaimId'] ?? ''),
          insurancePlanName: String(h['InsurancePlanName'] ?? ''),
          anotherBenefitPlan: toBoolean(h['AnotherBenefitPlan']) ? 'YES' : 'NO',
        },
        otherInsurance: {
          otherInsuredName: String(h['OtherInsuredName'] ?? ''), otherPolicyNumber: String(h['OtherPolicyNumber'] ?? ''),
          otherPlanName: String(h['OtherPlanName'] ?? ''), patientSignature: toBoolean(h['PatientSignature']),
          patientSignatureDate: toFormDate(h['PatientSignatureDate']), insuredSignature: toBoolean(h['InsuredSignature']),
        },
        conditionInfo: {
          employmentRelated: h['EmploymentRelated'] as 'YES' | 'NO' | undefined,
          autoAccident: h['AutoAccident'] as 'YES' | 'NO' | undefined, autoAccidentState: String(h['AutoAccidentState'] ?? ''),
          otherAccident: h['OtherAccident'] as 'YES' | 'NO' | undefined, illnessDate: toFormDate(h['IllnessDate']),
          illnessQualifier: String(h['IllnessQualifier'] ?? ''), otherDate: toFormDate(h['OtherDate']),
          otherDateQualifier: String(h['OtherDateQualifier'] ?? ''), unableToWorkFrom: toFormDate(h['UnableToWorkFrom']),
          unableToWorkTo: toFormDate(h['UnableToWorkTo']), referringProviderName: String(h['ReferringProviderName'] ?? ''),
          referringProviderNPI: String(h['ReferringProviderNPI'] ?? ''), hospitalizationFrom: toFormDate(h['HospitalizationFrom']),
          hospitalizationTo: toFormDate(h['HospitalizationTo']), additionalClaimInfo: String(h['AdditionalClaimInfo'] ?? ''),
          outsideLab: h['OutsideLab'] == null ? undefined : toBoolean(h['OutsideLab']),
          outsideLabCharges: h['OutsideLabCharges'] == null ? undefined : Number(h['OutsideLabCharges']),
        },
        diagnosis: POINTERS.map((pointer, index) => {
          const entry = dx.find((item) => item['Pointer'] === pointer || item['pointer'] === pointer);
          return { pointer, icdCode: String(entry?.['IcdCode'] ?? entry?.['icd_code'] ?? ''), sequence: index + 1 };
        }),
        serviceLines: lines.map((sl, index) => ({
          serviceDateFrom: toFormDate(sl['ServiceDateFrom'] ?? sl['service_date_from']), serviceDateTo: toFormDate(sl['ServiceDateTo'] ?? sl['service_date_to']),
          placeOfService: String(sl['PlaceOfService'] ?? sl['place_of_service'] ?? ''), emgIndicator: toBoolean(sl['EmgIndicator'] ?? sl['emg_indicator']),
          procedureCode: String(sl['ProcedureCode'] ?? sl['procedure_code'] ?? ''), diagnosisPointer: String(sl['DiagnosisPointer'] ?? sl['diagnosis_pointer'] ?? ''),
          lineCharge: Number(sl['LineCharge'] ?? sl['line_charge'] ?? 0), daysUnits: Number(sl['DaysUnits'] ?? sl['days_units'] ?? 1),
          epsdtFamilyPlan: String(sl['EpsdtFamilyPlan'] ?? sl['epsdt_family_plan'] ?? ''), idQualifier: String(sl['IdQualifier'] ?? sl['id_qualifier'] ?? ''),
          renderingProviderId: String(sl['RenderingProviderId'] ?? sl['rendering_provider_id'] ?? ''), lineSequence: Number(sl['LineSequence'] ?? sl['line_sequence'] ?? index + 1),
        })),
        providerBilling: {
          resubmissionCode: String(h['ResubmissionCode'] ?? ''), originalRefNumber: String(h['OriginalRefNumber'] ?? ''),
          priorAuthNumber: String(h['PriorAuthNumber'] ?? ''), federalTaxId: String(h['FederalTaxId'] ?? ''),
          patientAccountNumber: String(h['PatientAccountNumber'] ?? ''), acceptAssignment: (h['AcceptAssignment'] as 'YES' | 'NO') ?? 'YES',
          totalCharge: Number(h['TotalCharge'] ?? 0), amountPaid: h['AmountPaid'] == null ? undefined : Number(h['AmountPaid']),
          physicianSignature: toBoolean(h['PhysicianSignature']), physicianSignatureDate: toFormDate(h['PhysicianSignatureDate']),
          serviceFacilityName: String(h['ServiceFacilityName'] ?? ''), serviceFacilityStreet: String(h['ServiceFacilityStreet'] ?? ''),
          serviceFacilityCity: String(h['ServiceFacilityCity'] ?? ''), serviceFacilityState: String(h['ServiceFacilityState'] ?? ''),
          serviceFacilityZip: String(h['ServiceFacilityZip'] ?? ''), serviceFacilityNPI: String(h['ServiceFacilityNPI'] ?? ''),
          billingProviderName: String(h['BillingProviderName'] ?? ''), billingProviderStreet: String(h['BillingProviderStreet'] ?? ''),
          billingProviderCity: String(h['BillingProviderCity'] ?? ''), billingProviderState: String(h['BillingProviderState'] ?? ''),
          billingProviderZip: String(h['BillingProviderZip'] ?? ''), billingProviderPhone: String(h['BillingProviderPhone'] ?? ''),
          billingProviderNPI: String(h['BillingProviderNPI'] ?? ''), billingProviderIdQual: String(h['BillingProviderIdQual'] ?? ''), billingProviderId: String(h['BillingProviderId'] ?? ''),
        },
      });

    },
    [form],
  );

  /** saveDraft — sets saveAsDraft=true, validates draft (bypasses required checks), POSTs or PUTs. */
  const saveDraft = useCallback(async (): Promise<void> => {
    form.setValue('saveAsDraft', true);
    const data = form.getValues();
    try {
      if (claimId) {
        await claimsApi.updateClaim(claimId, data);
      } else {
        await claimsApi.createClaim(data);
      }
      void message.success('Draft saved');
      navigate(ROUTES.CLAIMS);
    } catch {
      void message.error('Failed to save draft');
    }
  }, [form, claimId, navigate]);

  /** submitClaim — full validation + POST/PUT. */
  const submitClaim = useCallback(async (): Promise<void> => {
    form.setValue('saveAsDraft', false);
    const valid = await form.trigger();
    if (!valid) return;
    const data = form.getValues();
    try {
      if (claimId) {
        await claimsApi.updateClaim(claimId, data);
      } else {
        await claimsApi.createClaim(data);
      }
      void message.success('Claim submitted successfully');
      navigate(ROUTES.CLAIMS);
    } catch {
      void message.error('Failed to submit claim');
    }
  }, [form, claimId, navigate]);

  const validateClaim = useCallback(async (): Promise<void> => {
    form.setValue('saveAsDraft', false);
    const valid = await form.trigger();
    if (!valid) return;
    const data = form.getValues();
    try {
      const claim = claimId
        ? await claimsApi.updateClaim(claimId, data).then(() => ({ claim_id: claimId }))
        : await claimsApi.createClaim(data);
      const result = await claimsApi.validateClaim(claim.claim_id);
      if (result.errors.length) {
        void message.warning(`Validation found ${result.errors.length} issue(s)`);
      } else {
        void message.success('Claim validated successfully');
      }
      navigate(ROUTES.CLAIMS);
    } catch {
      void message.error('Failed to validate claim');
    }
  }, [form, claimId, navigate]);

  /** loadClaim — fetches an existing claim and populates the form. */
  const loadClaim = useCallback(async (id: string): Promise<void> => {
    try {
      const detail = await claimsApi.getClaim(id);
      populateForm({
        header:        detail.header as Record<string, unknown>,
        diagnosis:     detail.diagnosis as unknown[],
        service_lines: detail.service_lines as unknown[],
      });
    } catch {
      void message.error('Failed to load claim');
    }
  }, [populateForm]);

  return {
    form,
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    saveDraft,
    submitClaim,
    validateClaim,
    loadClaim,
    claimId,
    isEditMode: Boolean(claimId),
  };
}

export type UseClaimFormReturn = ReturnType<typeof useClaimForm>;
