import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PatientInfoSection from '../PatientInfoSection';
import { CMS1500Schema, type CMS1500FormValues } from '@/schemas/cms1500.schema';
import { EMPTY_CLAIM } from '@/hooks/useClaimForm';

const Wrapper: React.FC<{ children: React.ReactNode; defaults?: Partial<CMS1500FormValues> }> = ({
  children,
  defaults,
}) => {
  const form = useForm<CMS1500FormValues>({
    resolver:      zodResolver(CMS1500Schema),
    defaultValues: defaults ? { ...EMPTY_CLAIM, ...defaults } : EMPTY_CLAIM,
  });
  return <FormProvider {...form}>{children}</FormProvider>;
};

describe('PatientInfoSection', () => {
  it('renders 7 insurance type radio options', () => {
    render(<Wrapper><PatientInfoSection /></Wrapper>);
    const expected = ['Medicare', 'Medicaid', 'TRICARE', 'CHAMPVA', 'GroupHealthPlan', 'FECA', 'Other'];
    expected.forEach((label) => {
      // getAllByText to handle cases where antd renders text in multiple nodes
      const elements = screen.getAllByText(label);
      expect(elements.length).toBeGreaterThan(0);
    });
  }, 30000);

  it('hides insured name when relationship is Self', () => {
    render(
      <Wrapper defaults={{ patientInfo: { ...EMPTY_CLAIM.patientInfo, patientRelationship: 'Self' } }}>
        <PatientInfoSection />
      </Wrapper>,
    );
    const wrapper = screen.getByTestId('insured-name-wrapper');
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows insured name when relationship is Spouse', async () => {
    render(<Wrapper><PatientInfoSection /></Wrapper>);
    const spouseRadio = screen.getByLabelText('Spouse');
    await userEvent.click(spouseRadio);
    const wrapper = screen.getByTestId('insured-name-wrapper');
    expect(wrapper).toHaveAttribute('aria-hidden', 'false');
  });
});
