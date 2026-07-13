import {
  supabase,
  type DbDailySubmission,
  type DbDailyTask,
  type DbProfile,
} from '../../lib/supabase';
import {
  emptyDailySubmission,
  type DailySubmission,
  type StudentSummary,
  type StudentTask,
} from '../types';

function mapTask(row: DbDailyTask): StudentTask {
  return {
    id: row.id,
    label: row.label,
    completed: row.completed,
  };
}

function mapSubmission(row: DbDailySubmission): DailySubmission {
  return {
    uykuUyanma: row.uyku_uyanma,
    gunlukCalisma: row.gunluk_calisma,
    ekranSuresi: row.ekran_suresi,
    notlar: row.notlar,
  };
}

function submissionToRow(studentId: string, dateKey: string, submission: DailySubmission) {
  return {
    student_id: studentId,
    submission_date: dateKey,
    uyku_uyanma: submission.uykuUyanma,
    gunluk_calisma: submission.gunlukCalisma,
    ekran_suresi: submission.ekranSuresi,
    notlar: submission.notlar,
  };
}

export function mapProfileToAppUser(profile: DbProfile) {
  return {
    id: profile.id,
    role: profile.role,
    displayName: profile.display_name,
    loginUsername: profile.login_username,
    organizationId: profile.organization_id,
  };
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, organization_id, role, display_name, login_username, auth_email, is_active')
    .eq('id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data as DbProfile | null;
}

export async function resolveAuthEmail(username: string) {
  const { data, error } = await supabase.rpc('resolve_auth_email', {
    p_login_username: username.trim(),
  });

  if (error) throw error;
  return data as string | null;
}

export async function fetchStudents(): Promise<StudentSummary[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('role', 'student')
    .eq('is_active', true)
    .order('display_name');

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.display_name,
  }));
}

export async function fetchTasksForRange(
  studentId: string,
  fromDate: string,
  toDate: string,
): Promise<Record<string, StudentTask[]>> {
  const { data, error } = await supabase
    .from('daily_tasks')
    .select('id, student_id, task_date, label, completed, sort_order')
    .eq('student_id', studentId)
    .gte('task_date', fromDate)
    .lte('task_date', toDate)
    .order('sort_order')
    .order('created_at');

  if (error) throw error;

  const grouped: Record<string, StudentTask[]> = {};
  for (const row of data ?? []) {
    const dateKey = row.task_date;
    grouped[dateKey] ??= [];
    grouped[dateKey].push(mapTask(row as DbDailyTask));
  }

  return grouped;
}

/** Admin: load tasks for all students on the given dates (e.g. today + tomorrow). */
export async function fetchOrgTasksForDates(
  dates: string[],
): Promise<Record<string, Record<string, StudentTask[]>>> {
  if (dates.length === 0) return {};

  const { data, error } = await supabase
    .from('daily_tasks')
    .select('id, student_id, task_date, label, completed, sort_order')
    .in('task_date', dates)
    .order('sort_order')
    .order('created_at');

  if (error) throw error;

  const grouped: Record<string, Record<string, StudentTask[]>> = {};
  for (const row of data ?? []) {
    const task = row as DbDailyTask;
    grouped[task.student_id] ??= {};
    grouped[task.student_id][task.task_date] ??= [];
    grouped[task.student_id][task.task_date].push(mapTask(task));
  }

  return grouped;
}

export async function fetchSubmissionsForRange(
  studentId: string,
  fromDate: string,
  toDate: string,
): Promise<Record<string, DailySubmission>> {
  const { data, error } = await supabase
    .from('daily_submissions')
    .select(
      'id, student_id, submission_date, uyku_uyanma, gunluk_calisma, ekran_suresi, notlar',
    )
    .eq('student_id', studentId)
    .gte('submission_date', fromDate)
    .lte('submission_date', toDate);

  if (error) throw error;

  const grouped: Record<string, DailySubmission> = {};
  for (const row of data ?? []) {
    grouped[row.submission_date] = mapSubmission(row as DbDailySubmission);
  }

  return grouped;
}

export async function setTaskCompleted(taskId: string, completed: boolean) {
  const { error } = await supabase.from('daily_tasks').update({ completed }).eq('id', taskId);
  if (error) throw error;
}

export async function upsertSubmission(
  studentId: string,
  dateKey: string,
  submission: DailySubmission,
) {
  const { error } = await supabase.from('daily_submissions').upsert(
    submissionToRow(studentId, dateKey, submission),
    { onConflict: 'student_id,submission_date' },
  );
  if (error) throw error;
}

export async function createTask(studentId: string, dateKey: string, label: string, sortOrder: number) {
  const { data, error } = await supabase
    .from('daily_tasks')
    .insert({
      student_id: studentId,
      task_date: dateKey,
      label,
      sort_order: sortOrder,
      completed: false,
    })
    .select('id, student_id, task_date, label, completed, sort_order')
    .single();

  if (error) throw error;
  return mapTask(data as DbDailyTask);
}

export async function updateTaskLabel(taskId: string, label: string) {
  const { error } = await supabase.from('daily_tasks').update({ label }).eq('id', taskId);
  if (error) throw error;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase.from('daily_tasks').delete().eq('id', taskId);
  if (error) throw error;
}

export async function exportStudentJson(
  studentId: string,
  fromDate?: string,
  toDate?: string,
) {
  const { data, error } = await supabase.rpc('export_student_json', {
    p_student_id: studentId,
    p_from_date: fromDate ?? null,
    p_to_date: toDate ?? null,
  });

  if (error) throw error;
  return data;
}

export async function exportOrganizationJson(fromDate?: string, toDate?: string) {
  const { data, error } = await supabase.rpc('export_organization_json', {
    p_from_date: fromDate ?? null,
    p_to_date: toDate ?? null,
  });

  if (error) throw error;
  return data;
}

export function getSubmissionForDate(
  submissionsByDate: Record<string, DailySubmission>,
  dateKey: string,
): DailySubmission {
  return submissionsByDate[dateKey] ?? emptyDailySubmission();
}
