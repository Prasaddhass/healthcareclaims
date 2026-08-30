import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatBytes } from '../fileUtils';
import { buildAnalyticsCSV, buildCSVFilename } from '../exportUtils';

describe('exportUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-29T12:00:00Z'));
  });

  it('builds a dated CSV filename', () => {
    expect(buildCSVFilename()).toBe('claims-analytics-2026-08-29.csv');
  });

  it('builds CSV content for analytics datasets', () => {
    const csv = buildAnalyticsCSV(
      [{ label: 'Wk 35', count: 3, year: 2026 }],
      [{ label: 'Aug 26', count: 8, year: 2026 }],
      [{ status: 'Pending', count: 2, percentage: 25 }],
    );

    expect(csv).toContain('Weekly Claims');
    expect(csv).toContain('Monthly Claims');
    expect(csv).toContain('Status Distribution');
    expect(csv).toContain('Pending,2,25');
  });

  it('formats kilobyte file sizes', () => {
    expect(formatBytes(1536)).toBe('2 KB');
  });

  it('formats megabyte file sizes', () => {
    expect(formatBytes(2_621_440)).toBe('2.5 MB');
  });
});
