/** Claim validation status type and badge configuration. */
export type ValidationStatus = 'Draft' | 'Pending' | 'Validated' | 'Failed' | 'Sent';

export const STATUS_BADGE_CONFIG: Record<ValidationStatus, { color: string; label: string }> = {
  Draft: { color: 'default', label: 'Draft' },
  Pending: { color: 'blue', label: 'Pending' },
  Validated: { color: 'green', label: 'Validated' },
  Failed: { color: 'red', label: 'Failed' },
  Sent: { color: 'purple', label: 'Sent' },
};

/** Chart colours for status distribution (US-005-03). */
export const STATUS_CHART_COLOURS: Record<ValidationStatus, string> = {
  Draft: '#d9d9d9',
  Pending: '#1677ff',
  Validated: '#52c41a',
  Failed: '#ff4d4f',
  Sent: '#722ed1',
};
