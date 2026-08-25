import {
  supabase,
  type DbChatMessage,
  type DbChatThread,
  type DbCurriculumMaterial,
  type DbCurriculumMaterialTopic,
  type DbCurriculumSubject,
  type DbCurriculumSubjectTopic,
  type DbDailyAdminNote,
  type DbDailySubmission,
  type DbDailyTask,
  type DbDenemeEntry,
  type DbDenemeLeafScore,
  type DbMaterialTopicProgress,
  type DbProfile,
  type DbStudentMaterial,
  type DbStudentMeeting,
  type DbStudentSubject,
  type DbSubjectTopicProgress,
} from '../../lib/supabase';
import {
  emptyDailySubmission,
  type ChatMessage,
  type ChatThread,
  type AdminChatInboxItem,
  type ChatMessageType,
  type CurriculumCatalog,
  type CurriculumMaterial,
  type CurriculumSubject,
  type CurriculumTopic,
  type DailySubmission,
  type DenemeEntry,
  type DenemeEntryInput,
  type DenemeLeafScore,
  type StudentAdminSettings,
  type PasswordResetRequest,
  type StudentCurriculumState,
  type StudentMeeting,
  type StudentSummary,
  type StudentTask,
  type TaskTopicLink,
  type TopicStatus,
} from '../types';
import { isMeetingInFuture, normalizeMeetingLink } from '../utils/dates';
import { parseTaskLabel } from '../utils/taskLabel';
import {
  getOrCreateChatSignedUrl,
  prefetchChatSignedUrls,
} from '../utils/chatSignedUrlCache';

function parseTopicLinks(raw: unknown): TaskTopicLink[] {
  if (!Array.isArray(raw)) return [];
  const links: TaskTopicLink[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const scope = (item as { scope?: unknown }).scope;
    const topicId = (item as { topicId?: unknown }).topicId;
    if ((scope === 'subject' || scope === 'material') && typeof topicId === 'string' && topicId) {
      links.push({ scope, topicId });
    }
  }
  return links;
}

function mapTask(row: DbDailyTask): StudentTask {
  const storedDuration = (row.duration_label ?? '').trim();
  const topicLinks = parseTopicLinks(row.topic_links);
  if (storedDuration) {
    return {
      id: row.id,
      label: row.label,
      durationLabel: storedDuration,
      completed: row.completed,
      topicLinks,
    };
  }

  // Legacy rows: duration still embedded in label
  const parsed = parseTaskLabel(row.label);
  return {
    id: row.id,
    label: parsed.label,
    durationLabel: parsed.durationLabel,
    completed: row.completed,
    topicLinks,
  };
}

function normalizeTimeValue(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 5);
}

function normalizeHourValue(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapSubmission(row: DbDailySubmission): DailySubmission {
  return {
    uyumaSaati: normalizeTimeValue(row.uyuma_saati),
    uyanmaSaati: normalizeTimeValue(row.uyanma_saati),
    gunlukCalismaSaat: normalizeHourValue(row.gunluk_calisma_saat),
    ekranSuresiSaat: normalizeHourValue(row.ekran_suresi_saat),
    notlar: row.notlar ?? '',
  };
}

function submissionToRow(studentId: string, dateKey: string, submission: DailySubmission) {
  return {
    student_id: studentId,
    submission_date: dateKey,
    uyuma_saati: submission.uyumaSaati,
    uyanma_saati: submission.uyanmaSaati,
    gunluk_calisma_saat: submission.gunlukCalismaSaat,
    ekran_suresi_saat: submission.ekranSuresiSaat,
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
    .eq('show_on_admin_dashboard', true)
    .order('display_name');

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.display_name,
  }));
}

/** Active students visible in admin chat (ignores dashboard visibility). */
export async function fetchChatVisibleStudents(): Promise<StudentSummary[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('role', 'student')
    .eq('is_active', true)
    .eq('show_in_admin_chat', true)
    .order('display_name');

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.display_name,
  }));
}

/** All active students for chat / internal tools (ignores dashboard visibility). */
export async function fetchAllActiveStudents(): Promise<StudentSummary[]> {
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

function mapStudentAdminSettings(row: {
  id: string;
  display_name: string;
  created_at: string;
  show_on_admin_dashboard?: boolean | null;
  show_on_ogrenciler?: boolean | null;
  show_in_admin_chat?: boolean | null;
  count_in_earnings?: boolean | null;
  earnings_contribution?: number | null;
  day_count_active?: boolean | null;
  day_count_frozen_days?: number | null;
  day_count_start_date?: string | null;
}): StudentAdminSettings {
  const earningsContribution =
    row.earnings_contribution === 0 ||
    row.earnings_contribution === 5000 ||
    row.earnings_contribution === 6000
      ? row.earnings_contribution
      : row.count_in_earnings === false
        ? 0
        : 5000;

  return {
    id: row.id,
    name: row.display_name,
    createdAt: row.created_at,
    showOnAdminDashboard: row.show_on_admin_dashboard !== false,
    showOnOgrenciler: row.show_on_ogrenciler !== false,
    showInAdminChat: row.show_in_admin_chat !== false,
    earningsContribution,
    dayCountActive: row.day_count_active !== false,
    dayCountFrozenDays:
      typeof row.day_count_frozen_days === 'number' ? row.day_count_frozen_days : null,
    dayCountStartDate: row.day_count_start_date ?? null,
  };
}

const STUDENT_SETTINGS_SELECT =
  'id, display_name, created_at, show_on_admin_dashboard, show_on_ogrenciler, show_in_admin_chat, count_in_earnings, earnings_contribution, day_count_active, day_count_frozen_days, day_count_start_date';

export async function fetchStudentAdminSettings(): Promise<StudentAdminSettings[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(STUDENT_SETTINGS_SELECT)
    .eq('role', 'student')
    .eq('is_active', true)
    .order('display_name');

  if (error) throw error;

  return (data ?? []).map((row) => mapStudentAdminSettings(row as Parameters<typeof mapStudentAdminSettings>[0]));
}

/** Sum of per-student earnings contributions (0 / 5000 / 6000). */
export async function fetchMonthlyEarningsTotal(): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('earnings_contribution, count_in_earnings')
    .eq('role', 'student')
    .eq('is_active', true);

  if (error) throw error;

  return (data ?? []).reduce((sum, row) => {
    const contribution = (row as { earnings_contribution?: number | null; count_in_earnings?: boolean | null })
      .earnings_contribution;
    if (contribution === 0 || contribution === 5000 || contribution === 6000) {
      return sum + contribution;
    }
    // Legacy fallback before 032 migration
    const legacy = (row as { count_in_earnings?: boolean | null }).count_in_earnings;
    return sum + (legacy === false ? 0 : 5000);
  }, 0);
}

