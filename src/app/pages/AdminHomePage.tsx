import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import {
  createTask,
  deleteTask,
  exportOrganizationJson,
  exportStudentJson,
  fetchOrgTasksForDates,
  fetchStudents,
  fetchSubmissionsForRange,
  fetchTasksForRange,
  getSubmissionForDate,
  updateTaskLabel,
} from '../api/appData';
import { useAppAuth } from '../AppAuthContext';
import { AdminEditableTaskList } from '../components/AdminEditableTaskList';
import {
  AdminCard,
  AdminContent,
  AdminDashboardGrid,
  AdminDetailGrid,
  AdminMainPanel,
  AdminShell,
  AppCardTitle,
  AppSubtitle,
  BlueTitle,
  SidebarTitle,
  StudentDetailTitle,
  StudentListButton,
  StudentSidebar,
} from '../components/AppShell';
import { DaySlider, TextButton } from '../components/AppUi';
import { SubmissionForm } from '../components/SubmissionForm';
import type { DailySubmission, StudentSummary, StudentTask } from '../types';
import { downloadJson } from '../utils/download';
import { buildWeekDays, formatDayHeading, startOfDay, toDateKey } from '../utils/dates';

const TODAY_INDEX = 1;

type CompletionTone = 'green' | 'yellow' | 'red' | 'muted';

type StudentStatus = {
  tomorrowReady: boolean;
  todayPercent: number | null;
  todayTone: CompletionTone;
};

const LoadingText = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
`;

const ErrorText = styled.p`
  margin: 0;
  color: #ff8a80;
