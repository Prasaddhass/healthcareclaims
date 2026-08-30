/** UTC ISO timestamp → formatted local time string. */
export const toLocalDisplay = (utcIso: string): string => {
  if (!utcIso) return '—';
  return new Date(utcIso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const MONTH_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Format week period label: (2026, 35) → "Wk 35 '26" */
export const formatWeekLabel = (year: number, week: number): string =>
  `Wk ${week} '${String(year).slice(2)}`;

/** Format month period label: (2026, 8) → "Aug '26" */
export const formatMonthLabel = (year: number, month: number): string =>
  `${MONTH_NAMES[month - 1]} '${String(year).slice(2)}`;

/** Format week tooltip: (2026, 35) → "Week 35, 2026" */
export const formatWeekTooltip = (year: number, week: number): string => `Week ${week}, ${year}`;

/** Format month tooltip: (2026, 8) → "August 2026" */
export const formatMonthTooltip = (year: number, month: number): string =>
  `${MONTH_FULL[month - 1]} ${year}`;
