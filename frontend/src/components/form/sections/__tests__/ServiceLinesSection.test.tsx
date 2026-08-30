import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ServiceLinesSection from '../ServiceLinesSection';
import { CMS1500Schema, type CMS1500FormValues } from '@/schemas/cms1500.schema';
import { EMPTY_CLAIM } from '@/hooks/useClaimForm';

const Wrapper: React.FC = () => {
  const form = useForm<CMS1500FormValues>({
    resolver:      zodResolver(CMS1500Schema),
    defaultValues: EMPTY_CLAIM,
  });
  return <FormProvider {...form}><ServiceLinesSection /></FormProvider>;
};

describe('ServiceLinesSection', () => {
  it('starts with no rows and shows empty state', () => {
    render(<Wrapper />);
    expect(screen.getByTestId('no-service-lines')).toBeInTheDocument();
  });

  it('adds a row when Add Row is clicked', async () => {
    render(<Wrapper />);
    await userEvent.click(screen.getByTestId('add-service-line'));
    expect(screen.getByTestId('service-line-row-0')).toBeInTheDocument();
    expect(screen.queryByTestId('no-service-lines')).not.toBeInTheDocument();
  });

  it('disables Add Row button at 6 rows', async () => {
    render(<Wrapper />);
    const addBtn = screen.getByTestId('add-service-line');
    for (let i = 0; i < 6; i++) {
      fireEvent.click(addBtn);
    }
    expect(addBtn).toBeDisabled();
  }, 10000);

  it('removes a row when remove button is clicked', async () => {
    render(<Wrapper />);
    // Add 2 rows first
    await userEvent.click(screen.getByTestId('add-service-line'));
    await userEvent.click(screen.getByTestId('add-service-line'));
    expect(screen.getByTestId('service-line-row-1')).toBeInTheDocument();
    // Remove the first row
    await userEvent.click(screen.getByTestId('remove-line-0'));
    expect(screen.queryByTestId('service-line-row-1')).not.toBeInTheDocument();
  });
});
