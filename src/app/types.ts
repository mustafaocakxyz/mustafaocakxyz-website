export type AppRole = 'admin' | 'student';

export type AppUser = {
  id: string;
  role: AppRole;
  displayName: string;
  loginUsername: string;
  organizationId: string;
};

export type StudentTask = {
  id: string;
  label: string;
  completed: boolean;
};

/** Structured daily form. Null means not filled yet (not the same as 0). */
export type DailySubmission = {
  uyumaSaati: string | null;
  uyanmaSaati: string | null;
  gunlukCalismaSaat: number | null;
  ekranSuresiSaat: number | null;
  notlar: string;
};

export type StudentSummary = {
  id: string;
  name: string;
};

export const emptyDailySubmission = (): DailySubmission => ({
  uyumaSaati: null,
  uyanmaSaati: null,
  gunlukCalismaSaat: null,
  ekranSuresiSaat: null,
  notlar: '',
});

/** 0, 0.5, …, 12 */
export const HOUR_OPTIONS: number[] = Array.from({ length: 25 }, (_, i) => i / 2);

/** 00:00, 00:30, …, 23:30 */
export const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const totalMinutes = i * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

export function formatHourOptionLabel(hours: number): string {
  const label = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `${label} saat`;
}
