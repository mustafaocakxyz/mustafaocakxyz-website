import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
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
import { TaskList } from '../components/TaskList';
import { preview as t } from '../preview/adminPreviewTheme';
import {
  ChatGlowButton,
  ContentCard,
  ContentTitle,
  ErrorText,
  LoadingText,
  PreviewDaySlider,
  PreviewShell,
} from '../preview/AdminPreviewUi';
import type { DailySubmission, StudentMeeting, StudentTask } from '../types';
import { buildWeekDays, formatDayHeading, toDateKey } from '../utils/dates';
import { computeCompletionPercent } from '../utils/taskLabel';

const TODAY_INDEX = 1;

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

const StudentTopBar = styled.header`
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 52px;
  padding: 10px 20px;
  border-bottom: 1px solid ${t.border};
  background: ${t.panel};

  @media (min-width: 640px) {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    padding: 10px 28px;
  }
`;

const StudentTopTitle = styled.h1`
  margin: 0;
  min-width: 0;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: ${t.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  justify-self: start;
`;

const LogoutButton = styled.button`
  flex-shrink: 0;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid ${t.borderStrong};
  background: ${t.panel2};
  color: ${t.muted};
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  justify-self: end;

  &:hover {
    border-color: rgba(96, 165, 250, 0.5);
    color: ${t.text};
  }
`;

const StudentChatButton = styled(ChatGlowButton)`
  padding: 7px 12px;
  font-size: 0.78rem;
  flex-shrink: 0;
  justify-self: center;
`;

const StudentBody = styled.div`
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StudentFrame = styled.div`
  width: 100%;
  max-width: 720px;
  box-sizing: border-box;
  padding: 20px 16px 56px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (min-width: 640px) {
    padding: 24px 24px 64px;
  }
`;

const IdentityCard = styled.section`
  padding: 20px 18px 18px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.border};
  background: ${t.panel};
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const IdentityDate = styled.h2`
  margin: 0;
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.2;
  color: ${t.text};

  @media (min-width: 640px) {
    font-size: 1.65rem;
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
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  color: ${({ $tone }) => toneColor[$tone]};
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
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;

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
  const [selectedIndex, setSelectedIndex] = useState(TODAY_INDEX);
  const [tasksByDate, setTasksByDate] = useState<Record<string, StudentTask[]>>({});
  const [submissionsByDate, setSubmissionsByDate] = useState<Record<string, DailySubmission>>({});
  const [adminNotesByDate, setAdminNotesByDate] = useState<Record<string, string>>({});
  const [meetingsByDate, setMeetingsByDate] = useState<Record<string, StudentMeeting>>({});
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState('');
  const skipSubmissionSave = useRef(true);

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

  const selectedDate = weekDays[selectedIndex];
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
  }, [submission, selectedDateKey, user, isPageLoading]);

  if (isLoading) {
    return (
      <PreviewShell>
        <StudentFrame>
          <LoadingText>Yükleniyor...</LoadingText>
        </StudentFrame>
      </PreviewShell>
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
    <PreviewShell>
      <StudentTopBar>
        <StudentTopTitle>{user.displayName}</StudentTopTitle>
        <StudentChatButton as={Link} to="/app/student/chat">
          Sohbet
        </StudentChatButton>
        <LogoutButton
          type="button"
          onClick={() => {
            void logout();
          }}
        >
          Çıkış Yap
        </LogoutButton>
      </StudentTopBar>

      <StudentBody>
        <StudentFrame>
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

          <PreviewDaySlider
            days={weekDays}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />

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
        </StudentFrame>
      </StudentBody>
    </PreviewShell>
  );
}
