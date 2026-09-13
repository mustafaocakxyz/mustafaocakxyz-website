import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  applyDailyTaskChange,
  fetchAdminNotesForRange,
  fetchMeetingsForRange,
  fetchSubmissionsForRange,
  fetchTasksForRange,
  getSubmissionForDate,
  setTaskCompleted,
  subscribeDailyTasks,
  upsertSubmission,
} from '../api/appData';
import { useAppAuth } from '../AppAuthContext';
import { DayAdminNote } from '../components/DayAdminNote';
import { MeetingPanel } from '../components/MeetingPanel';
import { SubmissionForm } from '../components/SubmissionForm';
import {
  StudentContain,
  StudentHomeLogout,
  StudentHomeNav,
  StudentHomeNavLink,
  StudentHomeNavLinkWide,
  StudentHomeTitle,
  StudentHomeTopBar,
  StudentPageBody,
  StudentPageFrame,
  StudentShell,
} from '../components/StudentShell';
import { TaskList } from '../components/TaskList';
import { preview as t } from '../preview/adminPreviewTheme';
import {
  ContentCard,
  ContentTitle,
  ErrorText,
  LoadingText,
  PreviewDaySlider,
} from '../preview/AdminPreviewUi';
import type { DailySubmission, StudentMeeting, StudentTask } from '../types';
import { buildDaysFromOffsets, buildWeekDays, formatDayHeading, toDateKey } from '../utils/dates';
import { computeCompletionPercent } from '../utils/taskLabel';

/** Default week still yesterday→+5; slider starts padded so students can scroll out. */
const STUDENT_DAY_PAD = 14;
const STUDENT_DAY_CHUNK = 14;
const STUDENT_TODAY_INDEX = STUDENT_DAY_PAD + 1;

type ProgressTone = 'ok' | 'warn' | 'bad' | 'muted';

function progressTone(percent: number | null): ProgressTone {
  if (percent === null) return 'muted';
  if (percent >= 100) return 'ok';
  if (percent >= 50) return 'warn';
  return 'bad';
}

const toneColor: Record<ProgressTone, string> = {
  ok: t.success,
  warn: t.warn,
  bad: t.danger,
  muted: t.muted,
};

const toneSoft: Record<ProgressTone, string> = {
  ok: t.successSoft,
  warn: t.warnSoft,
  bad: t.dangerSoft,
  muted: 'rgba(148, 163, 184, 0.12)',
};

const IdentityCard = styled.section`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 14px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.border};
  background: ${t.panel};
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 640px) {
    padding: 18px;
    gap: 14px;
  }
`;

const IdentityDate = styled.h2`
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.25;
  color: ${t.text};
  overflow-wrap: anywhere;

  @media (min-width: 640px) {
    font-size: 1.55rem;
  }
`;

const ProgressRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
`;

const ProgressLabel = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${t.muted};
`;

const ProgressValue = styled.span<{ $tone: ProgressTone }>`
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  color: ${({ $tone }) => toneColor[$tone]};

  @media (min-width: 640px) {
    font-size: 1.75rem;
  }
`;

const ProgressTrack = styled.div`
  height: 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.65);
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $pct: number; $tone: ProgressTone }>`
  height: 100%;
  width: ${({ $pct }) => `${Math.max(0, Math.min(100, $pct))}%`};
  border-radius: inherit;
  background: ${({ $tone }) => toneColor[$tone]};
  box-shadow: 0 0 12px ${({ $tone }) => toneSoft[$tone]};
  transition: width 0.2s ease, background 0.2s ease;
`;

const SectionStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  width: 100%;
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  width: 100%;
  max-width: 100%;
  min-width: 0;

  @media (min-width: 720px) {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
`;

