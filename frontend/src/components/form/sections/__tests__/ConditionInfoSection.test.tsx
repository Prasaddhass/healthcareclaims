import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ConditionInfoSection from '../ConditionInfoSection';
import { CMS1500Schema, type CMS1500FormValues } from '@/schemas/cms1500.schema';
import { EMPTY_CLAIM } from '@/hooks/useClaimForm';

const Wrapper: React.FC = () => {
  const form = useForm<CMS1500FormValues>({
    resolver:      zodResolver(CMS1500Schema),
    defaultValues: EMPTY_CLAIM,
  });
  return <FormProvider {...form}><ConditionInfoSection /></FormProvider>;
};

describe('ConditionInfoSection', () => {
  it('hides auto accident state when autoAccident is not YES', () => {
    render(<Wrapper />);
    const wrapper = screen.getByTestId('auto-accident-state-wrapper');
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows auto accident state when YES is selected', async () => {
    render(<Wrapper />);
    const yesRadio = screen.getAllByRole('radio', { name: 'YES' })[1]; // auto accident YES
    await userEvent.click(yesRadio);
    const wrapper = screen.getByTestId('auto-accident-state-wrapper');
    expect(wrapper).toHaveAttribute('aria-hidden', 'false');
  });

  it('shows outside lab charges when outsideLab=YES', async () => {
    render(<Wrapper />);
    // Find the outside lab YES radio (last YES in the form)
    const yesRadios = screen.getAllByRole('radio', { name: 'YES' });
    await userEvent.click(yesRadios[yesRadios.length - 1]);
    expect(screen.getByText(/Item 20 — Lab Charges/)).toBeInTheDocument();
  });
});
