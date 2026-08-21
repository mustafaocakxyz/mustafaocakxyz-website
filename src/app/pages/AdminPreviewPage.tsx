import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Library, Settings, Table2, Video } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  applyDailyTaskChange,
  createDenemeEntry,
  createTask,
  deleteDenemeEntry,
  deleteMeeting,
  deleteTask,
  enrollStudentMaterial,
  enrollStudentSubject,
  exportOrganizationJson,
  exportStudentJson,
  fetchCurriculumCatalog,
  fetchDenemesForStudent,
  fetchEarningsStudentCount,
  fetchOrgAdminNotesForRange,
  fetchOrgMeetingsForRange,
  fetchOrgSubmissionsForRange,
  fetchOrgTasksForDates,
  fetchOrgTasksForRange,
  fetchStudentCurriculumState,
  fetchStudentIdsWithMeetingsInRange,
  fetchStudents,
  fetchSubmissionsForRange,
  fetchTasksForRange,
  fetchAdminNotesForRange,
  fetchMeetingsForRange,
  fetchAdminChatUnreadTotal,
  getSubmissionForDate,
  subscribeDailyTasks,
  subscribeAdminChatInbox,
  unenrollStudentMaterial,
  unenrollStudentSubject,
  updateDenemeEntry,
  updateTaskLabel,
  updateTaskTopicLinks,
  upsertAdminNote,
  upsertMaterialTopicProgress,
  upsertMeeting,
  upsertSubjectTopicProgress,
} from '../api/appData';
import { useAppAuth } from '../AppAuthContext';
import { DenemePanel } from '../components/DenemePanel';
import { KonuMateryalPanel } from '../components/KonuMateryalPanel';
import type {
  CurriculumCatalog,
  DailySubmission,
  DenemeEntry,
  DenemeEntryInput,
  StudentCurriculumState,
  StudentMeeting,
  StudentSummary,
  StudentTask,
  TaskTopicLink,
  TopicStatus,
} from '../types';
import {
  addDaysToDateKey,
  buildDaysFromOffsets,
  buildWeekDays,
  startOfDay,
  toDateKey,
} from '../utils/dates';
import { downloadJson } from '../utils/download';
import { computeCompletionPercent } from '../utils/taskLabel';
import { CoachNotesSection } from '../preview/AdminPreviewSections';
import {
  PreviewDayNoteRail,
  PreviewFormSection,
  PreviewTasksSection,
} from '../preview/PreviewDaySections';
import {
  AccentButton,
  Avatar,
  ContentCard,
  CountBadge,
  DashboardGrid,
  EarningsAmount,
  EarningsBadge,
  EmptyState,
  ErrorText,
  FilterChip,
  FilterRow,
  IdentityCard,
  IdentityLeft,
  IdentityNav,
  IdentityNavButton,
  IdentityTitle,
  IdentityTop,
  LiveDotCore,
  LiveDotPulse,
  LiveDotWrap,
  LoadingText,
  MainPanel,
  MeetingAlertPill,
  PillRow,
  PreviewBody,
  PreviewDaySlider,
  PreviewFrame,
  PreviewShell,
  PreviewTopBar,
  SearchInput,
  SectionPill,
  SectionPillRow,
  Sidebar,
  SidebarHead,
  SidebarTitle,
  StatusChip,
  StudentCardButton,
  StudentListScroll,
  StudentName,
  ChatGlowButton,
  ChatUnreadBadge,
  TopBarActions,
  TopBarIconButton,
  TopBarEnd,
  TopBarTitle,
} from '../preview/AdminPreviewUi';
import { preview as t } from '../preview/adminPreviewTheme';

/** Default week still yesterday→+5; slider starts padded so admin can scroll out. */
const ADMIN_DAY_PAD = 14;
const ADMIN_DAY_CHUNK = 14;
const ADMIN_TODAY_INDEX = ADMIN_DAY_PAD + 1;

type SectionId = 'tasks' | 'form' | 'topics' | 'exams' | 'notes';

type CompletionTone = 'ok' | 'warn' | 'bad' | 'muted';

type StudentStatus = {
  tomorrowReady: boolean;
  todayPercent: number | null;
  todayTone: CompletionTone;
};

const DAY_SECTIONS: { id: Extract<SectionId, 'tasks' | 'form'>; label: string }[] = [
  { id: 'tasks', label: 'Görevler' },
  { id: 'form', label: 'Form' },
];

const PROFILE_SECTIONS: { id: Extract<SectionId, 'topics' | 'exams' | 'notes'>; label: string }[] = [
  { id: 'topics', label: 'Konu & Materyal' },
  { id: 'exams', label: 'Denemeler' },
  { id: 'notes', label: 'Notlar' },
];

const PRICE_PER_STUDENT = 5000;

function formatMonthlyEarnings(earningsStudentCount: number): string {
  const amount = Math.max(0, earningsStudentCount) * PRICE_PER_STUDENT;
  return `${amount.toLocaleString('tr-TR')} ₺`;
}

const AVATAR_TONES = ['#C72C79', '#7C3AED', '#0EA5E9', '#059669', '#D97706', '#E11D48'];

function getTodayAndTomorrowKeys(anchor = new Date()) {
  const today = startOfDay(anchor);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return {
    todayKey: toDateKey(today),
    tomorrowKey: toDateKey(tomorrow),
  };
}

function completionTone(percent: number): CompletionTone {
  if (percent >= 100) return 'ok';
  if (percent >= 50) return 'warn';
  return 'bad';
}

function buildStudentStatus(
  todayTasks: StudentTask[],
  tomorrowTasks: StudentTask[],
): StudentStatus {
  const tomorrowReady = tomorrowTasks.length > 0;
  if (todayTasks.length === 0) {
    return { tomorrowReady, todayPercent: null, todayTone: 'muted' };
  }
  const todayPercent = computeCompletionPercent(todayTasks) ?? 0;
  return {
    tomorrowReady,
    todayPercent,
    todayTone: completionTone(todayPercent),
  };
}

