/**
 * FormStepper — antd Steps navigation for the 7-section CMS-1500 form.
 * Clicking any tab navigates directly (no sequential enforcement).
 * Shows an error badge on a step when that section has validation errors.
 */
import React from 'react';
import { Steps } from 'antd';
import type { Control, FieldErrors } from 'react-hook-form';
import { FORM_STEPS } from '@/constants/formSteps';
import type { CMS1500FormValues } from '@/schemas/cms1500.schema';

interface FormStepperProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  errors?: FieldErrors<CMS1500FormValues>;
  /** Layout direction — auto-set to 'vertical' on small viewports */
  direction?: 'horizontal' | 'vertical';
  control?: Control<CMS1500FormValues>;
}

const STEP_KEYS = FORM_STEPS.map((s) => s.key) as (keyof CMS1500FormValues)[];

const FormStepper: React.FC<FormStepperProps> = ({
  currentStep,
  onStepChange,
  errors = {},
  direction = 'horizontal',
}) => {
  const items = FORM_STEPS.map((step, index) => {
    const sectionKey = STEP_KEYS[index];
    const hasError   = Boolean(errors[sectionKey]);
    return {
      title:  step.label,
      status: (
        index === currentStep ? 'process' :
        hasError              ? 'error'   :
        index < currentStep   ? 'finish'  : 'wait'
      ) as 'process' | 'error' | 'finish' | 'wait',
    };
  });

  return (
    <Steps
      current={currentStep}
      items={items}
      onChange={onStepChange}
      direction={direction}
      size="small"
      style={{ marginBottom: 24 }}
      data-testid="form-stepper"
    />
  );
};

export default FormStepper;
