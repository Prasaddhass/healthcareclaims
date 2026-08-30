/**
 * ClaimFormPage — CMS-1500 claim entry form (new or edit).
 * Sections are rendered lazily below the FormStepper.
 * FormActionBar is sticky at the bottom of the viewport.
 */
import React, { Suspense, lazy, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Spin, Typography } from 'antd';
import { FormProvider } from 'react-hook-form';

import { useClaimForm } from '@/hooks/useClaimForm';
import FormStepper     from '@/components/form/FormStepper';
import FormActionBar   from '@/components/form/FormActionBar';

const PatientInfoSection    = lazy(() => import('@/components/form/sections/PatientInfoSection'));
const InsuredInfoSection    = lazy(() => import('@/components/form/sections/InsuredInfoSection'));
const OtherInsuranceSection = lazy(() => import('@/components/form/sections/OtherInsuranceSection'));
const ConditionInfoSection  = lazy(() => import('@/components/form/sections/ConditionInfoSection'));
const DiagnosisSection      = lazy(() => import('@/components/form/sections/DiagnosisSection'));
const ServiceLinesSection   = lazy(() => import('@/components/form/sections/ServiceLinesSection'));
const ProviderBillingSection = lazy(() => import('@/components/form/sections/ProviderBillingSection'));

const SECTIONS = [
  PatientInfoSection,
  InsuredInfoSection,
  OtherInsuranceSection,
  ConditionInfoSection,
  DiagnosisSection,
  ServiceLinesSection,
  ProviderBillingSection,
];

const { Title } = Typography;

const ClaimFormPage: React.FC = () => {
  const { id: claimId } = useParams<{ id: string }>();
  const {
    form,
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    saveDraft,
    submitClaim,
    loadClaim,
    isEditMode,
  } = useClaimForm(claimId);

  const { formState: { errors, isSubmitting } } = form;

  useEffect(() => {
    if (isEditMode && claimId) {
      void loadClaim(claimId);
    }
  }, [isEditMode, claimId, loadClaim]);

  const ActiveSection = SECTIONS[currentStep];

  return (
    <FormProvider {...form}>
      <div style={{ padding: '0 0 80px' }}>
        <Title level={3} style={{ marginBottom: 16 }}>
          {isEditMode ? 'Edit Claim' : 'New Claim — CMS-1500'}
        </Title>

        <FormStepper
          currentStep={currentStep}
          onStepChange={goToStep}
          errors={errors}
        />

        <div style={{ padding: '0 4px', minHeight: 400 }}>
          <Suspense fallback={<Spin />}>
            <ActiveSection />
          </Suspense>
        </div>
      </div>

      <FormActionBar
        currentStep={currentStep}
        isSubmitting={isSubmitting}
        onPrev={prevStep}
        onNext={nextStep}
        onSaveDraft={() => void saveDraft()}
        onSubmit={() => void submitClaim()}
      />
    </FormProvider>
  );
};

export default ClaimFormPage;