/** @deprecated Use fetchMonthlyEarningsTotal — kept name for older call sites. */
export async function fetchEarningsStudentCount(): Promise<number> {
  return fetchMonthlyEarningsTotal();
}

export type StudentSettingKey =
  | 'showOnAdminDashboard'
  | 'showOnOgrenciler'
  | 'showInAdminChat'
  | 'dayCountActive';

function istanbulTodayDateKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function daysBetweenDateKeys(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T12:00:00`);
  const to = new Date(`${toKey}T12:00:00`);
  const diff = Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(1, diff + 1);
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + deltaDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function updateStudentSetting(
  studentId: string,
  key: StudentSettingKey,
  value: boolean,
): Promise<StudentAdminSettings> {
  const { data: current, error: readError } = await supabase
    .from('profiles')
    .select(STUDENT_SETTINGS_SELECT)
    .eq('id', studentId)
    .eq('role', 'student')
    .single();
  if (readError) throw readError;

  const mapped = mapStudentAdminSettings(current as Parameters<typeof mapStudentAdminSettings>[0]);
  const todayKey = istanbulTodayDateKey();
  const startKey =
    mapped.dayCountStartDate ??
    (mapped.createdAt ? mapped.createdAt.slice(0, 10) : todayKey);

  const patch: Record<string, boolean | number | string | null> = {};

  if (key === 'showOnAdminDashboard') patch.show_on_admin_dashboard = value;
  if (key === 'showOnOgrenciler') patch.show_on_ogrenciler = value;
  if (key === 'showInAdminChat') patch.show_in_admin_chat = value;

  if (key === 'dayCountActive') {
    if (value) {
      const frozen = mapped.dayCountFrozenDays ?? daysBetweenDateKeys(startKey, todayKey);
      patch.day_count_active = true;
      patch.day_count_frozen_days = null;
      patch.day_count_start_date = shiftDateKey(todayKey, -(frozen - 1));
    } else {
      patch.day_count_active = false;
      patch.day_count_frozen_days = daysBetweenDateKeys(startKey, todayKey);
      patch.day_count_start_date = startKey;
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', studentId)
    .eq('role', 'student')
    .select(STUDENT_SETTINGS_SELECT)
    .single();
  if (error) throw error;

  return mapStudentAdminSettings(data as Parameters<typeof mapStudentAdminSettings>[0]);
}

export async function updateStudentEarningsContribution(
  studentId: string,
  contribution: 0 | 5000 | 6000,
): Promise<StudentAdminSettings> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      earnings_contribution: contribution,
      count_in_earnings: contribution > 0,
    })
    .eq('id', studentId)
    .eq('role', 'student')
    .select(STUDENT_SETTINGS_SELECT)
    .single();
  if (error) throw error;

  return mapStudentAdminSettings(data as Parameters<typeof mapStudentAdminSettings>[0]);
}

export async function fetchPendingPasswordResetRequests(): Promise<PasswordResetRequest[]> {
  const { data, error } = await supabase
    .from('password_reset_requests')
    .select('id, user_id, login_username, note, status, requested_at')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    userId: (row.user_id as string | null) ?? null,
    loginUsername: row.login_username as string,
    note: (row.note as string) ?? '',
    status: row.status as PasswordResetRequest['status'],
    requestedAt: row.requested_at as string,
  }));
}

export async function rejectPasswordResetRequest(requestId: string): Promise<void> {
  const { error } = await supabase.rpc('reject_password_reset_request', {
    p_request_id: requestId,
  });
  if (error) throw error;
}

export async function fetchTasksForRange(
  studentId: string,
  fromDate: string,
  toDate: string,
): Promise<Record<string, StudentTask[]>> {
  const { data, error } = await supabase
    .from('daily_tasks')
    .select('id, student_id, task_date, label, duration_label, completed, sort_order, topic_links')
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
    .select('id, student_id, task_date, label, duration_label, completed, sort_order, topic_links')
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

/** Admin: load tasks for all students in a date range (inclusive). */
export async function fetchOrgTasksForRange(
  fromDate: string,
  toDate: string,
): Promise<Record<string, Record<string, StudentTask[]>>> {
  const { data, error } = await supabase
    .from('daily_tasks')
    .select('id, student_id, task_date, label, duration_label, completed, sort_order, topic_links')
    .gte('task_date', fromDate)
    .lte('task_date', toDate)
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

/** Admin: load submissions for all students in a date range. */
export async function fetchOrgSubmissionsForRange(
  fromDate: string,
  toDate: string,
): Promise<Record<string, Record<string, DailySubmission>>> {
  const { data, error } = await supabase
    .from('daily_submissions')
    .select(
      'id, student_id, submission_date, uyuma_saati, uyanma_saati, gunluk_calisma_saat, ekran_suresi_saat, notlar',
    )
    .gte('submission_date', fromDate)
    .lte('submission_date', toDate);

  if (error) throw error;

  const grouped: Record<string, Record<string, DailySubmission>> = {};
  for (const row of data ?? []) {
    const submission = row as DbDailySubmission;
    grouped[submission.student_id] ??= {};
    grouped[submission.student_id][submission.submission_date] = mapSubmission(submission);
  }

  return grouped;
}

/** Admin: load admin notes for all students in a date range. */
export async function fetchOrgAdminNotesForRange(
  fromDate: string,
  toDate: string,
): Promise<Record<string, Record<string, string>>> {
  const { data, error } = await supabase
    .from('daily_admin_notes')
    .select('id, student_id, note_date, body')
    .gte('note_date', fromDate)
    .lte('note_date', toDate);

  if (error) throw error;

  const grouped: Record<string, Record<string, string>> = {};
  for (const row of data ?? []) {
    const note = row as DbDailyAdminNote;
    grouped[note.student_id] ??= {};
    grouped[note.student_id][note.note_date] = note.body ?? '';
  }

  return grouped;
}

/** Admin: load meetings for all students in a date range. */
export async function fetchOrgMeetingsForRange(
  fromDate: string,
  toDate: string,
): Promise<Record<string, Record<string, StudentMeeting>>> {
  const { data, error } = await supabase
    .from('student_meetings')
    .select('id, student_id, meeting_date, meeting_time, meeting_link')
    .gte('meeting_date', fromDate)
    .lte('meeting_date', toDate)
    .order('meeting_date')
    .order('meeting_time');

  if (error) throw error;

  const grouped: Record<string, Record<string, StudentMeeting>> = {};
  for (const row of data ?? []) {
    const meeting = mapMeeting(row as DbStudentMeeting);
    grouped[meeting.studentId] ??= {};
    grouped[meeting.studentId][meeting.meetingDate] = meeting;
  }

  return grouped;
}

function parseDenemeScores(raw: unknown): DenemeLeafScore[] {
  if (!Array.isArray(raw)) return [];
  const scores: DenemeLeafScore[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Partial<DbDenemeLeafScore>;
    if (typeof row.leafId !== 'string') continue;
    const correct = typeof row.correct === 'number' ? row.correct : Number(row.correct);
    const wrong = typeof row.wrong === 'number' ? row.wrong : Number(row.wrong);
    if (!Number.isFinite(correct) || !Number.isFinite(wrong)) continue;
    const emptyRaw =
      row.empty === undefined || row.empty === null
        ? undefined
        : typeof row.empty === 'number'
          ? row.empty
          : Number(row.empty);
    const empty =
      emptyRaw !== undefined && Number.isFinite(emptyRaw)
        ? Math.max(0, Math.trunc(emptyRaw))
        : undefined;
    scores.push({
      leafId: row.leafId,
      correct: Math.max(0, Math.trunc(correct)),
      wrong: Math.max(0, Math.trunc(wrong)),
      ...(empty !== undefined ? { empty } : {}),
    });
  }
  return scores;
}

function parseDenemeTopics(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapDenemeEntry(row: DbDenemeEntry): DenemeEntry {
  return {
    id: row.id,
    studentId: row.student_id,
    denemeDate: row.deneme_date,
    name: row.name,
    duration: row.duration ?? '',
    typeId: row.type_id,
    scores: parseDenemeScores(row.scores),
    topics: parseDenemeTopics(row.topics),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Load all deneme entries for one student, newest date first. */
export async function fetchDenemesForStudent(studentId: string): Promise<DenemeEntry[]> {
  const { data, error } = await supabase
    .from('deneme_entries')
    .select(
      'id, organization_id, student_id, deneme_date, name, duration, type_id, scores, topics, created_by, created_at, updated_at',
    )
    .eq('student_id', studentId)
    .order('deneme_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapDenemeEntry(row as DbDenemeEntry));
}

/** Load deneme entries for one student in a date range, grouped by date. */
export async function fetchDenemesForRange(
  studentId: string,
  fromDate: string,
  toDate: string,
): Promise<Record<string, DenemeEntry[]>> {
  const { data, error } = await supabase
    .from('deneme_entries')
    .select(
      'id, organization_id, student_id, deneme_date, name, duration, type_id, scores, topics, created_by, created_at, updated_at',
    )
    .eq('student_id', studentId)
    .gte('deneme_date', fromDate)
    .lte('deneme_date', toDate)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const grouped: Record<string, DenemeEntry[]> = {};
  for (const row of data ?? []) {
    const entry = mapDenemeEntry(row as DbDenemeEntry);
    grouped[entry.denemeDate] ??= [];
    grouped[entry.denemeDate].push(entry);
  }
  return grouped;
}

/** Admin: load deneme entries for all students in a date range. */
export async function fetchOrgDenemesForRange(
  fromDate: string,
  toDate: string,
): Promise<Record<string, Record<string, DenemeEntry[]>>> {
  const { data, error } = await supabase
    .from('deneme_entries')
    .select(
      'id, organization_id, student_id, deneme_date, name, duration, type_id, scores, topics, created_by, created_at, updated_at',
    )
    .gte('deneme_date', fromDate)
    .lte('deneme_date', toDate)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const grouped: Record<string, Record<string, DenemeEntry[]>> = {};
  for (const row of data ?? []) {
    const entry = mapDenemeEntry(row as DbDenemeEntry);
    grouped[entry.studentId] ??= {};
    grouped[entry.studentId][entry.denemeDate] ??= [];
    grouped[entry.studentId][entry.denemeDate].push(entry);
  }
  return grouped;
}

export async function createDenemeEntry(
  studentId: string,
  input: DenemeEntryInput,
  createdBy: string,
): Promise<DenemeEntry> {
  const { data, error } = await supabase
    .from('deneme_entries')
    .insert({
      student_id: studentId,
      deneme_date: input.denemeDate,
      name: input.name.trim(),
      duration: input.duration.trim(),
      type_id: input.typeId,
      scores: input.scores,
      topics: input.topics.map((t) => t.trim()).filter(Boolean),
      created_by: createdBy,
    })
    .select(
      'id, organization_id, student_id, deneme_date, name, duration, type_id, scores, topics, created_by, created_at, updated_at',
    )
    .single();

  if (error) throw error;
  return mapDenemeEntry(data as DbDenemeEntry);
}

export async function updateDenemeEntry(
  denemeId: string,
  input: DenemeEntryInput,
): Promise<DenemeEntry> {
  const { data, error } = await supabase
    .from('deneme_entries')
    .update({
      deneme_date: input.denemeDate,
      name: input.name.trim(),
      duration: input.duration.trim(),
      type_id: input.typeId,
      scores: input.scores,
      topics: input.topics.map((t) => t.trim()).filter(Boolean),
    })
    .eq('id', denemeId)
    .select(
      'id, organization_id, student_id, deneme_date, name, duration, type_id, scores, topics, created_by, created_at, updated_at',
    )
    .single();

  if (error) throw error;
  return mapDenemeEntry(data as DbDenemeEntry);
}

export async function deleteDenemeEntry(denemeId: string): Promise<void> {
  const { error } = await supabase.from('deneme_entries').delete().eq('id', denemeId);
  if (error) throw error;
}

export async function fetchSubmissionsForRange(
  studentId: string,
  fromDate: string,
  toDate: string,
): Promise<Record<string, DailySubmission>> {
  const { data, error } = await supabase
    .from('daily_submissions')
    .select(
      'id, student_id, submission_date, uyuma_saati, uyanma_saati, gunluk_calisma_saat, ekran_suresi_saat, notlar',
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
  const { data, error } = await supabase
    .from('daily_tasks')
    .update({ completed })
    .eq('id', taskId)
    .select('id, student_id, topic_links')
    .single();
  if (error) throw error;

  if (completed && data) {
    const links = parseTopicLinks(data.topic_links);
    const studentId = data.student_id as string;
    for (const link of links) {
      try {
        if (link.scope === 'subject') {
          await upsertSubjectTopicProgress(studentId, link.topicId, 'completed_ok');
        } else {
          await upsertMaterialTopicProgress(studentId, link.topicId, {
            status: 'completed_ok',
          });
        }
      } catch {
        // Best-effort auto-complete; topic may not exist yet.
      }
    }
  }
}

export type DailyTaskChange = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  studentId: string;
  dateKey: string;
  sortOrder: number;
  task: StudentTask | null;
  taskId: string;
};

function mapTaskChangeFromRow(
  eventType: DailyTaskChange['eventType'],
  row: Partial<DbDailyTask> & { id?: string },
): DailyTaskChange | null {
  if (!row.id) return null;
  const taskId = row.id;
  const studentId = row.student_id ?? '';
  const dateKey = row.task_date ?? '';
  const sortOrder = typeof row.sort_order === 'number' ? row.sort_order : 0;

  if (eventType === 'DELETE') {
    return {
      eventType,
      studentId,
      dateKey,
      sortOrder,
      task: null,
      taskId,
    };
  }

  if (!row.student_id || !row.task_date || typeof row.label !== 'string') return null;

  return {
    eventType,
    studentId: row.student_id,
    dateKey: row.task_date,
    sortOrder,
    task: mapTask(row as DbDailyTask),
    taskId,
  };
}

/** Patch a student week map from a Realtime task change. */
export function applyDailyTaskChange(
  current: Record<string, StudentTask[]>,
  change: DailyTaskChange,
  fromDate?: string,
  toDate?: string,
): Record<string, StudentTask[]> {
  const inRange = (dateKey: string) => {
    if (!dateKey) return true;
    if (fromDate && dateKey < fromDate) return false;
    if (toDate && dateKey > toDate) return false;
    return true;
  };

  if (change.eventType === 'DELETE') {
    const next: Record<string, StudentTask[]> = {};
    for (const [dateKey, tasks] of Object.entries(current)) {
      next[dateKey] = tasks.filter((task) => task.id !== change.taskId);
    }
    return next;
  }

  if (!change.task || !inRange(change.dateKey)) {
    if (change.eventType === 'UPDATE') {
      const next: Record<string, StudentTask[]> = {};
      for (const [dateKey, tasks] of Object.entries(current)) {
        next[dateKey] = tasks.filter((task) => task.id !== change.taskId);
      }
      return next;
    }
    return current;
  }

  const next: Record<string, StudentTask[]> = {};
  for (const [dateKey, tasks] of Object.entries(current)) {
    next[dateKey] = tasks.filter((task) => task.id !== change.taskId);
  }

  const dayTasks = [...(next[change.dateKey] ?? []), change.task];
  const withOrder = dayTasks.map((task, index) => ({
    task,
    order: task.id === change.taskId ? change.sortOrder : index,
  }));
  withOrder.sort((a, b) => a.order - b.order || a.task.label.localeCompare(b.task.label, 'tr'));
  next[change.dateKey] = withOrder.map((entry) => entry.task);
  return next;
}

/** Subscribe to daily_tasks changes. Filter by student or organization. Returns unsubscribe. */
export function subscribeDailyTasks(
  filter: { studentId: string } | { organizationId: string },
  onChange: (change: DailyTaskChange) => void,
): () => void {
  const channelName =
    'studentId' in filter
      ? `daily-tasks:student:${filter.studentId}`
      : `daily-tasks:org:${filter.organizationId}`;
  const postgresFilter =
    'studentId' in filter
      ? `student_id=eq.${filter.studentId}`
      : `organization_id=eq.${filter.organizationId}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'daily_tasks',
        filter: postgresFilter,
      },
      (payload) => {
        const eventType = payload.eventType as DailyTaskChange['eventType'];
        const row =
          eventType === 'DELETE'
            ? (payload.old as Partial<DbDailyTask>)
            : (payload.new as Partial<DbDailyTask>);
        const change = mapTaskChangeFromRow(eventType, row);
        if (change) onChange(change);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function fetchAdminNotesForRange(
  studentId: string,
  fromDate: string,
  toDate: string,
): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('daily_admin_notes')
    .select('id, student_id, note_date, body')
    .eq('student_id', studentId)
    .gte('note_date', fromDate)
    .lte('note_date', toDate);

  if (error) throw error;

  const grouped: Record<string, string> = {};
  for (const row of data ?? []) {
    const note = row as DbDailyAdminNote;
    grouped[note.note_date] = note.body ?? '';
  }

  return grouped;
}

