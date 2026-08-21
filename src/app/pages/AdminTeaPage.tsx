import { useEffect, useMemo, useState } from 'react';
import { Check, EyeOff, Table2, X } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { fetchOrgTasksForRange, fetchStudents } from '../api/appData';
import { useAppAuth } from '../AppAuthContext';
import type { StudentSummary } from '../types';
import { buildDaysFromOffsets, toDateKey } from '../utils/dates';
import { preview as t } from '../preview/adminPreviewTheme';
import {
  ContentCard,
  ContentSub,
  ContentTitle,
  EmptyState,
  ErrorText,
  LoadingText,
  PreviewBody,
  PreviewFrame,
  PreviewShell,
  PreviewTopBar,
  TopBarActions,
  TopBarButton,
  TopBarEnd,
  TopBarTitle,
} from '../preview/AdminPreviewUi';

/** Tomorrow through 5 days later (inclusive) = next 5 days. */
const DAY_START_OFFSET = 1;
const DAY_END_OFFSET = 5;

function formatColumnHeader(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

type StudentRow = {
  student: StudentSummary;
  filledCount: number;
  hasTaskByDate: Record<string, boolean>;
};

const TableScroll = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.borderStrong};
  background: ${t.panel2};
`;

const MatrixTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 440px;
`;

const Th = styled.th`
  padding: 6px 8px;
  text-align: left;
  font-size: 0.72rem;
  font-weight: 800;
  color: ${t.text};
  border-bottom: 1px solid ${t.borderStrong};
  border-right: 1px solid ${t.border};
  white-space: nowrap;
  background: rgba(15, 23, 42, 0.55);

  &:last-child {
    border-right: none;
  }
`;

const DayTh = styled(Th)`
  text-align: center;
  min-width: 48px;
`;

const Td = styled.td`
  padding: 3px 6px;
  border-bottom: 1px solid ${t.border};
  border-right: 1px solid ${t.border};
  vertical-align: middle;

  &:last-child {
    border-right: none;
  }

  tr:last-child & {
    border-bottom: none;
  }
`;

const NameCellInner = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 160px;
`;

const DayCell = styled(Td)`
  text-align: center;
`;

const HideButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  padding: 0;
  border-radius: 5px;
  border: 1px solid ${t.borderStrong};
  background: ${t.panel};
  color: ${t.muted};
  cursor: pointer;

  &:hover {
    color: ${t.text};
    border-color: rgba(96, 165, 250, 0.5);
  }
`;