export function StudentDashboardPage() {
  const { user, isLoading, logout } = useAppAuth();
  const weekDays = useMemo(() => buildWeekDays(), []);
  const weekFrom = toDateKey(weekDays[0]);
  const weekTo = toDateKey(weekDays[weekDays.length - 1]);
  const [dayOffsetStart, setDayOffsetStart] = useState(-1 - STUDENT_DAY_PAD);
  const [dayOffsetEnd, setDayOffsetEnd] = useState(5 + STUDENT_DAY_PAD);
  const days = useMemo(
    () => buildDaysFromOffsets(dayOffsetStart, dayOffsetEnd),
    [dayOffsetStart, dayOffsetEnd],
  );
  const todayDayIndex = -dayOffsetStart;
  const [selectedIndex, setSelectedIndex] = useState(STUDENT_TODAY_INDEX);
  const [tasksByDate, setTasksByDate] = useState<Record<string, StudentTask[]>>({});
  const [submissionsByDate, setSubmissionsByDate] = useState<Record<string, DailySubmission>>({});
  const [adminNotesByDate, setAdminNotesByDate] = useState<Record<string, string>>({});
  const [meetingsByDate, setMeetingsByDate] = useState<Record<string, StudentMeeting>>({});
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState('');
  const skipSubmissionSave = useRef(true);
  const extraDayLoadedRef = useRef<Set<string>>(new Set());
  const extraDayInFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || user.role !== 'student') return;

    let isMounted = true;
    setIsPageLoading(true);
    setError('');

    const loadWeek = async () => {
      try {
        const [tasks, submissions, adminNotes, meetings] = await Promise.all([
          fetchTasksForRange(user.id, weekFrom, weekTo),
          fetchSubmissionsForRange(user.id, weekFrom, weekTo),
          fetchAdminNotesForRange(user.id, weekFrom, weekTo),
          fetchMeetingsForRange(user.id, weekFrom, weekTo),
        ]);

        if (!isMounted) return;
        setTasksByDate(tasks);
        setSubmissionsByDate(submissions);
        setAdminNotesByDate(adminNotes);
        setMeetingsByDate(meetings);
        skipSubmissionSave.current = true;
      } catch {
        if (isMounted) setError('Veriler yüklenemedi.');
      } finally {
        if (isMounted) setIsPageLoading(false);
      }
    };

    void loadWeek();
    return () => {
      isMounted = false;
    };
  }, [user, weekFrom, weekTo]);

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    return subscribeDailyTasks({ studentId: user.id }, (change) => {
      setTasksByDate((current) => applyDailyTaskChange(current, change, weekFrom, weekTo));
    });
  }, [user, weekFrom, weekTo]);

  const expandPastDays = useCallback(() => {
    setDayOffsetStart((current) => current - STUDENT_DAY_CHUNK);
    setSelectedIndex((current) => current + STUDENT_DAY_CHUNK);
  }, []);

  const expandFutureDays = useCallback(() => {
    setDayOffsetEnd((current) => current + STUDENT_DAY_CHUNK);
  }, []);

  const selectedDate = days[selectedIndex];
  const selectedDateKey = toDateKey(selectedDate);
  const tasks = tasksByDate[selectedDateKey] ?? [];
  const submission = getSubmissionForDate(submissionsByDate, selectedDateKey);
  const adminNote = adminNotesByDate[selectedDateKey] ?? '';
  const selectedMeeting = meetingsByDate[selectedDateKey] ?? null;
  const completionPercent = computeCompletionPercent(tasks);
  const progressPct = completionPercent ?? 0;
  const progressLabel =
    completionPercent === null ? '—' : `${completionPercent}%`;
  const tone = progressTone(completionPercent);

  useEffect(() => {
    if (!user || user.role !== 'student' || isPageLoading) return;
    const date = days[selectedIndex];
    if (!date) return;
    const dateKey = toDateKey(date);
    if (dateKey >= weekFrom && dateKey <= weekTo) return;
    if (extraDayLoadedRef.current.has(dateKey) || extraDayInFlightRef.current.has(dateKey)) {
      return;
    }

    extraDayInFlightRef.current.add(dateKey);
    skipSubmissionSave.current = true;
    let isMounted = true;

    void (async () => {
      try {
        const [tasks, submissions, adminNotes, meetings] = await Promise.all([
          fetchTasksForRange(user.id, dateKey, dateKey),
          fetchSubmissionsForRange(user.id, dateKey, dateKey),
          fetchAdminNotesForRange(user.id, dateKey, dateKey),
          fetchMeetingsForRange(user.id, dateKey, dateKey),
        ]);
        if (!isMounted) return;
        extraDayLoadedRef.current.add(dateKey);
        extraDayInFlightRef.current.delete(dateKey);
        skipSubmissionSave.current = true;
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
        extraDayInFlightRef.current.delete(dateKey);
        extraDayLoadedRef.current.delete(dateKey);
        if (isMounted) setError('Gün verileri yüklenemedi.');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user, isPageLoading, selectedIndex, days, weekFrom, weekTo]);

  useEffect(() => {
    if (!user || user.role !== 'student' || isPageLoading) return;

    const outsideDefaultWeek = selectedDateKey < weekFrom || selectedDateKey > weekTo;
    if (outsideDefaultWeek && !extraDayLoadedRef.current.has(selectedDateKey)) {
      skipSubmissionSave.current = true;
      return;
    }

    if (skipSubmissionSave.current) {
      skipSubmissionSave.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      void upsertSubmission(user.id, selectedDateKey, submission).catch(() => {
        setError('Form kaydedilemedi.');
      });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [submission, selectedDateKey, user, isPageLoading, weekFrom, weekTo]);

  if (isLoading) {
    return (
      <StudentShell>
        <StudentPageFrame>
          <LoadingText>Yükleniyor...</LoadingText>
        </StudentPageFrame>
      </StudentShell>
    );
  }

  if (!user) {
    return <Navigate to="/app" replace />;
  }

  if (user.role !== 'student') {
    return <Navigate to="/app/admin" replace />;
  }

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find((entry) => entry.id === taskId);
    if (!task) return;

    const nextCompleted = !task.completed;
    setTasksByDate((current) => ({
      ...current,
      [selectedDateKey]: (current[selectedDateKey] ?? []).map((entry) =>
        entry.id === taskId ? { ...entry, completed: nextCompleted } : entry,
      ),
    }));

    try {
      await setTaskCompleted(taskId, nextCompleted);
    } catch {
      setTasksByDate((current) => ({
        ...current,
        [selectedDateKey]: (current[selectedDateKey] ?? []).map((entry) =>
          entry.id === taskId ? { ...entry, completed: task.completed } : entry,
        ),
      }));
      setError('Görev güncellenemedi.');
    }
  };

  const handleSubmissionChange = (next: DailySubmission) => {
    setSubmissionsByDate((current) => ({
      ...current,
      [selectedDateKey]: next,
    }));
  };

  return (
    <StudentShell>
      <StudentHomeTopBar>
        <StudentHomeTitle>{user.displayName}</StudentHomeTitle>
        <StudentHomeNav>
          <StudentHomeNavLink to="/app/student/chat">Sohbet</StudentHomeNavLink>
          <StudentHomeNavLink to="/app/student/denemeler">Denemeler</StudentHomeNavLink>
          <StudentHomeNavLinkWide to="/app/student/konu">Konu & Materyal</StudentHomeNavLinkWide>
        </StudentHomeNav>
        <StudentHomeLogout
          type="button"
          onClick={() => {
            void logout();
          }}
        >
          Çıkış Yap
        </StudentHomeLogout>
      </StudentHomeTopBar>

      <StudentPageBody>
        <StudentPageFrame>
          <IdentityCard>
            <IdentityDate>{formatDayHeading(selectedDate)}</IdentityDate>
            <ProgressRow>
              <ProgressLabel>Görev tamamlanma</ProgressLabel>
              <ProgressValue $tone={tone}>{progressLabel}</ProgressValue>
            </ProgressRow>
            <ProgressTrack>
              <ProgressFill $pct={progressPct} $tone={tone} />
            </ProgressTrack>
          </IdentityCard>

          <StudentContain>
            <PreviewDaySlider
              days={days}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              todayIndex={todayDayIndex}
              extendable
              onNearStart={expandPastDays}
              onNearEnd={expandFutureDays}
            />
          </StudentContain>

          {error ? <ErrorText>{error}</ErrorText> : null}
          {isPageLoading ? <LoadingText>Yükleniyor...</LoadingText> : null}

          <SectionGrid>
            <SectionStack>
              <ContentCard>
                <ContentTitle>Günlük görevler</ContentTitle>
                <TaskList tasks={tasks} onToggle={handleToggleTask} />
              </ContentCard>

              <ContentCard>
                <ContentTitle>Bugüne Notlar</ContentTitle>
                <DayAdminNote value={adminNote} readOnly />
              </ContentCard>
            </SectionStack>

            <SectionStack>
              <ContentCard>
                <ContentTitle>Günlük form</ContentTitle>
                <SubmissionForm value={submission} onChange={handleSubmissionChange} />
              </ContentCard>

              {selectedMeeting ? (
                <ContentCard>
                  <ContentTitle>Görüşme</ContentTitle>
                  <MeetingPanel meeting={selectedMeeting} readOnly />
                </ContentCard>
              ) : null}
            </SectionStack>
          </SectionGrid>
        </StudentPageFrame>
      </StudentPageBody>
    </StudentShell>
  );
}
