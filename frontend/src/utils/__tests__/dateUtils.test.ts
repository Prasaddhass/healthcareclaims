import { describe, expect, it } from 'vitest';

import { formatMonthLabel, formatWeekLabel } from '../dateUtils';

describe('dateUtils', () => {
  it('formats week labels with a short year', () => {
    expect(formatWeekLabel(2026, 35)).toBe("Wk 35 '26");
  });

  it('formats single digit week labels', () => {
    expect(formatWeekLabel(2025, 2)).toBe("Wk 2 '25");
  });

  it('formats month labels from numeric month values', () => {
    expect(formatMonthLabel(2026, 8)).toBe("Aug '26");
  });

  it('formats january month labels', () => {
    expect(formatMonthLabel(2025, 1)).toBe("Jan '25");
  });
});