export async function upsertAdminNote(studentId: string, dateKey: string, body: string) {
  const { error } = await supabase.from('daily_admin_notes').upsert(
    {
      student_id: studentId,
      note_date: dateKey,
      body,
    },
    { onConflict: 'student_id,note_date' },
  );
  if (error) throw error;
}

function mapMeeting(row: DbStudentMeeting): StudentMeeting {
  return {
    id: row.id,
    studentId: row.student_id,
    meetingDate: row.meeting_date,
    meetingTime: (row.meeting_time ?? '').slice(0, 5),
    meetingLink: row.meeting_link ?? '',
  };
}

export async function fetchMeetingsForRange(
  studentId: string,
  fromDate: string,
  toDate: string,
): Promise<Record<string, StudentMeeting>> {
  const { data, error } = await supabase
    .from('student_meetings')
    .select('id, student_id, meeting_date, meeting_time, meeting_link')
    .eq('student_id', studentId)
    .gte('meeting_date', fromDate)
    .lte('meeting_date', toDate)
    .order('meeting_date')
    .order('meeting_time');

  if (error) throw error;

  const grouped: Record<string, StudentMeeting> = {};
  for (const row of data ?? []) {
    const meeting = mapMeeting(row as DbStudentMeeting);
    grouped[meeting.meetingDate] = meeting;
  }
  return grouped;
}

