import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InsuredInfoSection from '../InsuredInfoSection';
import { CMS1500Schema, type CMS1500FormValues } from '@/schemas/cms1500.schema';
import { EMPTY_CLAIM } from '@/hooks/useClaimForm';

const Wrapper: React.FC = () => {
  const form = useForm<CMS1500FormValues>({
    resolver:      zodResolver(CMS1500Schema),
    defaultValues: EMPTY_CLAIM,
  });
  return <FormProvider {...form}><InsuredInfoSection /></FormProvider>;
};

describe('InsuredInfoSection', () => {
  it('renders Item 11d YES/NO radio options', () => {
    render(<Wrapper />);
    expect(screen.getByTestId('another-benefit-plan')).toBeInTheDocument();
    expect(screen.getByText(/YES — complete Items 9/)).toBeInTheDocument();
    expect(screen.getByText('NO')).toBeInTheDocument();
  });

  it('renders insured policy number field', () => {
    render(<Wrapper />);
    expect(screen.getByTestId('insured-policy-number')).toBeInTheDocument();
  });
});
