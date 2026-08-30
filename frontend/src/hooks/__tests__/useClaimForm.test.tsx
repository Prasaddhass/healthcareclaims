import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { useClaimForm } from '../useClaimForm';
import * as claimsApiModule from '@/api/claimsApi';
import { FORM_STEPS } from '@/constants/formSteps';

// Wrap hook in MemoryRouter because useClaimForm uses useNavigate
const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('useClaimForm', () => {
  it('starts at step 0 with 7 total steps', () => {
    const { result } = renderHook(() => useClaimForm(), { wrapper });
    expect(result.current.currentStep).toBe(0);
    expect(FORM_STEPS.length).toBe(7);
  });

  it('nextStep increments currentStep', () => {
    const { result } = renderHook(() => useClaimForm(), { wrapper });
    act(() => result.current.nextStep());
    expect(result.current.currentStep).toBe(1);
  });

  it('prevStep decrements currentStep', () => {
    const { result } = renderHook(() => useClaimForm(), { wrapper });
    act(() => result.current.nextStep());
    act(() => result.current.prevStep());
    expect(result.current.currentStep).toBe(0);
  });

  it('prevStep does not go below 0', () => {
    const { result } = renderHook(() => useClaimForm(), { wrapper });
    act(() => result.current.prevStep());
    expect(result.current.currentStep).toBe(0);
  });

  it('nextStep does not go above last step', () => {
    const { result } = renderHook(() => useClaimForm(), { wrapper });
    for (let i = 0; i < 10; i++) {
      act(() => result.current.nextStep());
    }
    expect(result.current.currentStep).toBe(FORM_STEPS.length - 1);
  });

  it('goToStep jumps to specified step', () => {
    const { result } = renderHook(() => useClaimForm(), { wrapper });
    act(() => result.current.goToStep(4));
    expect(result.current.currentStep).toBe(4);
  });

  it('isEditMode is true when claimId provided', () => {
    const { result } = renderHook(() => useClaimForm('test-id'), { wrapper });
    expect(result.current.isEditMode).toBe(true);
  });

  it('isEditMode is false when no claimId', () => {
    const { result } = renderHook(() => useClaimForm(), { wrapper });
    expect(result.current.isEditMode).toBe(false);
  });

  it('saveDraft calls createClaim with saveAsDraft=true', async () => {
    const mockCreate = vi.spyOn(claimsApiModule.claimsApi, 'createClaim')
      .mockResolvedValue({ claim_id: 'abc', validation_status: 'Draft', created_on: null });

    const { result } = renderHook(() => useClaimForm(), { wrapper });
    await act(async () => { await result.current.saveDraft(); });

    expect(mockCreate).toHaveBeenCalled();
    const callArg = mockCreate.mock.calls[0][0];
    expect(callArg.saveAsDraft).toBe(true);
    mockCreate.mockRestore();
  });
});
