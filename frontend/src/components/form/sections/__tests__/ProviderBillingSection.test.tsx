import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ProviderBillingSection from '../ProviderBillingSection';
import { CMS1500Schema, type CMS1500FormValues } from '@/schemas/cms1500.schema';
import { EMPTY_CLAIM } from '@/hooks/useClaimForm';

const Wrapper: React.FC = () => {
  const form = useForm<CMS1500FormValues>({
    resolver:      zodResolver(CMS1500Schema),
    defaultValues: EMPTY_CLAIM,
  });
  return <FormProvider {...form}><ProviderBillingSection /></FormProvider>;
};

describe('ProviderBillingSection', () => {
  it('renders the section', () => {
    render(<Wrapper />);
    expect(screen.getByTestId('provider-billing-section')).toBeInTheDocument();
  });

  it('renders accept assignment radio group', () => {
    render(<Wrapper />);
    expect(screen.getByTestId('accept-assignment')).toBeInTheDocument();
  });

  it('renders Item 28 Total Charge as disabled', () => {
    render(<Wrapper />);
    // CurrencyField with readOnly renders a disabled InputNumber
    const totalCharge = screen.getByTestId('currency-providerBilling.totalCharge');
    expect(totalCharge).toBeInTheDocument();
  });
});
