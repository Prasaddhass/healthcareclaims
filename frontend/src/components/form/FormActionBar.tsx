/**
 * FormActionBar — sticky bottom bar with Prev / Next / Save Draft / Submit.
 * Stays visible on all 7 steps without scrolling.
 */
import React from 'react';
import { Button, Space } from 'antd';
import { FORM_STEPS } from '@/constants/formSteps';

interface FormActionBarProps {
  currentStep:    number;
  isSubmitting:   boolean;
  onPrev:         () => void;
  onNext:         () => void;
  onSaveDraft:    () => void;
  onSubmit:       () => void;
}

const FormActionBar: React.FC<FormActionBarProps> = ({
  currentStep,
  isSubmitting,
  onPrev,
  onNext,
  onSaveDraft,
  onSubmit,
}) => {
  const isFirst = currentStep === 0;
  const isLast  = currentStep === FORM_STEPS.length - 1;

  return (
    <div
      style={{
        position:        'sticky',
        bottom:          0,
        zIndex:          100,
        background:      '#fff',
        borderTop:       '1px solid #f0f0f0',
        padding:         '12px 24px',
        display:         'flex',
        justifyContent:  'space-between',
        alignItems:      'center',
      }}
      data-testid="form-action-bar"
    >
      <Button
        disabled={isFirst || isSubmitting}
        onClick={onPrev}
        data-testid="btn-prev"
      >
        Previous
      </Button>

      <Space>
        <Button
          disabled={isSubmitting}
          onClick={onSaveDraft}
          data-testid="btn-save-draft"
        >
          Save Draft
        </Button>

        {isLast ? (
          <Button
            type="primary"
            loading={isSubmitting}
            onClick={onSubmit}
            data-testid="btn-submit"
          >
            Submit Claim
          </Button>
        ) : (
          <Button
            type="primary"
            disabled={isSubmitting}
            onClick={onNext}
            data-testid="btn-next"
          >
            Next
          </Button>
        )}
      </Space>
    </div>
  );
};

export default FormActionBar;
