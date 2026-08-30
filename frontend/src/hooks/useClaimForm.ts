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
      form.setValue('patientInfo.patientName',         (h['PatientName']         as string) ?? '');
      form.setValue('patientInfo.patientBirthDate',    (h['PatientBirthDate']    as string) ?? '');
      form.setValue('patientInfo.patientSex',          ((h['PatientSex']          as 'M' | 'F') ?? 'M'));
      form.setValue('patientInfo.patientRelationship', ((h['PatientRelationship'] as 'Self' | 'Spouse' | 'Child' | 'Other') ?? 'Self'));
      form.setValue('insuredInfo.insuredPolicyNumber', (h['InsuredPolicyNumber']  as string) ?? '');
      form.setValue('providerBilling.federalTaxId',    (h['FederalTaxId']         as string) ?? '');
      form.setValue('providerBilling.billingProviderNPI', (h['BillingProviderNPI'] as string) ?? '');
      form.setValue('providerBilling.billingProviderName', (h['BillingProviderName'] as string) ?? '');
      form.setValue('providerBilling.acceptAssignment',    ((h['AcceptAssignment'] as 'YES' | 'NO') ?? 'YES'));
      form.setValue('providerBilling.totalCharge',     Number(h['TotalCharge']) || 0);

      // Diagnosis
      const dx = (detail.diagnosis as Array<Record<string, unknown>>);
      if (dx.length > 0) {
        const diagValues = POINTERS.map((pointer, idx) => {
          const entry = dx.find((d) => d['Pointer'] === pointer || d['pointer'] === pointer);
          return {
            pointer,
            icdCode:  (entry?.['IcdCode'] ?? entry?.['icd_code'] ?? '') as string,
            sequence: idx + 1,
          };
        });
        form.setValue('diagnosis', diagValues);
      }

      // Service Lines
      const lines = (detail.service_lines as Array<Record<string, unknown>>);
      if (lines.length > 0) {
        form.setValue(
          'serviceLines',
          lines.map((sl) => ({
            serviceDateFrom:     (sl['ServiceDateFrom'] ?? sl['service_date_from'] ?? '') as string,
            serviceDateTo:       (sl['ServiceDateTo']   ?? sl['service_date_to']   ?? '') as string,
            placeOfService:      (sl['PlaceOfService']  ?? sl['place_of_service']  ?? '') as string,
            emgIndicator:        Boolean(sl['EmgIndicator'] ?? sl['emg_indicator']),
            procedureCode:       (sl['ProcedureCode']   ?? sl['procedure_code']    ?? '') as string,
            diagnosisPointer:    (sl['DiagnosisPointer'] ?? sl['diagnosis_pointer'] ?? '') as string,
            lineCharge:          Number(sl['LineCharge']  ?? sl['line_charge']     ?? 0),
            daysUnits:           sl['DaysUnits'] !== undefined ? Number(sl['DaysUnits']) : 1,
            epsdtFamilyPlan:     (sl['EpsdtFamilyPlan']  ?? sl['epsdt_family_plan'] ?? '') as string,
            idQualifier:         (sl['IdQualifier']      ?? sl['id_qualifier']      ?? '') as string,
            renderingProviderId: (sl['RenderingProviderId'] ?? sl['rendering_provider_id'] ?? '') as string,
            lineSequence:        Number(sl['LineSequence'] ?? sl['line_sequence'] ?? 0),
          })),
        );
      }
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

  /** loadClaim — fetches an existing claim and populates the form. */
  const loadClaim = useCallback(async (id: string): Promise<void> => {
    try {
      const detail = await claimsApi.getClaim(id);
      populateForm({
        header:        detail.header as Record<string, unknown>,
        diagnosis:     detail.diagnosis as unknown[],
        service_lines: detail.serviceLines as unknown[],
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
    loadClaim,
    claimId,
    isEditMode: Boolean(claimId),
  };
}

export type UseClaimFormReturn = ReturnType<typeof useClaimForm>;