`;

const ExportRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const ExportButton = styled.button`
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(66, 165, 245, 0.35);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(144, 202, 249, 0.95);
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;

  &:hover {
    border-color: rgba(66, 165, 245, 0.55);
    background: rgba(255, 255, 255, 0.08);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NavLinkButton = styled(Link)`
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(66, 165, 245, 0.35);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(144, 202, 249, 0.95);
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  text-decoration: none;
  display: inline-flex;
  align-items: center;

  &:hover {
    border-color: rgba(66, 165, 245, 0.55);
    background: rgba(255, 255, 255, 0.08);
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`;

const HeaderCopy = styled.div`
  min-width: 0;
`;

const EarningsBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(102, 187, 106, 0.4);
  background: rgba(76, 175, 80, 0.12);
`;

const LiveDotWrap = styled.span`
  position: relative;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const LiveDotCore = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #66bb6a;
  box-shadow: 0 0 10px rgba(102, 187, 106, 0.7);
  z-index: 1;
`;

const LiveDotPulse = styled.span`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(102, 187, 106, 0.45);
  animation: adminEarningsBreath 1.8s ease-in-out infinite;

  @keyframes adminEarningsBreath {
    0%,
    100% {
      transform: scale(0.85);
      opacity: 0.7;
    }
    50% {
      transform: scale(2.1);
      opacity: 0;
    }
  }
`;

const EarningsAmount = styled.span`
  font-size: 1.05rem;
  font-weight: 700;
  color: rgba(165, 214, 167, 0.98);
  letter-spacing: 0.01em;
  white-space: nowrap;
`;

const PRICE_PER_STUDENT = 5000;
const FREE_TRIAL_OFFSET = 1;

function formatMonthlyEarnings(activeStudentCount: number): string {
  const paying = Math.max(0, activeStudentCount - FREE_TRIAL_OFFSET);
  const amount = paying * PRICE_PER_STUDENT;
  return `${amount.toLocaleString('tr-TR')} ₺`;
}

const StudentName = styled.span`
  width: 100%;
  line-height: 1.3;
`;

const StatusPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
`;

const StatusPill = styled.span<{ $tone?: CompletionTone; $ready?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;

  ${({ $ready }) =>
    $ready === true &&
    css`
      border: 1px solid rgba(102, 187, 106, 0.45);
      background: rgba(76, 175, 80, 0.18);
      color: rgba(200, 230, 201, 0.95);
    `}

  ${({ $ready }) =>
    $ready === false &&
    css`
      border: 1px solid rgba(239, 83, 80, 0.4);
      background: rgba(244, 67, 54, 0.16);
      color: rgba(255, 205, 210, 0.95);
    `}

  ${({ $tone }) =>
    $tone === 'green' &&
    css`
      border: 1px solid rgba(102, 187, 106, 0.5);
      background: rgba(76, 175, 80, 0.22);
      color: rgba(200, 230, 201, 0.98);
    `}

  ${({ $tone }) =>
    $tone === 'yellow' &&
    css`
      border: 1px solid rgba(255, 213, 79, 0.5);
      background: rgba(255, 193, 7, 0.2);
      color: rgba(255, 249, 196, 0.98);
    `}

  ${({ $tone }) =>
    $tone === 'red' &&
    css`
      border: 1px solid rgba(239, 83, 80, 0.5);
      background: rgba(244, 67, 54, 0.2);
      color: rgba(255, 205, 210, 0.98);
    `}

  ${({ $tone }) =>
    $tone === 'muted' &&
    css`
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.5);
    `}
`;

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
  if (percent >= 100) return 'green';
  if (percent >= 50) return 'yellow';
  return 'red';
}

function buildStudentStatus(
  todayTasks: StudentTask[],
  tomorrowTasks: StudentTask[],
): StudentStatus {
  const tomorrowReady = tomorrowTasks.length > 0;

  if (todayTasks.length === 0) {
    return {
      tomorrowReady,
      todayPercent: null,
      todayTone: 'muted',
    };
  }

  const completedCount = todayTasks.filter((task) => task.completed).length;
  const todayPercent = Math.round((completedCount / todayTasks.length) * 100);

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

export function AdminHomePage() {
  const { user, isLoading, logout } = useAppAuth();
  const weekDays = useMemo(() => buildWeekDays(), []);
  const weekFrom = toDateKey(weekDays[0]);
  const weekTo = toDateKey(weekDays[weekDays.length - 1]);
  const { todayKey, tomorrowKey } = useMemo(() => getTodayAndTomorrowKeys(), []);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(TODAY_INDEX);
  const [tasksByDate, setTasksByDate] = useState<Record<string, StudentTask[]>>({});
  const [submissionsByDate, setSubmissionsByDate] = useState<Record<string, DailySubmission>>({});
  const [studentStatuses, setStudentStatuses] = useState<Record<string, StudentStatus>>({});
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

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
    if (!user || user.role !== 'admin') return;

    let isMounted = true;
    setIsPageLoading(true);
    setError('');

    const loadStudents = async () => {
      try {
        const rows = await fetchStudents();
        if (!isMounted) return;
        setStudents(rows);
        setSelectedStudentId((current) => current || rows[0]?.id || '');
        await refreshStudentStatuses(rows.map((row) => row.id));
      } catch {
        if (isMounted) setError('Öğrenci listesi yüklenemedi.');
      } finally {
        if (isMounted) setIsPageLoading(false);
      }
    };

    void loadStudents();
    return () => {
      isMounted = false;
    };
  }, [user, refreshStudentStatuses]);

  useEffect(() => {
    if (!selectedStudentId) return;

    let isMounted = true;
    setIsPageLoading(true);
    setError('');

    const loadStudentWeek = async () => {
      try {
        const [tasks, submissions] = await Promise.all([
          fetchTasksForRange(selectedStudentId, weekFrom, weekTo),
          fetchSubmissionsForRange(selectedStudentId, weekFrom, weekTo),
        ]);

        if (!isMounted) return;
        setTasksByDate(tasks);
        setSubmissionsByDate(submissions);
        syncSelectedStudentStatus(selectedStudentId, tasks);
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
  }, [selectedStudentId, weekFrom, weekTo, syncSelectedStudentStatus]);

  if (isLoading) {
    return (
      <AdminShell>
        <LoadingText>Yükleniyor...</LoadingText>
      </AdminShell>
    );
  }

  if (!user) {
    return <Navigate to="/app" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/app/student" replace />;
  }

  const selectedStudent = students.find((student) => student.id === selectedStudentId);
  const selectedDate = weekDays[selectedDayIndex];
  const selectedDateKey = toDateKey(selectedDate);
  const tasks = tasksByDate[selectedDateKey] ?? [];
  const submission = getSubmissionForDate(submissionsByDate, selectedDateKey);

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
      await updateTaskLabel(taskId, label);
      setTasksByDate((current) => {
        const next = {
          ...current,
          [selectedDateKey]: (current[selectedDateKey] ?? []).map((task) =>
            task.id === taskId ? { ...task, label } : task,
          ),
        };
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
        syncSelectedStudentStatus(selectedStudent.id, next);
        return next;
      });
    } catch {
      setError('Görev silinemedi.');
    }
  };

  const handleExportStudent = async () => {
    if (!selectedStudent) return;

    setIsExporting(true);
    setError('');
    try {
      const data = await exportStudentJson(selectedStudent.id, weekFrom, weekTo);
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
      const data = await exportOrganizationJson(weekFrom, weekTo);
      downloadJson('organization-export.json', data);
    } catch {
      setError('Kurum dışa aktarımı başarısız.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AdminShell>
      <AdminContent>
        <HeaderRow>
          <HeaderCopy>
            <BlueTitle>Admin paneli</BlueTitle>
            <AppSubtitle style={{ marginTop: 8 }}>
              Öğrenci seçerek günlük görevleri yönetebilir ve formları görüntüleyebilirsin.
            </AppSubtitle>
          </HeaderCopy>
          <EarningsBadge title="Aylık kazanç = (aktif öğrenci − 1) × 5000">
            <LiveDotWrap aria-hidden>
              <LiveDotPulse />
              <LiveDotCore />
            </LiveDotWrap>
            <EarningsAmount>{formatMonthlyEarnings(students.length)}</EarningsAmount>
          </EarningsBadge>
        </HeaderRow>

        <ExportRow>
          <NavLinkButton to="/app/admin/showcase">Kayda değer başarı düzenle</NavLinkButton>
          <ExportButton
            type="button"
            disabled={!selectedStudent || isExporting}
            onClick={() => void handleExportStudent()}
          >
            Seçili öğrenciyi dışa aktar (JSON)
          </ExportButton>
          <ExportButton
            type="button"
            disabled={isExporting}
            onClick={() => void handleExportOrganization()}
          >
            Tüm kurumu dışa aktar (JSON)
          </ExportButton>
        </ExportRow>

        {error ? <ErrorText>{error}</ErrorText> : null}

        <AdminDashboardGrid>
          <StudentSidebar>
            <SidebarTitle>Öğrenciler</SidebarTitle>
            {students.map((student) => {
              const status = studentStatuses[student.id];
              const tomorrowReady = status?.tomorrowReady ?? false;
              const todayTone = status?.todayTone ?? 'muted';
              const todayLabel =
                status?.todayPercent === null || status?.todayPercent === undefined
                  ? '—'
                  : `${status.todayPercent}%`;

              return (
                <StudentListButton
                  key={student.id}
                  type="button"
                  $selected={student.id === selectedStudentId}
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  <StudentName>{student.name}</StudentName>
                  <StatusPills>
                    <StatusPill $ready={tomorrowReady}>
                      Yarın {tomorrowReady ? '✅' : '❌'}
                    </StatusPill>
                    <StatusPill $tone={todayTone}>{todayLabel}</StatusPill>
                  </StatusPills>
                </StudentListButton>
              );
            })}
            {students.length === 0 && !isPageLoading ? (
              <AppSubtitle>Henüz öğrenci yok.</AppSubtitle>
            ) : null}
          </StudentSidebar>

          <AdminMainPanel>
            {selectedStudent ? (
              <>
                <div>
                  <StudentDetailTitle>{selectedStudent.name}</StudentDetailTitle>
                  <AppSubtitle style={{ marginTop: 6 }}>
                    {formatDayHeading(selectedDate)}
                  </AppSubtitle>
                </div>

                <DaySlider
                  days={weekDays}
                  selectedIndex={selectedDayIndex}
                  onSelect={setSelectedDayIndex}
                />

                {isPageLoading ? <LoadingText>Yükleniyor...</LoadingText> : null}

                <AdminDetailGrid>
                  <AdminCard>
                    <AppCardTitle>Günlük görevler</AppCardTitle>
                    <AdminEditableTaskList
                      tasks={tasks}
                      onAdd={handleAddTask}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                    />
                  </AdminCard>

                  <AdminCard>
                    <AppCardTitle>Günlük form</AppCardTitle>
                    <SubmissionForm
                      value={submission}
                      onChange={() => undefined}
                      readOnly
                    />
                  </AdminCard>
                </AdminDetailGrid>
              </>
            ) : (
              <AppSubtitle>Öğrenci seçin.</AppSubtitle>
            )}
          </AdminMainPanel>
        </AdminDashboardGrid>

        <TextButton
          type="button"
          onClick={() => {
            void logout();
          }}
        >
          Çıkış yap
        </TextButton>
      </AdminContent>
    </AdminShell>
  );
}