/**
 * Student IDs with a meeting in [fromDate, toDate] whose date+time is still in the future.
 */
export async function fetchStudentIdsWithMeetingsInRange(
  fromDate: string,
  toDate: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('student_meetings')
    .select('student_id, meeting_date, meeting_time')
    .gte('meeting_date', fromDate)
    .lte('meeting_date', toDate);

  if (error) throw error;

  const now = new Date();
  const ids = new Set<string>();
  for (const row of data ?? []) {
    if (
      isMeetingInFuture(
        String(row.meeting_date),
        String(row.meeting_time ?? '00:00'),
        now,
      )
    ) {
      ids.add(row.student_id as string);
    }
  }
  return ids;
}

export async function upsertMeeting(input: {
  studentId: string;
  meetingDate: string;
  meetingTime: string;
  meetingLink: string;
}): Promise<StudentMeeting> {
  const { data, error } = await supabase
    .from('student_meetings')
    .upsert(
      {
        student_id: input.studentId,
        meeting_date: input.meetingDate,
        meeting_time: input.meetingTime,
        meeting_link: normalizeMeetingLink(input.meetingLink),
      },
      { onConflict: 'student_id,meeting_date' },
    )
    .select('id, student_id, meeting_date, meeting_time, meeting_link')
    .single();

  if (error) throw error;
  return mapMeeting(data as DbStudentMeeting);
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  const { error } = await supabase.from('student_meetings').delete().eq('id', meetingId);
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

export async function createTask(
  studentId: string,
  dateKey: string,
  label: string,
  sortOrder: number,
  topicLinks: TaskTopicLink[] = [],
) {
  const parsed = parseTaskLabel(label);
  const { data, error } = await supabase
    .from('daily_tasks')
    .insert({
      student_id: studentId,
      task_date: dateKey,
      label: parsed.label,
      duration_label: parsed.durationLabel,
      sort_order: sortOrder,
      completed: false,
      topic_links: topicLinks,
    })
    .select('id, student_id, task_date, label, duration_label, completed, sort_order, topic_links')
    .single();

  if (error) throw error;
  return mapTask(data as DbDailyTask);
}

export async function updateTaskLabel(taskId: string, label: string) {
  const parsed = parseTaskLabel(label);
  const { error } = await supabase
    .from('daily_tasks')
    .update({ label: parsed.label, duration_label: parsed.durationLabel })
    .eq('id', taskId);
  if (error) throw error;
  return parsed;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase.from('daily_tasks').delete().eq('id', taskId);
  if (error) throw error;
}

export async function fetchStudentShowcaseHighlights(): Promise<
  Array<{
    id: string;
    name: string;
    showcaseHighlights: string[];
    showcaseSortOrder: number;
  }>
> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, showcase_highlight, showcase_sort_order')
    .eq('role', 'student')
    .eq('is_active', true)
    .order('showcase_sort_order')
    .order('display_name');

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.display_name as string,
    showcaseHighlights: normalizeShowcaseHighlights(row.showcase_highlight),
    showcaseSortOrder: Number(row.showcase_sort_order ?? 0),
  }));
}

