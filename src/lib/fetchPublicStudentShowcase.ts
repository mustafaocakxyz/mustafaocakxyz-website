import { startOfDay } from '../app/utils/dates';
import { DEMO_STUDENTS, type DemoStudentShowcase } from '../data/demoStudentShowcase';
import { supabase } from './supabase';

export type PublicStudentSummary = {
  id: string;
  displayName: string;
  createdAt: string;
  showcaseHighlight: string;
};

export type ShowcaseStudent = {
  id: string;
  shortName: string;
  daysInProgram: number;
  /** Artificial / demo fields until real stats are wired */
  avgStudyHours: string;
  avgScreenTime: string;
  sleepSchedule: string;
  /** Real curated text; empty = hide featured UI */
  highlight: string;
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

function demoTemplateForIndex(index: number): DemoStudentShowcase {
  return DEMO_STUDENTS[index % DEMO_STUDENTS.length];
}

export function toShowcaseStudent(
  summary: PublicStudentSummary,
  demoIndex: number,
): ShowcaseStudent {
  const demo = demoTemplateForIndex(demoIndex);
  return {
    id: summary.id,
    shortName: shortenPublicName(summary.displayName),
    daysInProgram: daysInProgramSince(summary.createdAt),
    avgStudyHours: demo.avgStudyHours,
    avgScreenTime: demo.avgScreenTime,
    sleepSchedule: demo.sleepSchedule,
    highlight: summary.showcaseHighlight.trim(),
    netChanges: demo.netChanges,
  };
}

export async function fetchPublicStudentSummaries(): Promise<PublicStudentSummary[]> {
  const { data, error } = await supabase.rpc('public_student_showcase_summaries');

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  return rows.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    displayName: String(row.displayName ?? row.display_name ?? ''),
    createdAt: String(row.createdAt ?? row.created_at ?? ''),
    showcaseHighlight: String(
      row.showcaseHighlight ?? row.showcase_highlight ?? '',
    ).trim(),
  }));
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
  return rows.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    label: String(row.label ?? ''),
    completed: Boolean(row.completed),
  }));
}