function buildStatusMap(
  studentIds: string[],
  tasksByStudent: Record<string, Record<string, StudentTask[]>>,
  todayKey: string,
  tomorrowKey: string,
): Record<string, StudentStatus> {
  const next: Record<string, StudentStatus> = {};
  for (const studentId of studentIds) {
    const byDate = tasksByStudent[studentId] ?? {};
    next[studentId] = buildStudentStatus(byDate[todayKey] ?? [], byDate[tomorrowKey] ?? []);
  }
  return next;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function avatarTone(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i) * (i + 1)) % 997;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

type StudentWeekSnapshot = {
  tasksByDate: Record<string, StudentTask[]>;
  submissionsByDate: Record<string, DailySubmission>;
  adminNotesByDate: Record<string, string>;
  meetingsByDate: Record<string, StudentMeeting>;
};

function weekCacheKey(studentId: string, weekFrom: string, weekTo: string): string {
  return `${studentId}|${weekFrom}|${weekTo}`;
}

function emptyWeekSnapshot(): StudentWeekSnapshot {
  return {
    tasksByDate: {},
    submissionsByDate: {},
    adminNotesByDate: {},
    meetingsByDate: {},
  };
}

function sortDenemesNewestFirst(entries: DenemeEntry[]): DenemeEntry[] {
  return [...entries].sort((a, b) => {
    if (a.denemeDate !== b.denemeDate) return a.denemeDate < b.denemeDate ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

const bootSpin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const BootScreen = styled.div`
  flex: 1;
  width: 100%;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 32px 20px;
  box-sizing: border-box;
`;

const BootSpinner = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 3px solid rgba(148, 163, 184, 0.22);
  border-top-color: rgba(96, 165, 250, 0.95);
  animation: ${bootSpin} 0.75s linear infinite;
`;

const BootTitle = styled.h1`
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: ${t.text};
`;

const BootSub = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${t.muted};
  text-align: center;
`;

const BootTrack = styled.div`
  width: min(320px, 100%);
  height: 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid ${t.border};
  overflow: hidden;
`;

const BootFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => `${Math.max(0, Math.min(100, $pct))}%`};
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.85), rgba(96, 165, 250, 0.95));
  transition: width 0.25s ease;
`;

const BootPercent = styled.span`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${t.mutedSoft};
`;

const DenemeContentCard = styled(ContentCard)`
  /* Match student-list bottom: sidebar height minus identity card + panel gap above. */
  height: calc((100dvh - 100px) * 0.95 - 152px);
  max-height: calc((100dvh - 100px) * 0.95 - 152px);
  overflow: hidden;
  box-sizing: border-box;

  @media (max-width: 960px) {
    height: auto;
    max-height: min(70vh, 640px);
  }
`;

const IdentityNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-wrap: wrap;
`;