export async function updateStudentShowcaseHighlights(
  studentId: string,
  showcaseHighlights: string[],
) {
  const cleaned = showcaseHighlights.map((entry) => entry.trim()).filter(Boolean);
  const { error } = await supabase
    .from('profiles')
    .update({ showcase_highlight: cleaned })
    .eq('id', studentId)
    .eq('role', 'student');

  if (error) throw error;
}

function normalizeShowcaseHighlights(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((entry) => String(entry ?? '').trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
}

/** Persist full showcase list order (index = sort order). */
export async function updateShowcaseSortOrders(
  orderedStudentIds: string[],
): Promise<void> {
  const results = await Promise.all(
    orderedStudentIds.map((studentId, index) =>
      supabase
        .from('profiles')
        .update({ showcase_sort_order: index })
        .eq('id', studentId)
        .eq('role', 'student'),
    ),
  );

  const firstError = results.find((result) => result.error)?.error;
  if (firstError) throw firstError;
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

function mapChatThread(row: DbChatThread): ChatThread {
  return {
    id: row.id,
    studentId: row.student_id,
    organizationId: row.organization_id,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview ?? null,
    lastMessageType: (row.last_message_type as ChatMessageType | null | undefined) ?? null,
    lastSenderId: row.last_sender_id ?? null,
    adminLastReadAt: row.admin_last_read_at ?? null,
    adminUnreadCount: row.admin_unread_count ?? 0,
  };
}

function mapChatMessage(row: DbChatMessage): ChatMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    body: row.body ?? '',
    messageType: row.message_type,
    attachmentPath: row.attachment_path,
    createdAt: row.created_at,
  };
}

