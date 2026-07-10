import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  createTask,
  deleteTask,
  exportOrganizationJson,
  exportStudentJson,
  fetchStudents,
  fetchSubmissionsForRange,
  fetchTasksForRange,
  getSubmissionForDate,
  updateTaskLabel,
} from '../api/appData';
import { useAppAuth } from '../AppAuthContext';
import { AdminEditableTaskList } from '../components/AdminEditableTaskList';
import {
  AdminContent,
  AdminDashboardGrid,
  AdminMainPanel,
  AppCard,
  AppCardTitle,
  AppShell,
  AppSubtitle,
  BlueTitle,
  SidebarTitle,
  StudentDetailTitle,
  StudentListButton,
  StudentSidebar,
  TwoColumnGrid,
} from '../components/AppShell';
import { DaySlider, TextButton } from '../components/AppUi';
import { SubmissionForm } from '../components/SubmissionForm';
import type { DailySubmission, StudentSummary, StudentTask } from '../types';
import { downloadJson } from '../utils/download';
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

export function AdminHomePage() {
  const { user, isLoading, logout } = useAppAuth();
  const weekDays = useMemo(() => buildWeekDays(), []);
  const weekFrom = toDateKey(weekDays[0]);
  const weekTo = toDateKey(weekDays[weekDays.length - 1]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(TODAY_INDEX);
  const [tasksByDate, setTasksByDate] = useState<Record<string, StudentTask[]>>({});
  const [submissionsByDate, setSubmissionsByDate] = useState<Record<string, DailySubmission>>({});
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

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
  }, [user]);

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
  }, [selectedStudentId, weekFrom, weekTo]);

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
      setTasksByDate((current) => ({
        ...current,
        [selectedDateKey]: [...(current[selectedDateKey] ?? []), created],
      }));
    } catch {
      setError('Görev eklenemedi.');
    }
  };

  const handleEditTask = async (taskId: string, label: string) => {
    try {
      await updateTaskLabel(taskId, label);
      setTasksByDate((current) => ({
        ...current,
        [selectedDateKey]: (current[selectedDateKey] ?? []).map((task) =>
          task.id === taskId ? { ...task, label } : task,
        ),
      }));
    } catch {
      setError('Görev güncellenemedi.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasksByDate((current) => ({
        ...current,
        [selectedDateKey]: (current[selectedDateKey] ?? []).filter((task) => task.id !== taskId),
      }));
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
    <AppShell>
      <AdminContent>
        <div>
          <BlueTitle>Admin paneli</BlueTitle>
          <AppSubtitle style={{ marginTop: 8 }}>
            Öğrenci seçerek günlük görevleri yönetebilir ve formları görüntüleyebilirsin.
          </AppSubtitle>
        </div>

        <ExportRow>
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
            {students.map((student) => (
              <StudentListButton
                key={student.id}
                type="button"
                $selected={student.id === selectedStudentId}
                onClick={() => setSelectedStudentId(student.id)}
              >
                {student.name}
              </StudentListButton>
            ))}
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

                <TwoColumnGrid>
                  <AppCard>
                    <AppCardTitle>Günlük görevler</AppCardTitle>
                    <AdminEditableTaskList
                      tasks={tasks}
                      onAdd={handleAddTask}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                    />
                  </AppCard>

                  <AppCard>
                    <AppCardTitle>Günlük form</AppCardTitle>
                    <SubmissionForm
                      value={submission}
                      onChange={() => undefined}
                      readOnly
                    />
                  </AppCard>
                </TwoColumnGrid>
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
    </AppShell>
  );
}