const StudentExportButton = styled.button`
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(250, 204, 21, 0.55);
  background: rgba(250, 204, 21, 0.18);
  color: #facc15;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  cursor: pointer;

  &:hover {
    background: rgba(250, 204, 21, 0.28);
    border-color: rgba(250, 204, 21, 0.75);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export function AdminPreviewPage() {
  const { user, isLoading } = useAppAuth();
  const weekDays = useMemo(() => buildWeekDays(), []);
  const weekFrom = toDateKey(weekDays[0]);
  const weekTo = toDateKey(weekDays[weekDays.length - 1]);
  const { todayKey, tomorrowKey } = useMemo(() => getTodayAndTomorrowKeys(), []);
  const meetingAlertToKey = useMemo(() => addDaysToDateKey(todayKey, 2), [todayKey]);
  const weekCacheRef = useRef<Map<string, StudentWeekSnapshot>>(new Map());
  const skipRevalidateOnceRef = useRef(false);
  const extraDayCacheRef = useRef<Set<string>>(new Set());
  const bootstrappedKeyRef = useRef<string | null>(null);

  const [dayOffsetStart, setDayOffsetStart] = useState(-1 - ADMIN_DAY_PAD);
  const [dayOffsetEnd, setDayOffsetEnd] = useState(5 + ADMIN_DAY_PAD);
  const days = useMemo(
    () => buildDaysFromOffsets(dayOffsetStart, dayOffsetEnd),
    [dayOffsetStart, dayOffsetEnd],
  );
  const todayDayIndex = -dayOffsetStart;

  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [earningsStudentCount, setEarningsStudentCount] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(ADMIN_TODAY_INDEX);
  const [section, setSection] = useState<SectionId>('tasks');
  const [query, setQuery] = useState('');
  const [filterMissingTomorrow, setFilterMissingTomorrow] = useState(false);
  const [filterBelow50, setFilterBelow50] = useState(false);
  const [tasksByDate, setTasksByDate] = useState<Record<string, StudentTask[]>>({});
  const [submissionsByDate, setSubmissionsByDate] = useState<Record<string, DailySubmission>>({});
  const [adminNotesByDate, setAdminNotesByDate] = useState<Record<string, string>>({});
  const [meetingsByDate, setMeetingsByDate] = useState<Record<string, StudentMeeting>>({});
  const [denemes, setDenemes] = useState<DenemeEntry[]>([]);
  const denemeCacheRef = useRef<Map<string, DenemeEntry[]>>(new Map());
  const [curriculumCatalog, setCurriculumCatalog] = useState<CurriculumCatalog>({
    subjects: [],
    materials: [],
  });
  const [curriculumByStudent, setCurriculumByStudent] = useState<
    Record<string, StudentCurriculumState>
  >({});
  const [studentsWithUpcomingMeeting, setStudentsWithUpcomingMeeting] = useState<Set<string>>(
    () => new Set(),
  );
  const [studentStatuses, setStudentStatuses] = useState<Record<string, StudentStatus>>({});
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [chatUnreadTotal, setChatUnreadTotal] = useState(0);

  const applyWeekSnapshot = useCallback((snapshot: StudentWeekSnapshot) => {
    setTasksByDate(snapshot.tasksByDate);
    setSubmissionsByDate(snapshot.submissionsByDate);
    setAdminNotesByDate(snapshot.adminNotesByDate);
    setMeetingsByDate(snapshot.meetingsByDate);
  }, []);

  const writeWeekCache = useCallback(
    (studentId: string, snapshot: StudentWeekSnapshot) => {
      weekCacheRef.current.set(weekCacheKey(studentId, weekFrom, weekTo), snapshot);
    },
    [weekFrom, weekTo],
  );

  const patchWeekCacheTasks = useCallback(
    (studentId: string, nextTasks: Record<string, StudentTask[]>) => {
      const key = weekCacheKey(studentId, weekFrom, weekTo);
      const cached = weekCacheRef.current.get(key);
      if (cached) {
        weekCacheRef.current.set(key, { ...cached, tasksByDate: nextTasks });
      }
    },
    [weekFrom, weekTo],
  );

  const patchWeekCacheNotes = useCallback(
    (studentId: string, nextNotes: Record<string, string>) => {
      const key = weekCacheKey(studentId, weekFrom, weekTo);
      const cached = weekCacheRef.current.get(key);
      if (cached) {
        weekCacheRef.current.set(key, { ...cached, adminNotesByDate: nextNotes });
      }
    },
    [weekFrom, weekTo],
  );

  const patchWeekCacheMeetings = useCallback(
    (studentId: string, nextMeetings: Record<string, StudentMeeting>) => {
      const key = weekCacheKey(studentId, weekFrom, weekTo);
      const cached = weekCacheRef.current.get(key);
      if (cached) {
        weekCacheRef.current.set(key, { ...cached, meetingsByDate: nextMeetings });
      }
    },
    [weekFrom, weekTo],
  );

  const refreshMeetingAlerts = useCallback(async () => {
    const ids = await fetchStudentIdsWithMeetingsInRange(todayKey, meetingAlertToKey);
    setStudentsWithUpcomingMeeting(ids);
  }, [todayKey, meetingAlertToKey]);

  const refreshStudentStatuses = useCallback(
    async (studentIds: string[]) => {
      if (studentIds.length === 0) {
        setStudentStatuses({});
        return;
      }
      const tasksByStudent = await fetchOrgTasksForDates([todayKey, tomorrowKey]);
      setStudentStatuses(buildStatusMap(studentIds, tasksByStudent, todayKey, tomorrowKey));
    },
    [todayKey, tomorrowKey],
  );

  const syncSelectedStudentStatus = useCallback(
    (studentId: string, nextTasksByDate: Record<string, StudentTask[]>) => {
      setStudentStatuses((current) => ({
        ...current,
        [studentId]: buildStudentStatus(
          nextTasksByDate[todayKey] ?? [],
          nextTasksByDate[tomorrowKey] ?? [],
        ),
      }));
    },
    [todayKey, tomorrowKey],
  );

  useEffect(() => {
    weekCacheRef.current.clear();
  }, [weekFrom, weekTo]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      if (!user) bootstrappedKeyRef.current = null;
      return;
    }

    const bootKey = `${user.id}|${weekFrom}|${weekTo}|${todayKey}`;
    if (bootstrappedKeyRef.current === bootKey) return;

    let isMounted = true;
    setIsBootstrapping(true);
    setBootProgress(4);
    setError('');
    weekCacheRef.current.clear();
    denemeCacheRef.current.clear();
    setDenemes([]);
    setCurriculumByStudent({});

    const bump = (value: number) => {
      if (isMounted) setBootProgress((current) => Math.max(current, value));
    };

    const bootstrap = async () => {
      try {
        const [rows, catalog, earningsCount] = await Promise.all([
          fetchStudents(),
          fetchCurriculumCatalog(),
          fetchEarningsStudentCount(),
        ]);
        if (!isMounted) return;
        bump(18);
        setStudents(rows);
        setCurriculumCatalog(catalog);
        setEarningsStudentCount(earningsCount);

        const studentIds = rows.map((row) => row.id);
        const advancePerQuery = 16;
        let completedQueries = 0;
        const track = async <T,>(promise: Promise<T>): Promise<T> => {
          const result = await promise;
          completedQueries += 1;
          bump(18 + completedQueries * advancePerQuery);
          return result;
        };

        const [tasksByStudent, submissionsByStudent, notesByStudent, meetingsByStudent, meetingAlertIds] =
          await Promise.all([
            track(fetchOrgTasksForRange(weekFrom, weekTo)),
            track(fetchOrgSubmissionsForRange(weekFrom, weekTo)),
            track(fetchOrgAdminNotesForRange(weekFrom, weekTo)),
            track(fetchOrgMeetingsForRange(weekFrom, weekTo)),
            track(fetchStudentIdsWithMeetingsInRange(todayKey, meetingAlertToKey)),
          ]);

        if (!isMounted) return;
        bump(92);

        for (const student of rows) {
          writeWeekCache(student.id, {
            tasksByDate: tasksByStudent[student.id] ?? {},
            submissionsByDate: submissionsByStudent[student.id] ?? {},
            adminNotesByDate: notesByStudent[student.id] ?? {},
            meetingsByDate: meetingsByStudent[student.id] ?? {},
          });
        }

        setStudentStatuses(buildStatusMap(studentIds, tasksByStudent, todayKey, tomorrowKey));
        setStudentsWithUpcomingMeeting(meetingAlertIds);

        const firstId = rows[0]?.id ?? '';
        if (firstId) {
          const firstSnap =
            weekCacheRef.current.get(weekCacheKey(firstId, weekFrom, weekTo)) ??
            emptyWeekSnapshot();
          applyWeekSnapshot(firstSnap);
          skipRevalidateOnceRef.current = true;
          setSelectedStudentId(firstId);
        } else {
          setSelectedStudentId('');
        }

        bump(100);
        bootstrappedKeyRef.current = bootKey;
      } catch {
        if (isMounted) setError('Admin paneli yüklenemedi.');
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
          setIsPageLoading(false);
        }
      }
    };

    void bootstrap();
    return () => {
      isMounted = false;
    };
  }, [
    user,
    weekFrom,
    weekTo,
    todayKey,
    tomorrowKey,
    meetingAlertToKey,
    writeWeekCache,
    applyWeekSnapshot,
  ]);

  useEffect(() => {
    if (isBootstrapping || !user || user.role !== 'admin') return;
    let mounted = true;
    void (async () => {
      try {
        const count = await fetchEarningsStudentCount();
        if (mounted) setEarningsStudentCount(count);
      } catch {
        // Keep last known earnings count on refresh failure.
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isBootstrapping, user]);

  useEffect(() => {
    if (isBootstrapping || !selectedStudentId) return;

    let isMounted = true;
    const studentId = selectedStudentId;
    const cacheKey = weekCacheKey(studentId, weekFrom, weekTo);
    const cached = weekCacheRef.current.get(cacheKey);

    setError('');
    setSection('tasks');

    const cachedDenemes = denemeCacheRef.current.get(studentId);
    if (cachedDenemes) {
      setDenemes(cachedDenemes);
    } else {
      setDenemes([]);
    }

    const ensureCurriculum = async () => {
      setCurriculumByStudent((current) => {
        if (current[studentId]) return current;
        void (async () => {
          try {
            const curriculum = await fetchStudentCurriculumState(studentId);
            if (!isMounted) return;
            setCurriculumByStudent((prev) =>
              prev[studentId] ? prev : { ...prev, [studentId]: curriculum },
            );
          } catch {
            if (isMounted) setError('Konu & materyal verileri yüklenemedi.');
          }
        })();
        return current;
      });
    };
    void ensureCurriculum();

    if (cached) {
      applyWeekSnapshot(cached);
      syncSelectedStudentStatus(studentId, cached.tasksByDate);
      setIsPageLoading(false);
      if (skipRevalidateOnceRef.current) {
        skipRevalidateOnceRef.current = false;
        if (cachedDenemes) return;

        const loadDenemesOnly = async () => {
          try {
            const studentDenemes = await fetchDenemesForStudent(studentId);
            if (!isMounted) return;
            denemeCacheRef.current.set(studentId, studentDenemes);
            setDenemes(studentDenemes);
          } catch {
            if (isMounted) setError('Deneme kayıtları yüklenemedi.');
          }
        };
        void loadDenemesOnly();
        return;
      }
    } else {
      setIsPageLoading(true);
      setTasksByDate({});
      setSubmissionsByDate({});
      setAdminNotesByDate({});
      setMeetingsByDate({});
    }

    const loadStudentWeek = async () => {
      try {
        const [tasks, submissions, adminNotes, meetings, studentDenemes] = await Promise.all([
          fetchTasksForRange(studentId, weekFrom, weekTo),
          fetchSubmissionsForRange(studentId, weekFrom, weekTo),
          fetchAdminNotesForRange(studentId, weekFrom, weekTo),
          fetchMeetingsForRange(studentId, weekFrom, weekTo),
          fetchDenemesForStudent(studentId),
        ]);
        if (!isMounted) return;
        const snapshot: StudentWeekSnapshot = {
          tasksByDate: tasks,
          submissionsByDate: submissions,
          adminNotesByDate: adminNotes,
          meetingsByDate: meetings,
        };
        writeWeekCache(studentId, snapshot);
        applyWeekSnapshot(snapshot);
        denemeCacheRef.current.set(studentId, studentDenemes);
        setDenemes(studentDenemes);
        syncSelectedStudentStatus(studentId, tasks);
      } catch {
        if (isMounted) setError('Öğrenci verileri yüklenemedi.');
      } finally {
        if (isMounted) setIsPageLoading(false);
      }
    };

    void loadStudentWeek();
    return () => {
      isMounted = false;
    };
  }, [
    isBootstrapping,
    selectedStudentId,
    weekFrom,
    weekTo,
    syncSelectedStudentStatus,
    applyWeekSnapshot,
    writeWeekCache,
  ]);

  const expandPastDays = useCallback(() => {
    setDayOffsetStart((current) => current - ADMIN_DAY_CHUNK);
    setSelectedDayIndex((current) => current + ADMIN_DAY_CHUNK);
  }, []);

  const expandFutureDays = useCallback(() => {
    setDayOffsetEnd((current) => current + ADMIN_DAY_CHUNK);
  }, []);

  useEffect(() => {
    extraDayCacheRef.current.clear();
  }, [selectedStudentId]);

  useEffect(() => {
    if (isBootstrapping || !selectedStudentId) return;
    const date = days[selectedDayIndex];
    if (!date) return;
    const dateKey = toDateKey(date);
    if (dateKey >= weekFrom && dateKey <= weekTo) return;

    const cacheKey = `${selectedStudentId}|${dateKey}`;
    if (extraDayCacheRef.current.has(cacheKey)) return;
    extraDayCacheRef.current.add(cacheKey);

    let isMounted = true;
    void (async () => {
      try {
        const [tasks, submissions, adminNotes, meetings] = await Promise.all([
          fetchTasksForRange(selectedStudentId, dateKey, dateKey),
          fetchSubmissionsForRange(selectedStudentId, dateKey, dateKey),
          fetchAdminNotesForRange(selectedStudentId, dateKey, dateKey),
          fetchMeetingsForRange(selectedStudentId, dateKey, dateKey),
        ]);
        if (!isMounted) return;
        setTasksByDate((current) => ({
          ...current,
          [dateKey]: tasks[dateKey] ?? [],
        }));
        setSubmissionsByDate((current) => {
          if (!submissions[dateKey]) return current;
          return { ...current, [dateKey]: submissions[dateKey] };
        });
        setAdminNotesByDate((current) => {
          if (adminNotes[dateKey] === undefined) return current;
          return { ...current, [dateKey]: adminNotes[dateKey] };
        });
        setMeetingsByDate((current) => {
          if (!meetings[dateKey]) return current;
          return { ...current, [dateKey]: meetings[dateKey] };
        });
      } catch {
        extraDayCacheRef.current.delete(cacheKey);
        if (isMounted) setError('Gün verileri yüklenemedi.');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [
    isBootstrapping,
    selectedStudentId,
    selectedDayIndex,
    days,
    weekFrom,
    weekTo,
  ]);

  useEffect(() => {
    if (!user || user.role !== 'admin' || !user.organizationId) return;

    let mounted = true;
    const refreshUnread = () => {
      void fetchAdminChatUnreadTotal()
        .then((total) => {
          if (mounted) setChatUnreadTotal(total);
        })
        .catch(() => {
          /* inbox migration may not be applied yet */
        });
    };

    refreshUnread();
    const unsubscribe = subscribeAdminChatInbox(user.organizationId, () => {
      refreshUnread();
    });

    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshUnread();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      mounted = false;
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'admin' || !user.organizationId) return;

    let statusTimer: number | undefined;
    const studentIds = students.map((row) => row.id);

    const unsubscribe = subscribeDailyTasks({ organizationId: user.organizationId }, (change) => {
      if (selectedStudentId && change.studentId === selectedStudentId) {
        setTasksByDate((current) => {
          const next = applyDailyTaskChange(current, change, weekFrom, weekTo);
          patchWeekCacheTasks(selectedStudentId, next);
          syncSelectedStudentStatus(selectedStudentId, next);
          return next;
        });
      }

      if (change.dateKey === todayKey || change.dateKey === tomorrowKey) {
        window.clearTimeout(statusTimer);
        statusTimer = window.setTimeout(() => {
          void refreshStudentStatuses(studentIds).catch(() => {});
        }, 250);
      }
    });

    return () => {
      window.clearTimeout(statusTimer);
      unsubscribe();
    };
  }, [
    user,
    students,
    selectedStudentId,
    weekFrom,
    weekTo,
    todayKey,
    tomorrowKey,
    syncSelectedStudentStatus,
    refreshStudentStatuses,
    patchWeekCacheTasks,
  ]);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    const list = students.filter((s) => {
      if (q && !s.name.toLocaleLowerCase('tr').includes(q)) return false;
      const status = studentStatuses[s.id];
      if (filterMissingTomorrow && status?.tomorrowReady) return false;
      if (filterBelow50) {
        const percent = status?.todayPercent;
        if (percent === null || percent === undefined || percent >= 50) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      const aStatus = studentStatuses[a.id];
      const bStatus = studentStatuses[b.id];
      const aNeeds =
        !aStatus?.tomorrowReady ||
        aStatus.todayTone === 'bad' ||
        aStatus.todayPercent === null
          ? 0
          : 1;
      const bNeeds =
        !bStatus?.tomorrowReady ||
        bStatus.todayTone === 'bad' ||
        bStatus.todayPercent === null
          ? 0
          : 1;
      if (aNeeds !== bNeeds) return aNeeds - bNeeds;
      const aPercent = aStatus?.todayPercent;
      const bPercent = bStatus?.todayPercent;
      const aValue = aPercent === null || aPercent === undefined ? -1 : aPercent;
      const bValue = bPercent === null || bPercent === undefined ? -1 : bPercent;
      if (aValue !== bValue) return aValue - bValue;
      return a.name.localeCompare(b.name, 'tr');
    });
  }, [students, query, studentStatuses, filterMissingTomorrow, filterBelow50]);

  if (isLoading) {
    return (
      <PreviewShell>
        <PreviewFrame>
          <LoadingText>Yükleniyor...</LoadingText>
        </PreviewFrame>
      </PreviewShell>
    );
  }

  if (!user) {
    return <Navigate to="/app" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/app/student" replace />;
  }

  if (isBootstrapping) {
    return (
      <PreviewShell>
        <BootScreen>
          <BootSpinner aria-hidden />
          <BootTitle>Admin paneli hazırlanıyor</BootTitle>
          <BootSub>Tüm öğrenci verileri yükleniyor. Bu yalnızca ilk açılışta olur.</BootSub>
          <BootTrack>
            <BootFill $pct={bootProgress} />
          </BootTrack>
          <BootPercent>{Math.round(bootProgress)}%</BootPercent>
          {error ? <ErrorText>{error}</ErrorText> : null}
        </BootScreen>
      </PreviewShell>
    );
  }

  const selectedStudent = students.find((student) => student.id === selectedStudentId);
  const selectedDate = days[selectedDayIndex] ?? days[todayDayIndex];
  const selectedDateKey = toDateKey(selectedDate);
  const tasks = tasksByDate[selectedDateKey] ?? [];
  const submission = getSubmissionForDate(submissionsByDate, selectedDateKey);
  const adminNote = adminNotesByDate[selectedDateKey] ?? '';
  const selectedMeeting = meetingsByDate[selectedDateKey] ?? null;
  const isDayView = section === 'tasks' || section === 'form';
  const showDaySlider = isDayView;
  const showReturnToTasks = !isDayView;

  const handleAddTask = async (label: string, topicLinks: TaskTopicLink[] = []) => {
    if (!selectedStudent) return;
    try {
      const created = await createTask(
        selectedStudent.id,
        selectedDateKey,
        label,
        tasks.length,
        topicLinks,
      );
      setTasksByDate((current) => {
        const next = {
          ...current,
          [selectedDateKey]: [...(current[selectedDateKey] ?? []), created],
        };
        patchWeekCacheTasks(selectedStudent.id, next);
        syncSelectedStudentStatus(selectedStudent.id, next);
        return next;
      });
    } catch {
      setError('Görev eklenemedi.');
    }
  };

  const handleEditTask = async (taskId: string, label: string) => {
    if (!selectedStudent) return;
    try {
      const parsed = await updateTaskLabel(taskId, label);
      setTasksByDate((current) => {
        const next = {
          ...current,
          [selectedDateKey]: (current[selectedDateKey] ?? []).map((task) =>
            task.id === taskId
              ? { ...task, label: parsed.label, durationLabel: parsed.durationLabel }
              : task,
          ),
        };
        patchWeekCacheTasks(selectedStudent.id, next);
        syncSelectedStudentStatus(selectedStudent.id, next);
        return next;
      });
    } catch {
      setError('Görev güncellenemedi.');
    }
  };

  const handleUpdateTaskTopicLinks = async (taskId: string, topicLinks: TaskTopicLink[]) => {
    if (!selectedStudent) return;
    try {
      await updateTaskTopicLinks(taskId, topicLinks);
      setTasksByDate((current) => {
        const next = {
          ...current,
          [selectedDateKey]: (current[selectedDateKey] ?? []).map((task) =>
            task.id === taskId ? { ...task, topicLinks } : task,
          ),
        };
        patchWeekCacheTasks(selectedStudent.id, next);
        return next;
      });
    } catch {
      setError('Konu bağlantıları kaydedilemedi.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedStudent) return;
    try {
      await deleteTask(taskId);
      setTasksByDate((current) => {
        const next = {
          ...current,
          [selectedDateKey]: (current[selectedDateKey] ?? []).filter((task) => task.id !== taskId),
        };
        patchWeekCacheTasks(selectedStudent.id, next);
        syncSelectedStudentStatus(selectedStudent.id, next);
        return next;
      });
    } catch {
      setError('Görev silinemedi.');
    }
  };

  const handleSaveAdminNote = async (body: string) => {
    if (!selectedStudent) return;
    await upsertAdminNote(selectedStudent.id, selectedDateKey, body);
    setAdminNotesByDate((current) => {
      const next = { ...current, [selectedDateKey]: body };
      patchWeekCacheNotes(selectedStudent.id, next);
      return next;
    });
  };

  const handleSaveMeeting = async (input: {
    meetingDate: string;
    meetingTime: string;
    meetingLink: string;
  }) => {
    if (!selectedStudent) return;
    if (selectedMeeting && selectedMeeting.meetingDate !== input.meetingDate) {
      await deleteMeeting(selectedMeeting.id);
    }
    const saved = await upsertMeeting({
      studentId: selectedStudent.id,
      meetingDate: input.meetingDate,
      meetingTime: input.meetingTime,
      meetingLink: input.meetingLink,
    });
    setMeetingsByDate((current) => {
      const next = { ...current };
      if (selectedMeeting && selectedMeeting.meetingDate !== saved.meetingDate) {
        delete next[selectedMeeting.meetingDate];
      }
      next[saved.meetingDate] = saved;
      patchWeekCacheMeetings(selectedStudent.id, next);
      return next;
    });
    await refreshMeetingAlerts();
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!selectedStudent) return;
    await deleteMeeting(meetingId);
    setMeetingsByDate((current) => {
      const next = { ...current };
      for (const [dateKey, meeting] of Object.entries(next)) {
        if (meeting.id === meetingId) delete next[dateKey];
      }
      patchWeekCacheMeetings(selectedStudent.id, next);
      return next;
    });
    await refreshMeetingAlerts();
  };

  const upsertDenemeInState = (entry: DenemeEntry) => {
    if (!selectedStudent) return;
    setDenemes((current) => {
      const next = sortDenemesNewestFirst([
        entry,
        ...current.filter((item) => item.id !== entry.id),
      ]);
      denemeCacheRef.current.set(selectedStudent.id, next);
      return next;
    });
  };

  const handleCreateDeneme = async (input: DenemeEntryInput) => {
    if (!selectedStudent || !user) return;
    const created = await createDenemeEntry(selectedStudent.id, input, user.id);
    upsertDenemeInState(created);
  };

  const handleUpdateDeneme = async (id: string, input: DenemeEntryInput) => {
    if (!selectedStudent) return;
    const updated = await updateDenemeEntry(id, input);
    upsertDenemeInState(updated);
  };

  const handleDeleteDeneme = async (id: string) => {
    if (!selectedStudent) return;
    await deleteDenemeEntry(id);
    setDenemes((current) => {
      const next = current.filter((item) => item.id !== id);
      denemeCacheRef.current.set(selectedStudent.id, next);
      return next;
    });
  };

  const emptyCurriculum = (): StudentCurriculumState => ({
    subjectIds: [],
    materialIds: [],
    subjectProgress: [],
    materialProgress: [],
  });

  const patchCurriculum = (
    studentId: string,
    patch: (current: StudentCurriculumState) => StudentCurriculumState,
  ) => {
    setCurriculumByStudent((current) => {
      const base = current[studentId] ?? emptyCurriculum();
      return { ...current, [studentId]: patch(base) };
    });
  };

  const handleEnrollSubject = async (subjectId: string) => {
    if (!selectedStudent) return;
    await enrollStudentSubject(selectedStudent.id, subjectId);
    patchCurriculum(selectedStudent.id, (cur) => ({
      ...cur,
      subjectIds: cur.subjectIds.includes(subjectId)
        ? cur.subjectIds
        : [...cur.subjectIds, subjectId],
    }));
  };

  const handleUnenrollSubject = async (subjectId: string) => {
    if (!selectedStudent) return;
    await unenrollStudentSubject(selectedStudent.id, subjectId);
    patchCurriculum(selectedStudent.id, (cur) => ({
      ...cur,
      subjectIds: cur.subjectIds.filter((id) => id !== subjectId),
    }));
  };

  const handleEnrollMaterial = async (materialId: string) => {
    if (!selectedStudent) return;
    await enrollStudentMaterial(selectedStudent.id, materialId);
    patchCurriculum(selectedStudent.id, (cur) => ({
      ...cur,
      materialIds: cur.materialIds.includes(materialId)
        ? cur.materialIds
        : [...cur.materialIds, materialId],
    }));
  };

  const handleUnenrollMaterial = async (materialId: string) => {
    if (!selectedStudent) return;
    await unenrollStudentMaterial(selectedStudent.id, materialId);
    patchCurriculum(selectedStudent.id, (cur) => ({
      ...cur,
      materialIds: cur.materialIds.filter((id) => id !== materialId),
    }));
  };

  const handleUpdateSubjectTopic = async (topicId: string, status: TopicStatus) => {
    if (!selectedStudent) return;
    await upsertSubjectTopicProgress(selectedStudent.id, topicId, status);
    const subjectId =
      curriculumCatalog.subjects.find((s) => s.topics.some((topic) => topic.id === topicId))?.id ??
      '';
    patchCurriculum(selectedStudent.id, (cur) => {
      const others = cur.subjectProgress.filter((row) => row.topicId !== topicId);
      return {
        ...cur,
        subjectProgress: [...others, { topicId, subjectId, status }],
      };
    });
  };

  const handleUpdateMaterialTopic = async (
    topicId: string,
    input: {
      status: TopicStatus;
      correctCount: number | null;
      questionCount: number | null;
    },
  ) => {
    if (!selectedStudent) return;
    await upsertMaterialTopicProgress(selectedStudent.id, topicId, input);
    const materialId =
      curriculumCatalog.materials.find((m) => m.topics.some((topic) => topic.id === topicId))?.id ??
      '';
    patchCurriculum(selectedStudent.id, (cur) => {
      const others = cur.materialProgress.filter((row) => row.topicId !== topicId);
      return {
        ...cur,
        materialProgress: [
          ...others,
          {
            topicId,
            materialId,
            status: input.status,
            correctCount: input.correctCount,
            questionCount: input.questionCount,
          },
        ],
      };
    });
  };

  const handleExportStudent = async () => {
    if (!selectedStudent) return;

    setIsExporting(true);
    setError('');
    try {
      const data = await exportStudentJson(selectedStudent.id);
      downloadJson(`${selectedStudent.name}-export.json`, data);
    } catch {
      setError('Öğrenci dışa aktarımı başarısız.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportOrganization = async () => {
    setIsExporting(true);
    setError('');
    try {
      const data = await exportOrganizationJson();
      downloadJson('organization-export.json', data);
    } catch {
      setError('Kurum dışa aktarımı başarısız.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PreviewShell>
      <PreviewTopBar>
        <TopBarTitle>Admin Paneli</TopBarTitle>
        <TopBarActions>
          <ChatGlowButton as={Link} to="/app/admin/chat" $active={chatUnreadTotal > 0}>
            Sohbet
            <ChatUnreadBadge
              $active={chatUnreadTotal > 0}
              aria-label={
                chatUnreadTotal === 0
                  ? 'Okunmamış sohbet yok'
                  : `${chatUnreadTotal} öğrencide okunmamış mesaj`
              }
            >
              {chatUnreadTotal > 99 ? '99+' : chatUnreadTotal}
            </ChatUnreadBadge>
          </ChatGlowButton>
        </TopBarActions>
        <TopBarEnd>
          <TopBarIconButton
            type="button"
            disabled={isExporting}
            title="Tümünü dışarı aktar"
            aria-label="Tümünü dışarı aktar"
            onClick={() => void handleExportOrganization()}
          >
            <Download size={16} strokeWidth={2.4} />
          </TopBarIconButton>
          <TopBarIconButton
            as={Link}
            to="/app/admin/library"
            title="Kütüphane"
            aria-label="Kütüphane"
          >
            <Library size={16} strokeWidth={2.4} />
          </TopBarIconButton>
          <TopBarIconButton
            as={Link}
            to="/app/admin/tea"
            title="Görev analizi"
            aria-label="Görev analizi"
          >
            <Table2 size={16} strokeWidth={2.4} />
          </TopBarIconButton>
          <TopBarIconButton
            as={Link}
            to="/app/admin/settings"
            title="Ayarlar"
            aria-label="Ayarlar"
          >
            <Settings size={16} strokeWidth={2.4} />
          </TopBarIconButton>
          <EarningsBadge title="Aylık kazanç = kazanca dahil öğrenci sayısı × 5000 ₺">
            <LiveDotWrap aria-hidden>
              <LiveDotPulse />
              <LiveDotCore />
            </LiveDotWrap>
            <EarningsAmount>{formatMonthlyEarnings(earningsStudentCount)}</EarningsAmount>
          </EarningsBadge>
        </TopBarEnd>
      </PreviewTopBar>

      <PreviewBody>
      <PreviewFrame>
        {error ? <ErrorText>{error}</ErrorText> : null}

        <DashboardGrid>
          <Sidebar>
            <SidebarHead>
              <SidebarTitle>Öğrenciler</SidebarTitle>
              <CountBadge>{filteredStudents.length}</CountBadge>
            </SidebarHead>
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Öğrenci ara..."
              aria-label="Öğrenci ara"
            />
            <FilterRow>
              <FilterChip
                type="button"
                $active={filterMissingTomorrow}
                onClick={() => setFilterMissingTomorrow((current) => !current)}
              >
                Yarın ?
              </FilterChip>
              <FilterChip
                type="button"
                $active={filterBelow50}
                onClick={() => setFilterBelow50((current) => !current)}
              >
                %50 ?
              </FilterChip>
            </FilterRow>
            <StudentListScroll>
              {filteredStudents.map((student) => {
                const status = studentStatuses[student.id];
                const tomorrowReady = status?.tomorrowReady ?? false;
                const todayTone = status?.todayTone ?? 'muted';
                const todayLabel =
                  status?.todayPercent === null || status?.todayPercent === undefined
                    ? '—'
                    : `${status.todayPercent}%`;

                return (
                  <StudentCardButton
                    key={student.id}
                    type="button"
                    $selected={student.id === selectedStudentId}
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    <StudentName>{student.name}</StudentName>
                    <PillRow>
                      <StatusChip $ready={tomorrowReady}>
                        Yarın {tomorrowReady ? '✅' : '❌'}
                      </StatusChip>
                      <StatusChip $tone={todayTone}>{todayLabel}</StatusChip>
                      {studentsWithUpcomingMeeting.has(student.id) ? (
                        <MeetingAlertPill title="Yaklaşan görüşme" aria-label="Yaklaşan görüşme">
                          <Video size={13} strokeWidth={2.4} />
                        </MeetingAlertPill>
                      ) : null}
                    </PillRow>
                  </StudentCardButton>
                );
              })}
              {filteredStudents.length === 0 && !isPageLoading ? (
                <EmptyState>Öğrenci bulunamadı.</EmptyState>
              ) : null}
            </StudentListScroll>
          </Sidebar>

          <MainPanel>
            {selectedStudent ? (
              <>
                <IdentityCard>
                  <IdentityTop>
                    <IdentityLeft>
                      <Avatar
                        $tone={avatarTone(selectedStudent.id)}
                        style={{ width: 52, height: 52, borderRadius: 18 }}
                      >
                        {initials(selectedStudent.name)}
                      </Avatar>
                      <IdentityNameRow>
                        <IdentityTitle>{selectedStudent.name}</IdentityTitle>
                        <StudentExportButton
                          type="button"
                          disabled={isExporting}
                          onClick={() => void handleExportStudent()}
                          title="Öğrenci verilerini JSON olarak dışa aktar"
                        >
                          JSON
                        </StudentExportButton>
                      </IdentityNameRow>
                    </IdentityLeft>
                    {showReturnToTasks ? (
                      <AccentButton type="button" onClick={() => setSection('tasks')}>
                        Görevlere dön
                      </AccentButton>
                    ) : null}
                  </IdentityTop>
                  <IdentityNav>
                    {PROFILE_SECTIONS.map((item) => (
                      <IdentityNavButton
                        key={item.id}
                        type="button"
                        $active={section === item.id}
                        onClick={() => setSection(item.id)}
                      >
                        {item.label}
                      </IdentityNavButton>
                    ))}
                  </IdentityNav>
                </IdentityCard>

                {showDaySlider ? (
                  <>
                    <PreviewDaySlider
                      days={days}
                      selectedIndex={selectedDayIndex}
                      onSelect={setSelectedDayIndex}
                      todayIndex={todayDayIndex}
                      extendable
                      onNearStart={expandPastDays}
                      onNearEnd={expandFutureDays}
                    />

                    {isDayView ? (
                      <SectionPillRow>
                        {DAY_SECTIONS.map((item) => (
                          <SectionPill
                            key={item.id}
                            type="button"
                            $active={section === item.id}
                            onClick={() => setSection(item.id)}
                          >
                            {item.label}
                          </SectionPill>
                        ))}
                      </SectionPillRow>
                    ) : null}
                  </>
                ) : null}

                {isPageLoading ? <LoadingText>Yükleniyor...</LoadingText> : null}

                {section === 'tasks' ? (
                  <PreviewTasksSection
                    tasks={tasks}
                    catalog={curriculumCatalog}
                    enrolledSubjectIds={
                      curriculumByStudent[selectedStudent.id]?.subjectIds ?? []
                    }
                    enrolledMaterialIds={
                      curriculumByStudent[selectedStudent.id]?.materialIds ?? []
                    }
                    subjectProgress={
                      curriculumByStudent[selectedStudent.id]?.subjectProgress ?? []
                    }
                    materialProgress={
                      curriculumByStudent[selectedStudent.id]?.materialProgress ?? []
                    }
                    onAdd={handleAddTask}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onUpdateTopicLinks={handleUpdateTaskTopicLinks}
                  />
                ) : null}

                {section === 'form' ? (
                  <PreviewFormSection
                    submission={submission}
                    meeting={selectedMeeting}
                    preferredDateKey={selectedDateKey}
                    onSaveMeeting={handleSaveMeeting}
                    onDeleteMeeting={handleDeleteMeeting}
                  />
                ) : null}

                {section === 'topics' ? (
                  <KonuMateryalPanel
                    catalog={curriculumCatalog}
                    state={
                      curriculumByStudent[selectedStudent.id] ?? {
                        subjectIds: [],
                        materialIds: [],
                        subjectProgress: [],
                        materialProgress: [],
                      }
                    }
                    denemes={denemes}
                    canEnroll
                    onEnrollSubject={handleEnrollSubject}
                    onUnenrollSubject={handleUnenrollSubject}
                    onEnrollMaterial={handleEnrollMaterial}
                    onUnenrollMaterial={handleUnenrollMaterial}
                    onUpdateSubjectTopic={handleUpdateSubjectTopic}
                    onUpdateMaterialTopic={handleUpdateMaterialTopic}
                  />
                ) : null}

                {section === 'exams' ? (
                  <DenemeContentCard>
                    <DenemePanel
                      key={selectedStudent.id}
                      entries={denemes}
                      onCreate={handleCreateDeneme}
                      onUpdate={handleUpdateDeneme}
                      onDelete={handleDeleteDeneme}
                    />
                  </DenemeContentCard>
                ) : null}

                {section === 'notes' ? (
                  <ContentCard>
                    <CoachNotesSection studentName={selectedStudent.name} />
                  </ContentCard>
                ) : null}
              </>
            ) : (
              <ContentCard>
                <EmptyState>Sol listeden bir öğrenci seç.</EmptyState>
              </ContentCard>
            )}
          </MainPanel>
        </DashboardGrid>
      </PreviewFrame>

      {section === 'tasks' && selectedStudent ? (
        <PreviewDayNoteRail
          key={`${selectedStudent.id}-${selectedDateKey}`}
          dayNote={adminNote}
          onSaveDayNote={handleSaveAdminNote}
        />
      ) : null}
      </PreviewBody>
    </PreviewShell>
  );
}