const CHAT_THREAD_SELECT =
  'id, organization_id, student_id, last_message_at, last_message_preview, last_message_type, last_sender_id, admin_last_read_at, admin_unread_count, created_at, updated_at';

function sortAdminChatInbox(items: AdminChatInboxItem[]): AdminChatInboxItem[] {
  return [...items].sort((a, b) => {
    if (a.lastMessageAt && b.lastMessageAt) {
      if (a.lastMessageAt !== b.lastMessageAt) {
        return a.lastMessageAt < b.lastMessageAt ? 1 : -1;
      }
    } else if (a.lastMessageAt) {
      return -1;
    } else if (b.lastMessageAt) {
      return 1;
    }
    return a.studentName.localeCompare(b.studentName, 'tr');
  });
}

/** Active students + thread preview/unread for admin chat sidebar. */
export async function fetchAdminChatInbox(): Promise<AdminChatInboxItem[]> {
  const [students, threadsRes] = await Promise.all([
    fetchChatVisibleStudents(),
    supabase
      .from('chat_threads')
      .select(CHAT_THREAD_SELECT),
  ]);

  if (threadsRes.error) throw threadsRes.error;

  const threadByStudent = new Map(
    ((threadsRes.data ?? []) as DbChatThread[]).map((row) => [row.student_id, mapChatThread(row)]),
  );

  return sortAdminChatInbox(
    students.map((student) => {
      const thread = threadByStudent.get(student.id);
      return {
        studentId: student.id,
        studentName: student.name,
        threadId: thread?.id ?? null,
        lastMessageAt: thread?.lastMessageAt ?? null,
        lastMessagePreview: thread?.lastMessagePreview ?? null,
        lastMessageType: thread?.lastMessageType ?? null,
        lastSenderId: thread?.lastSenderId ?? null,
        unreadCount: thread?.adminUnreadCount ?? 0,
      };
    }),
  );
}

/** Count of visible chat students/threads with at least one unread admin message (navbar badge). */
export async function fetchAdminChatUnreadTotal(): Promise<number> {
  const [students, threadsRes] = await Promise.all([
    fetchChatVisibleStudents(),
    supabase.from('chat_threads').select('student_id, admin_unread_count'),
  ]);
  if (threadsRes.error) throw threadsRes.error;

  const visibleIds = new Set(students.map((student) => student.id));
  return (threadsRes.data ?? []).reduce((count, row) => {
    if (!visibleIds.has(row.student_id as string)) return count;
    const n = typeof row.admin_unread_count === 'number' ? row.admin_unread_count : 0;
    return n > 0 ? count + 1 : count;
  }, 0);
}

