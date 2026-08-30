import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FormStepper from '../FormStepper';

describe('FormStepper', () => {
  it('renders 7 steps with correct labels', () => {
    const onStepChange = vi.fn();
    render(<FormStepper currentStep={0} onStepChange={onStepChange} />);

    const expectedLabels = [
      'Patient Info', 'Insured Info', 'Other Insurance',
      'Condition Info', 'Diagnosis', 'Service Lines', 'Provider/Billing',
    ];
    expectedLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('calls onStepChange when a step is clicked', () => {
    const onStepChange = vi.fn();
    render(<FormStepper currentStep={0} onStepChange={onStepChange} />);

    // Click the "Diagnosis" step (index 4)
    fireEvent.click(screen.getByText('Diagnosis'));
    expect(onStepChange).toHaveBeenCalledWith(4);
  });
});
