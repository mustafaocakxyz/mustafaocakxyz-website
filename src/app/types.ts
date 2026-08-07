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
  /** Parsed estimate, e.g. "2 saat" / "30 dak". Empty if none. */
  durationLabel: string;
  completed: boolean;
  /** Optional auto-complete links for konu/materyal topics. */
  topicLinks?: TaskTopicLink[];
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

export type StudentMeeting = {
  id: string;
  studentId: string;
  meetingDate: string;
  meetingTime: string;
  meetingLink: string;
};

export type ChatMessageType = 'text' | 'image' | 'document' | 'voice' | 'system';

export type ChatThread = {
  id: string;
  studentId: string;
  organizationId: string;
  lastMessageAt: string | null;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string | null;
  body: string;
  messageType: ChatMessageType;
  attachmentPath: string | null;
  createdAt: string;
};

export type DenemeLeafScore = {
  leafId: string;
  correct: number;
  wrong: number;
};

export type DenemeEntry = {
  id: string;
  studentId: string;
  denemeDate: string;
  name: string;
  duration: string;
  typeId: string;
  scores: DenemeLeafScore[];
  topics: string[];
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DenemeEntryInput = {
  denemeDate: string;
  name: string;
  duration: string;
  typeId: string;
  scores: DenemeLeafScore[];
  topics: string[];
};

/** Subject / material topic progress states. */
export type TopicStatus = 'none' | 'current' | 'completed_warn' | 'completed_ok';

export const TOPIC_STATUS_LABEL: Record<TopicStatus, string> = {
  none: '—',
  current: 'Devam',
  completed_warn: 'Tamam ⚠',
  completed_ok: 'Tamam ✓',
};

export function isTopicCompleted(status: TopicStatus): boolean {
  return status === 'completed_warn' || status === 'completed_ok';
}

export type CurriculumTopic = {
  id: string;
  label: string;
  sortOrder: number;
};

export type CurriculumSubject = {
  id: string;
  label: string;
  sortOrder: number;
  topics: CurriculumTopic[];
};

export type CurriculumMaterial = {
  id: string;
  subjectId: string;
  label: string;
  sortOrder: number;
  topics: CurriculumTopic[];
};

export type CurriculumCatalog = {
  subjects: CurriculumSubject[];
  materials: CurriculumMaterial[];
};

export type SubjectTopicProgress = {
  topicId: string;
  subjectId: string;
  status: TopicStatus;
};

export type MaterialTopicProgress = {
  topicId: string;
  materialId: string;
  status: TopicStatus;
  correctCount: number | null;
  questionCount: number | null;
};

export type TaskTopicLink = {
  scope: 'subject' | 'material';
  topicId: string;
};

export type StudentCurriculumState = {
  subjectIds: string[];
  materialIds: string[];
  subjectProgress: SubjectTopicProgress[];
  materialProgress: MaterialTopicProgress[];
};

export function materialCorrectPercent(
  correctCount: number | null,
  questionCount: number | null,
): number | null {
  if (correctCount == null || questionCount == null || questionCount <= 0) return null;
  return Math.round((100 * correctCount) / questionCount);
}

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

/** 00:00 … 23:00 */
export const HOUR_TIME_OPTIONS: string[] = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, '0'),
);

/** 00 … 59 */
export const MINUTE_TIME_OPTIONS: string[] = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, '0'),
);

export function formatHourOptionLabel(hours: number): string {
  const label = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `${label} saat`;
}
