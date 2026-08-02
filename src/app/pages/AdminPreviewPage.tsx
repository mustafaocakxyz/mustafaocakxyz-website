import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Video } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  applyDailyTaskChange,
  createTask,
  deleteMeeting,
  deleteTask,
  exportOrganizationJson,
  fetchOrgAdminNotesForRange,
  fetchOrgMeetingsForRange,
  fetchOrgSubmissionsForRange,
  fetchOrgTasksForDates,
  fetchOrgTasksForRange,
  fetchStudentIdsWithMeetingsInRange,
  fetchStudents,
  fetchSubmissionsForRange,
  fetchTasksForRange,
  fetchAdminNotesForRange,
  fetchMeetingsForRange,
  getSubmissionForDate,
  subscribeDailyTasks,
  updateTaskLabel,
  upsertAdminNote,
  upsertMeeting,
} from '../api/appData';
import { useAppAuth } from '../AppAuthContext';
import type { DailySubmission, StudentMeeting, StudentSummary, StudentTask } from '../types';
import {
  addDaysToDateKey,
  buildWeekDays,
  startOfDay,
  toDateKey,
} from '../utils/dates';
import { downloadJson } from '../utils/download';
import { computeCompletionPercent } from '../utils/taskLabel';
import {
  CoachNotesSection,
  DenemeSection,
  KonuMateryalSection,
} from '../preview/AdminPreviewSections';
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
  TopBarActions,
  TopBarButton,
  TopBarEnd,
  TopBarTitle,
} from '../preview/AdminPreviewUi';
import { preview as t } from '../preview/adminPreviewTheme';

const TODAY_INDEX = 1;

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
  { id: 'exams', label: 'Deneme' },
  { id: 'notes', label: 'Notlar' },
];

const PRICE_PER_STUDENT = 5000;
const FREE_TRIAL_OFFSET = 2;

function formatMonthlyEarnings(activeStudentCount: number): string {
  const paying = Math.max(0, activeStudentCount - FREE_TRIAL_OFFSET);
  const amount = paying * PRICE_PER_STUDENT;
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

export function AdminPreviewPage() {
  const { user, isLoading, logout } = useAppAuth();
  const weekDays = useMemo(() => buildWeekDays(), []);
  const weekFrom = toDateKey(weekDays[0]);
  const weekTo = toDateKey(weekDays[weekDays.length - 1]);
  const { todayKey, tomorrowKey } = useMemo(() => getTodayAndTomorrowKeys(), []);
  const meetingAlertToKey = useMemo(() => addDaysToDateKey(todayKey, 2), [todayKey]);
  const weekCacheRef = useRef<Map<string, StudentWeekSnapshot>>(new Map());
  const skipRevalidateOnceRef = useRef(false);

  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(TODAY_INDEX);
  const [section, setSection] = useState<SectionId>('tasks');
  const [query, setQuery] = useState('');
  const [filterMissingTomorrow, setFilterMissingTomorrow] = useState(false);
  const [filterBelow50, setFilterBelow50] = useState(false);
  const [tasksByDate, setTasksByDate] = useState<Record<string, StudentTask[]>>({});
  const [submissionsByDate, setSubmissionsByDate] = useState<Record<string, DailySubmission>>({});
  const [adminNotesByDate, setAdminNotesByDate] = useState<Record<string, string>>({});
  const [meetingsByDate, setMeetingsByDate] = useState<Record<string, StudentMeeting>>({});
  const [studentsWithUpcomingMeeting, setStudentsWithUpcomingMeeting] = useState<Set<string>>(
    () => new Set(),
  );
  const [studentStatuses, setStudentStatuses] = useState<Record<string, StudentStatus>>({});
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

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
    if (!user || user.role !== 'admin') return;

    let isMounted = true;
    setIsBootstrapping(true);
    setBootProgress(4);
    setError('');
    weekCacheRef.current.clear();

    const bump = (value: number) => {
      if (isMounted) setBootProgress((current) => Math.max(current, value));
    };

    const bootstrap = async () => {
      try {
        const rows = await fetchStudents();
        if (!isMounted) return;
        bump(18);
        setStudents(rows);

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
    if (isBootstrapping || !selectedStudentId) return;

    let isMounted = true;
    const studentId = selectedStudentId;
    const cacheKey = weekCacheKey(studentId, weekFrom, weekTo);
    const cached = weekCacheRef.current.get(cacheKey);

    setError('');
    setSection('tasks');

    if (cached) {
      applyWeekSnapshot(cached);
      syncSelectedStudentStatus(studentId, cached.tasksByDate);
      setIsPageLoading(false);
      if (skipRevalidateOnceRef.current) {
        skipRevalidateOnceRef.current = false;
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
        const [tasks, submissions, adminNotes, meetings] = await Promise.all([
          fetchTasksForRange(studentId, weekFrom, weekTo),
          fetchSubmissionsForRange(studentId, weekFrom, weekTo),
          fetchAdminNotesForRange(studentId, weekFrom, weekTo),
          fetchMeetingsForRange(studentId, weekFrom, weekTo),
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
  const selectedDate = weekDays[selectedDayIndex];
  const selectedDateKey = toDateKey(selectedDate);
  const tasks = tasksByDate[selectedDateKey] ?? [];
  const submission = getSubmissionForDate(submissionsByDate, selectedDateKey);
  const adminNote = adminNotesByDate[selectedDateKey] ?? '';
  const selectedMeeting = meetingsByDate[selectedDateKey] ?? null;
  const isDayView = section === 'tasks' || section === 'form';

  const handleAddTask = async (label: string) => {
    if (!selectedStudent) return;
    try {
      const created = await createTask(
        selectedStudent.id,
        selectedDateKey,
        label,
        tasks.length,
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
          <ChatGlowButton as={Link} to="/app/admin/chat">
            Sohbet
          </ChatGlowButton>
        </TopBarActions>
        <TopBarEnd>
          <TopBarButton as={Link} to="/app/admin/showcase">
            Vitrin Düzenle
          </TopBarButton>
          <TopBarButton
            type="button"
            disabled={isExporting}
            onClick={() => void handleExportOrganization()}
          >
            Tümünü Dışarı Aktar
          </TopBarButton>
          <TopBarButton
            type="button"
            onClick={() => {
              void logout();
            }}
          >
            Çıkış Yap
          </TopBarButton>
          <EarningsBadge title="Aylık kazanç = (aktif öğrenci − 2) × 5000">
            <LiveDotWrap aria-hidden>
              <LiveDotPulse />
              <LiveDotCore />
            </LiveDotWrap>
            <EarningsAmount>{formatMonthlyEarnings(students.length)}</EarningsAmount>
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
                      <IdentityTitle>{selectedStudent.name}</IdentityTitle>
                    </IdentityLeft>
                    {!isDayView ? (
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

                {isDayView ? (
                  <>
                    <PreviewDaySlider
                      days={weekDays}
                      selectedIndex={selectedDayIndex}
                      onSelect={setSelectedDayIndex}
                    />

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
                  </>
                ) : null}

                {isPageLoading ? <LoadingText>Yükleniyor...</LoadingText> : null}

                {section === 'tasks' ? (
                  <PreviewTasksSection
                    tasks={tasks}
                    onAdd={handleAddTask}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
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
                  <ContentCard>
                    <KonuMateryalSection studentName={selectedStudent.name} />
                  </ContentCard>
                ) : null}

                {section === 'exams' ? (
                  <ContentCard>
                    <DenemeSection studentName={selectedStudent.name} />
                  </ContentCard>
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