export async function ensureChatThread(studentId: string): Promise<ChatThread> {
  const { data, error } = await supabase.rpc('ensure_chat_thread', {
    p_student_id: studentId,
  });
  if (error) throw error;
  return mapChatThread(data as DbChatThread);
}

export async function markChatThreadRead(threadId: string): Promise<ChatThread> {
  const { data, error } = await supabase.rpc('mark_chat_thread_read', {
    p_thread_id: threadId,
  });
  if (error) throw error;
  return mapChatThread(data as DbChatThread);
}

export async function fetchChatMessages(threadId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(
      'id, organization_id, thread_id, sender_id, body, message_type, attachment_path, created_at',
    )
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapChatMessage(row as DbChatMessage));
}

export async function sendChatTextMessage(
  threadId: string,
  senderId: string,
  body: string,
): Promise<ChatMessage> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error('Empty message');

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      thread_id: threadId,
      sender_id: senderId,
      body: trimmed,
      message_type: 'text',
    })
    .select(
      'id, organization_id, thread_id, sender_id, body, message_type, attachment_path, created_at',
    )
    .single();

  if (error) throw error;
  return mapChatMessage(data as DbChatMessage);
}

const CHAT_ATTACHMENTS_BUCKET = 'chat-attachments';

export function sanitizeChatFileName(name: string): string {
  const cleaned = name.replace(/[^\w.\-()+ ]+/g, '_').trim();
  return cleaned.slice(0, 120) || 'file';
}

export function chatAttachmentFileName(path: string | null | undefined): string {
  if (!path) return 'dosya';
  const parts = path.split('/');
  return parts[parts.length - 1] || 'dosya';
}

export async function createChatAttachmentSignedUrl(path: string): Promise<string> {
  return getOrCreateChatSignedUrl(path, async () => {
    const { data, error } = await supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .createSignedUrl(path, 60 * 60);
    if (error) throw error;
    return data.signedUrl;
  });
}

export async function prefetchChatAttachmentUrls(
  paths: Array<string | null | undefined>,
): Promise<void> {
  await prefetchChatSignedUrls(paths, async (path) => {
    const { data, error } = await supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .createSignedUrl(path, 60 * 60);
    if (error) throw error;
    return data.signedUrl;
  });
}

