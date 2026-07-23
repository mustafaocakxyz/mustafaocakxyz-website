import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  fetchAdminNotesForRange,
  fetchSubmissionsForRange,
  fetchTasksForRange,
  getSubmissionForDate,
  setTaskCompleted,
  upsertSubmission,
} from '../api/appData';
import { useAppAuth } from '../AppAuthContext';
import {
  AppCard,
  AppCardTitle,
  AppContent,
  AppShell,
  AppSubtitle,
  BlueTitle,
  DetailColumnStack,
  TwoColumnGrid,
} from '../components/AppShell';
import { DaySlider, TextButton } from '../components/AppUi';
import { DayAdminNote } from '../components/DayAdminNote';
import { SubmissionForm } from '../components/SubmissionForm';
import { TaskList } from '../components/TaskList';
import type { DailySubmission, StudentTask } from '../types';
import { buildWeekDays, formatDayHeading, toDateKey } from '../utils/dates';

const TODAY_INDEX = 1;

const LoadingText = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
`;

const ErrorText = styled.p`
  margin: 0;
  color: #ff8a80;
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
        const [tasks, submissions, adminNotes] = await Promise.all([
          fetchTasksForRange(user.id, weekFrom, weekTo),
          fetchSubmissionsForRange(user.id, weekFrom, weekTo),
          fetchAdminNotesForRange(user.id, weekFrom, weekTo),
        ]);

        if (!isMounted) return;
        setTasksByDate(tasks);
        setSubmissionsByDate(submissions);
        setAdminNotesByDate(adminNotes);
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

  const selectedDate = weekDays[selectedIndex];
  const selectedDateKey = toDateKey(selectedDate);
  const tasks = tasksByDate[selectedDateKey] ?? [];
  const submission = getSubmissionForDate(submissionsByDate, selectedDateKey);
  const adminNote = adminNotesByDate[selectedDateKey] ?? '';

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
      <AppShell>
        <LoadingText>Yükleniyor...</LoadingText>
      </AppShell>
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
    <AppShell>
      <AppContent>
        <div>
          <BlueTitle>Merhaba, {user.displayName}</BlueTitle>
          <AppSubtitle style={{ marginTop: 8 }}>{formatDayHeading(selectedDate)}</AppSubtitle>
        </div>

        <DaySlider days={weekDays} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />

        {error ? <ErrorText>{error}</ErrorText> : null}
        {isPageLoading ? <LoadingText>Yükleniyor...</LoadingText> : null}

        <TwoColumnGrid>
          <DetailColumnStack>
            <AppCard>
              <AppCardTitle>Günlük görevler</AppCardTitle>
              <TaskList tasks={tasks} onToggle={handleToggleTask} />
            </AppCard>

            <AppCard>
              <AppCardTitle>Bugüne Notlar</AppCardTitle>
              <DayAdminNote value={adminNote} readOnly />
            </AppCard>
          </DetailColumnStack>

          <AppCard>
            <AppCardTitle>Günlük form</AppCardTitle>
            <SubmissionForm value={submission} onChange={handleSubmissionChange} />
          </AppCard>
        </TwoColumnGrid>

        <TextButton
          type="button"
          onClick={() => {
            void logout();
          }}
        >
          Çıkış yap
        </TextButton>
      </AppContent>
    </AppShell>
  );
}
