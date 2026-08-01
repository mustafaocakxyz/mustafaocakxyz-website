import {
  supabase,
  type DbChatMessage,
  type DbChatThread,
  type DbDailyAdminNote,
  type DbDailySubmission,
  type DbDailyTask,
  type DbProfile,
  type DbStudentMeeting,
} from '../../lib/supabase';
import {
  emptyDailySubmission,
  type ChatMessage,
  type ChatThread,
  type DailySubmission,
  type StudentMeeting,
  type StudentSummary,
  type StudentTask,
} from '../types';
import { isMeetingInFuture, normalizeMeetingLink } from '../utils/dates';
import { parseTaskLabel } from '../utils/taskLabel';
import {
  getOrCreateChatSignedUrl,
  prefetchChatSignedUrls,
} from '../utils/chatSignedUrlCache';

function mapTask(row: DbDailyTask): StudentTask {
  const storedDuration = (row.duration_label ?? '').trim();
  if (storedDuration) {
    return {
      id: row.id,
      label: row.label,
      durationLabel: storedDuration,
      completed: row.completed,
    };
  }

  // Legacy rows: duration still embedded in label
  const parsed = parseTaskLabel(row.label);
  return {
    id: row.id,
    label: parsed.label,
    durationLabel: parsed.durationLabel,
    completed: row.completed,
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
    .select('id, student_id, task_date, label, duration_label, completed, sort_order')
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
    .select('id, student_id, task_date, label, duration_label, completed, sort_order')
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
    .select('id, student_id, task_date, label, duration_label, completed, sort_order')
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
  const { error } = await supabase.from('daily_tasks').update({ completed }).eq('id', taskId);
  if (error) throw error;
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

export async function createTask(studentId: string, dateKey: string, label: string, sortOrder: number) {
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
    })
    .select('id, student_id, task_date, label, duration_label, completed, sort_order')
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
  Array<{ id: string; name: string; showcaseHighlight: string; showcaseSortOrder: number }>
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
    showcaseHighlight: (row.showcase_highlight as string | null) ?? '',
    showcaseSortOrder: Number(row.showcase_sort_order ?? 0),
  }));
}

export async function updateStudentShowcaseHighlight(
  studentId: string,
  showcaseHighlight: string,
) {
  const { error } = await supabase
    .from('profiles')
    .update({ showcase_highlight: showcaseHighlight.trim() })
    .eq('id', studentId)
    .eq('role', 'student');

  if (error) throw error;
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

export async function ensureChatThread(studentId: string): Promise<ChatThread> {
  const { data, error } = await supabase.rpc('ensure_chat_thread', {
    p_student_id: studentId,
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