export async function sendChatAttachmentMessage(input: {
  threadId: string;
  senderId: string;
  messageType: 'image' | 'document' | 'voice';
  fileName: string;
  contentType: string;
  data: Blob | ArrayBuffer | File;
  caption?: string;
}): Promise<ChatMessage> {
  const messageId = crypto.randomUUID();
  const safeName = sanitizeChatFileName(input.fileName);
  const attachmentPath = `${input.threadId}/${messageId}/${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(CHAT_ATTACHMENTS_BUCKET)
    .upload(attachmentPath, input.data, {
      contentType: input.contentType,
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      id: messageId,
      thread_id: input.threadId,
      sender_id: input.senderId,
      body: (input.caption ?? '').trim(),
      message_type: input.messageType,
      attachment_path: attachmentPath,
    })
    .select(
      'id, organization_id, thread_id, sender_id, body, message_type, attachment_path, created_at',
    )
    .single();

  if (error) {
    void supabase.storage.from(CHAT_ATTACHMENTS_BUCKET).remove([attachmentPath]);
    throw error;
  }

  return mapChatMessage(data as DbChatMessage);
}

export function subscribeChatMessages(
  threadId: string,
  onInsert: (message: ChatMessage) => void,
): () => void {
  const channel = supabase
    .channel(`chat-messages:${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => {
        onInsert(mapChatMessage(payload.new as DbChatMessage));
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Live updates for admin inbox sidebar (thread preview / unread). */
export function subscribeAdminChatInbox(
  organizationId: string,
  onChange: (thread: ChatThread) => void,
): () => void {
  const channel = supabase
    .channel(`chat-inbox:${organizationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_threads',
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload) => {
        const row =
          payload.eventType === 'DELETE'
            ? (payload.old as DbChatThread | undefined)
            : (payload.new as DbChatThread | undefined);
        if (!row?.id) return;
        onChange(mapChatThread(row));
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------------
// Konu & Materyal (curriculum)
// ---------------------------------------------------------------------------

const TOPIC_STATUSES: TopicStatus[] = ['none', 'current', 'completed_warn', 'completed_ok'];

function asTopicStatus(value: string): TopicStatus {
  return TOPIC_STATUSES.includes(value as TopicStatus) ? (value as TopicStatus) : 'none';
}

function mapCatalogTopic(
  row: { id: string; label: string; sort_order: number },
): CurriculumTopic {
  return { id: row.id, label: row.label, sortOrder: row.sort_order };
}

export async function fetchCurriculumCatalog(): Promise<CurriculumCatalog> {
  const [subjectsRes, subjectTopicsRes, materialsRes, materialTopicsRes] = await Promise.all([
    supabase
      .from('curriculum_subjects')
      .select('id, label, sort_order')
      .order('sort_order', { ascending: true }),
    supabase
      .from('curriculum_subject_topics')
      .select('id, subject_id, label, sort_order')
      .order('sort_order', { ascending: true }),
    supabase
      .from('curriculum_materials')
      .select('id, subject_id, label, sort_order')
      .order('sort_order', { ascending: true }),
    supabase
      .from('curriculum_material_topics')
      .select('id, material_id, label, sort_order')
      .order('sort_order', { ascending: true }),
  ]);

  if (subjectsRes.error) throw subjectsRes.error;
  if (subjectTopicsRes.error) throw subjectTopicsRes.error;
  if (materialsRes.error) throw materialsRes.error;
  if (materialTopicsRes.error) throw materialTopicsRes.error;

  const subjectTopics = (subjectTopicsRes.data ?? []) as DbCurriculumSubjectTopic[];
  const materialTopics = (materialTopicsRes.data ?? []) as DbCurriculumMaterialTopic[];

  const subjects: CurriculumSubject[] = ((subjectsRes.data ?? []) as DbCurriculumSubject[]).map(
    (row) => ({
      id: row.id,
      label: row.label,
      sortOrder: row.sort_order,
      topics: subjectTopics.filter((t) => t.subject_id === row.id).map(mapCatalogTopic),
    }),
  );

  const materials: CurriculumMaterial[] = ((materialsRes.data ?? []) as DbCurriculumMaterial[]).map(
    (row) => ({
      id: row.id,
      subjectId: row.subject_id,
      label: row.label,
      sortOrder: row.sort_order,
      topics: materialTopics.filter((t) => t.material_id === row.id).map(mapCatalogTopic),
    }),
  );

  return { subjects, materials };
}

export async function fetchStudentCurriculumState(
  studentId: string,
): Promise<StudentCurriculumState> {
  const [subjectsRes, materialsRes, subjectProgRes, materialProgRes] = await Promise.all([
    supabase.from('student_subjects').select('id, student_id, subject_id').eq('student_id', studentId),
    supabase
      .from('student_materials')
      .select('id, student_id, material_id')
      .eq('student_id', studentId),
    supabase
      .from('subject_topic_progress')
      .select('id, student_id, subject_id, topic_id, status')
      .eq('student_id', studentId),
    supabase
      .from('material_topic_progress')
      .select('id, student_id, material_id, topic_id, status, correct_count, question_count')
      .eq('student_id', studentId),
  ]);

  if (subjectsRes.error) throw subjectsRes.error;
  if (materialsRes.error) throw materialsRes.error;
  if (subjectProgRes.error) throw subjectProgRes.error;
  if (materialProgRes.error) throw materialProgRes.error;

  return {
    subjectIds: ((subjectsRes.data ?? []) as DbStudentSubject[]).map((r) => r.subject_id),
    materialIds: ((materialsRes.data ?? []) as DbStudentMaterial[]).map((r) => r.material_id),
    subjectProgress: ((subjectProgRes.data ?? []) as DbSubjectTopicProgress[]).map((r) => ({
      topicId: r.topic_id,
      subjectId: r.subject_id,
      status: asTopicStatus(r.status),
    })),
    materialProgress: ((materialProgRes.data ?? []) as DbMaterialTopicProgress[]).map((r) => ({
      topicId: r.topic_id,
      materialId: r.material_id,
      status: asTopicStatus(r.status),
      correctCount: r.correct_count,
      questionCount: r.question_count,
    })),
  };
}

export async function enrollStudentSubject(studentId: string, subjectId: string) {
  const { error } = await supabase.from('student_subjects').insert({
    student_id: studentId,
    subject_id: subjectId,
  });
  if (error) throw error;
}

export async function unenrollStudentSubject(studentId: string, subjectId: string) {
  const { error } = await supabase
    .from('student_subjects')
    .delete()
    .eq('student_id', studentId)
    .eq('subject_id', subjectId);
  if (error) throw error;
}

export async function enrollStudentMaterial(studentId: string, materialId: string) {
  const { error } = await supabase.from('student_materials').insert({
    student_id: studentId,
    material_id: materialId,
  });
  if (error) throw error;
}

export async function unenrollStudentMaterial(studentId: string, materialId: string) {
  const { error } = await supabase
    .from('student_materials')
    .delete()
    .eq('student_id', studentId)
    .eq('material_id', materialId);
  if (error) throw error;
}

export async function upsertSubjectTopicProgress(
  studentId: string,
  topicId: string,
  status: TopicStatus,
) {
  const { data: topic, error: topicError } = await supabase
    .from('curriculum_subject_topics')
    .select('id, subject_id')
    .eq('id', topicId)
    .maybeSingle();
  if (topicError) throw topicError;
  if (!topic) throw new Error('Subject topic not found');

  const { error } = await supabase.from('subject_topic_progress').upsert(
    {
      student_id: studentId,
      subject_id: topic.subject_id,
      topic_id: topicId,
      status,
    },
    { onConflict: 'student_id,topic_id' },
  );
  if (error) throw error;
}

export async function upsertMaterialTopicProgress(
  studentId: string,
  topicId: string,
  input: {
    status: TopicStatus;
    correctCount?: number | null;
    questionCount?: number | null;
  },
) {
  const { data: topic, error: topicError } = await supabase
    .from('curriculum_material_topics')
    .select('id, material_id')
    .eq('id', topicId)
    .maybeSingle();
  if (topicError) throw topicError;
  if (!topic) throw new Error('Material topic not found');

  const { error } = await supabase.from('material_topic_progress').upsert(
    {
      student_id: studentId,
      material_id: topic.material_id,
      topic_id: topicId,
      status: input.status,
      correct_count: input.correctCount ?? null,
      question_count: input.questionCount ?? null,
    },
    { onConflict: 'student_id,topic_id' },
  );
  if (error) throw error;
}

export async function updateTaskTopicLinks(taskId: string, topicLinks: TaskTopicLink[]) {
  const { error } = await supabase
    .from('daily_tasks')
    .update({ topic_links: topicLinks })
    .eq('id', taskId);
  if (error) throw error;
}
