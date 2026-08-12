import { startOfDay } from '../app/utils/dates';
import { parseTaskLabel } from '../app/utils/taskLabel';
import { DEMO_STUDENTS, type DemoStudentShowcase } from '../data/demoStudentShowcase';
import { supabase } from './supabase';

/**
 * Temporary fallback hide list if older RPC builds are still deployed.
 * Prefer profiles.show_on_ogrenciler via 026_student_visibility_settings.sql.
 */
export const HIDDEN_PUBLIC_SHOWCASE_STUDENT_IDS = new Set([
  'bd318631-4c4c-4318-93cd-3aef4c39fbf9',
]);

export type PublicStudentSummary = {
  id: string;
  displayName: string;
  createdAt: string;
  showcaseHighlights: string[];
  dayCountActive: boolean;
  dayCountFrozenDays: number | null;
  dayCountStartDate: string | null;
};

export type ShowcaseStudent = {
  id: string;
  shortName: string;
  daysInProgram: number;
  /** Artificial / demo fields until real stats are wired */
  avgStudyHours: string;
  avgScreenTime: string;
  sleepSchedule: string;
  /** Real curated pills; empty = hide featured UI */
  highlights: string[];
  netChanges?: DemoStudentShowcase['netChanges'];
};

export function shortenPublicName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Öğrenci';
  if (parts.length === 1) return parts[0];

  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toLocaleUpperCase('tr-TR');
  return `${first} ${lastInitial}.`;
}

export function daysInProgramSince(createdAt: string, now = new Date()): number {
  const created = startOfDay(new Date(createdAt));
  const today = startOfDay(now);
  const diffMs = today.getTime() - created.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(1, days + 1);
}

export function resolvePublicDaysInProgram(summary: PublicStudentSummary, now = new Date()): number {
  if (!summary.dayCountActive) {
    if (typeof summary.dayCountFrozenDays === 'number' && summary.dayCountFrozenDays >= 1) {
      return summary.dayCountFrozenDays;
    }
  }
  const basis = summary.dayCountStartDate || summary.createdAt;
  return daysInProgramSince(basis, now);
}

function demoTemplateForIndex(index: number): DemoStudentShowcase {
  return DEMO_STUDENTS[index % DEMO_STUDENTS.length];
}

export function normalizeShowcaseHighlights(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((entry) => String(entry ?? '').trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
}

export function toShowcaseStudent(
  summary: PublicStudentSummary,
  demoIndex: number,
): ShowcaseStudent {
  const demo = demoTemplateForIndex(demoIndex);
  return {
    id: summary.id,
    shortName: shortenPublicName(summary.displayName),
    daysInProgram: resolvePublicDaysInProgram(summary),
    avgStudyHours: demo.avgStudyHours,
    avgScreenTime: demo.avgScreenTime,
    sleepSchedule: demo.sleepSchedule,
    highlights: summary.showcaseHighlights,
    netChanges: demo.netChanges,
  };
}

export async function fetchPublicStudentSummaries(): Promise<PublicStudentSummary[]> {
  const { data, error } = await supabase.rpc('public_student_showcase_summaries');

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  return rows
    .map((row: Record<string, unknown>) => ({
      id: String(row.id),
      displayName: String(row.displayName ?? row.display_name ?? ''),
      createdAt: String(row.createdAt ?? row.created_at ?? ''),
      showcaseHighlights: normalizeShowcaseHighlights(
        row.showcaseHighlights ??
          row.showcase_highlights ??
          row.showcaseHighlight ??
          row.showcase_highlight,
      ),
      dayCountActive: row.dayCountActive !== false && row.day_count_active !== false,
      dayCountFrozenDays: (() => {
        const raw = row.dayCountFrozenDays ?? row.day_count_frozen_days;
        const n = typeof raw === 'number' ? raw : Number(raw);
        return Number.isFinite(n) ? n : null;
      })(),
      dayCountStartDate: (() => {
        const raw = row.dayCountStartDate ?? row.day_count_start_date;
        if (raw == null || raw === '') return null;
        return String(raw).slice(0, 10);
      })(),
    }))
    .filter((row) => !HIDDEN_PUBLIC_SHOWCASE_STUDENT_IDS.has(row.id));
}

export async function fetchShowcaseStudents(): Promise<ShowcaseStudent[]> {
  const summaries = await fetchPublicStudentSummaries();
  return summaries.map((summary, index) => toShowcaseStudent(summary, index));
}

export async function fetchShowcaseStudentById(
  studentId: string,
): Promise<ShowcaseStudent | null> {
  const students = await fetchShowcaseStudents();
  return students.find((student) => student.id === studentId) ?? null;
}

export type PublicTodayTask = {
  id: string;
  label: string;
  durationLabel: string;
  completed: boolean;
};

export async function fetchPublicStudentTodayTasks(
  studentId: string,
): Promise<PublicTodayTask[]> {
  const { data, error } = await supabase.rpc('public_student_today_tasks', {
    p_student_id: studentId,
  });

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  return rows.map((row: Record<string, unknown>) => {
    const rawLabel = String(row.label ?? '');
    const storedDuration = String(
      row.durationLabel ?? row.duration_label ?? '',
    ).trim();

    if (storedDuration) {
      return {
        id: String(row.id),
        label: rawLabel,
        durationLabel: storedDuration,
        completed: Boolean(row.completed),
      };
    }

    const parsed = parseTaskLabel(rawLabel);
    return {
      id: String(row.id),
      label: parsed.label,
      durationLabel: parsed.durationLabel,
      completed: Boolean(row.completed),
    };
  });
}
