import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DiagnosisSection from '../DiagnosisSection';
import { CMS1500Schema, type CMS1500FormValues } from '@/schemas/cms1500.schema';
import { EMPTY_CLAIM } from '@/hooks/useClaimForm';

const Wrapper: React.FC = () => {
  const form = useForm<CMS1500FormValues>({
    resolver:      zodResolver(CMS1500Schema),
    defaultValues: EMPTY_CLAIM,
  });
  return <FormProvider {...form}><DiagnosisSection /></FormProvider>;
};

describe('DiagnosisSection', () => {
  it('renders 12 inputs with A–L pointer labels', () => {
    render(<Wrapper />);
    const pointers = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    pointers.forEach((p) => {
      expect(screen.getByTestId(`dx-input-${p}`)).toBeInTheDocument();
    });
  });

  it('forces input to uppercase', async () => {
    render(<Wrapper />);
    const inputA = screen.getByTestId('dx-input-A') as HTMLInputElement;
    await userEvent.type(inputA, 'z00.00');
    expect(inputA.value).toBe('Z00.00');
  });
});