const StudentName = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${t.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusIcon = styled.span<{ $ok: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: ${({ $ok }) => ($ok ? 'rgba(34, 197, 94, 0.92)' : 'rgba(185, 28, 28, 0.88)')};
  color: #fff;
`;

const HiddenSection = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const HiddenLabel = styled.div`
  font-size: 0.72rem;
  font-weight: 800;
  color: ${t.muted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const HiddenList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const HiddenChip = styled.button`
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid ${t.borderStrong};
  background: ${t.panel2};
  color: ${t.text};
  font: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    border-color: rgba(96, 165, 250, 0.5);
  }
`;

export function AdminTeaPage() {
  const { user, isLoading } = useAppAuth();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [taskPresence, setTaskPresence] = useState<Record<string, Record<string, boolean>>>({});
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  const analysisDays = useMemo(
    () => buildDaysFromOffsets(DAY_START_OFFSET, DAY_END_OFFSET),
    [],
  );
  const dateKeys = useMemo(() => analysisDays.map(toDateKey), [analysisDays]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    let cancelled = false;

    const load = async () => {
      setPageLoading(true);
      setError('');
      try {
        const fromDate = dateKeys[0];
        const toDate = dateKeys[dateKeys.length - 1];
        const [studentRows, orgTasks] = await Promise.all([
          fetchStudents(),
          fetchOrgTasksForRange(fromDate, toDate),
        ]);

        if (cancelled) return;

        const presence: Record<string, Record<string, boolean>> = {};
        for (const student of studentRows) {
          presence[student.id] = {};
          for (const dateKey of dateKeys) {
            presence[student.id][dateKey] = (orgTasks[student.id]?.[dateKey]?.length ?? 0) > 0;
          }
        }

        setStudents(studentRows);
        setTaskPresence(presence);
      } catch {
        if (!cancelled) setError('Görev analizi yüklenemedi.');
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user, dateKeys]);

  const visibleRows = useMemo((): StudentRow[] => {
    const rows: StudentRow[] = students
      .filter((student) => !hiddenIds.has(student.id))
      .map((student) => {
        const hasTaskByDate: Record<string, boolean> = {};
        let filledCount = 0;
        for (const dateKey of dateKeys) {
          const has = Boolean(taskPresence[student.id]?.[dateKey]);
          hasTaskByDate[dateKey] = has;
          if (has) filledCount += 1;
        }
        return { student, filledCount, hasTaskByDate };
      });

    rows.sort((a, b) => {
      if (a.filledCount !== b.filledCount) return a.filledCount - b.filledCount;
      return a.student.name.localeCompare(b.student.name, 'tr');
    });

    return rows;
  }, [students, hiddenIds, taskPresence, dateKeys]);

  const hiddenStudents = useMemo(
    () =>
      students
        .filter((student) => hiddenIds.has(student.id))
        .sort((a, b) => a.name.localeCompare(b.name, 'tr')),
    [students, hiddenIds],
  );

  const hideStudent = (studentId: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(studentId);
      return next;
    });
  };

  const showStudent = (studentId: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <PreviewShell>
        <PreviewBody>
          <LoadingText>Yükleniyor...</LoadingText>
        </PreviewBody>
      </PreviewShell>
    );
  }

  if (!user) return <Navigate to="/app" replace />;
  if (user.role !== 'admin') return <Navigate to="/app/student" replace />;

  return (
    <PreviewShell>
      <PreviewTopBar>
        <TopBarTitle>Görev Analizi</TopBarTitle>
        <TopBarActions>
          <TopBarButton as={Link} to="/app/admin">
            ← Admin paneline dön
          </TopBarButton>
        </TopBarActions>
        <TopBarEnd />
      </PreviewTopBar>

      <PreviewBody>
        <PreviewFrame>
          <ContentCard>
            <ContentTitle>
              <Table2 size={18} strokeWidth={2.4} style={{ marginRight: 8, verticalAlign: -3 }} />
              Günlük görev varlığı
            </ContentTitle>
            <ContentSub>
              Yarın ile sonraki 5 gün. Yeşil: o gün için görev var. Kırmızı: yok. En az dolu
              öğrenciler üstte.
            </ContentSub>

            {error ? <ErrorText>{error}</ErrorText> : null}
            {pageLoading ? <LoadingText>Yükleniyor...</LoadingText> : null}

            {!pageLoading && students.length === 0 ? (
              <EmptyState>Gösterilecek öğrenci yok.</EmptyState>
            ) : null}

            {!pageLoading && students.length > 0 && visibleRows.length === 0 ? (
              <EmptyState>Tüm öğrenciler gizlendi. Aşağıdan geri ekleyebilirsin.</EmptyState>
            ) : null}

            {!pageLoading && visibleRows.length > 0 ? (
              <TableScroll>
                <MatrixTable>
                  <thead>
                    <tr>
                      <Th>Name</Th>
                      {analysisDays.map((day) => (
                        <DayTh key={toDateKey(day)}>{formatColumnHeader(day)}</DayTh>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map(({ student, hasTaskByDate }) => (
                      <tr key={student.id}>
                        <Td>
                          <NameCellInner>
                            <HideButton
                              type="button"
                              title={`${student.name} gizle`}
                              aria-label={`${student.name} gizle`}
                              onClick={() => hideStudent(student.id)}
                            >
                              <EyeOff size={11} strokeWidth={2.4} />
                            </HideButton>
                            <StudentName title={student.name}>{student.name}</StudentName>
                          </NameCellInner>
                        </Td>
                        {dateKeys.map((dateKey) => {
                          const ok = hasTaskByDate[dateKey];
                          return (
                            <DayCell key={dateKey}>
                              <StatusIcon
                                $ok={ok}
                                title={ok ? 'Görev var' : 'Görev yok'}
                                aria-label={ok ? 'Görev var' : 'Görev yok'}
                              >
                                {ok ? (
                                  <Check size={12} strokeWidth={3} />
                                ) : (
                                  <X size={12} strokeWidth={3} />
                                )}
                              </StatusIcon>
                            </DayCell>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </MatrixTable>
              </TableScroll>
            ) : null}

            {hiddenStudents.length > 0 ? (
              <HiddenSection>
                <HiddenLabel>Gizlenen öğrenciler</HiddenLabel>
                <HiddenList>
                  {hiddenStudents.map((student) => (
                    <HiddenChip
                      key={student.id}
                      type="button"
                      title={`${student.name} geri getir`}
                      onClick={() => showStudent(student.id)}
                    >
                      {student.name}
                    </HiddenChip>
                  ))}
                </HiddenList>
              </HiddenSection>
            ) : null}
          </ContentCard>
        </PreviewFrame>
      </PreviewBody>
    </PreviewShell>
  );
}
