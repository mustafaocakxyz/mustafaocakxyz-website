import { useEffect, useMemo, useState } from 'react';
import { BarChart2, EyeOff } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { fetchOrgTasksForDates, fetchStudents } from '../api/appData';
import { useAppAuth } from '../AppAuthContext';
import type { StudentSummary } from '../types';
import { buildDaysFromOffsets, formatDayHeading, toDateKey } from '../utils/dates';
import { computeCompletionPercent } from '../utils/taskLabel';
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

type CompletionTone = 'ok' | 'warn' | 'bad' | 'muted';

function completionTone(percent: number | null): CompletionTone {
  if (percent === null) return 'muted';
  if (percent >= 100) return 'ok';
  if (percent >= 50) return 'warn';
  return 'bad';
}

function formatCompletionLabel(percent: number | null): string {
  if (percent === null) return '—';
  return `${percent}%`;
}

function completionSortKey(percent: number | null): number {
  if (percent === null) return -1;
  return percent;
}

type StudentRow = {
  student: StudentSummary;
  yesterdayPercent: number | null;
};

const Hero = styled.h2`
  margin: 0 0 14px;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: ${t.text};
`;

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
  min-width: 280px;
`;

const Th = styled.th`
  padding: 6px 10px;
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

const PercentTh = styled(Th)`
  text-align: right;
  width: 88px;
`;

const Td = styled.td`
  padding: 4px 10px;
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

const PercentCell = styled(Td)`
  text-align: right;
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

const PercentBadge = styled.span<{ $tone: CompletionTone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: ${({ $tone }) => {
    if ($tone === 'ok') return '#052e16';
    if ($tone === 'warn') return '#422006';
    if ($tone === 'bad') return '#450a0a';
    return t.muted;
  }};
  background: ${({ $tone }) => {
    if ($tone === 'ok') return 'rgba(34, 197, 94, 0.92)';
    if ($tone === 'warn') return 'rgba(251, 191, 36, 0.92)';
    if ($tone === 'bad') return 'rgba(248, 113, 113, 0.88)';
    return 'rgba(148, 163, 184, 0.18)';
  }};
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

export function AdminYcaPage() {
  const { user, isLoading } = useAppAuth();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [yesterdayPercentByStudent, setYesterdayPercentByStudent] = useState<
    Record<string, number | null>
  >({});
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  const today = useMemo(() => new Date(), []);
  const yesterdayKey = useMemo(() => toDateKey(buildDaysFromOffsets(-1, -1)[0]), []);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    let cancelled = false;

    const load = async () => {
      setPageLoading(true);
      setError('');
      try {
        const [studentRows, orgTasks] = await Promise.all([
          fetchStudents(),
          fetchOrgTasksForDates([yesterdayKey]),
        ]);

        if (cancelled) return;

        const percents: Record<string, number | null> = {};
        for (const student of studentRows) {
          const tasks = orgTasks[student.id]?.[yesterdayKey] ?? [];
          percents[student.id] = tasks.length === 0 ? null : computeCompletionPercent(tasks);
        }

        setStudents(studentRows);
        setYesterdayPercentByStudent(percents);
      } catch {
        if (!cancelled) setError('Dün tamamlama analizi yüklenemedi.');
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user, yesterdayKey]);

  const visibleRows = useMemo((): StudentRow[] => {
    const rows: StudentRow[] = students
      .filter((student) => !hiddenIds.has(student.id))
      .map((student) => ({
        student,
        yesterdayPercent: yesterdayPercentByStudent[student.id] ?? null,
      }));

    rows.sort((a, b) => {
      const keyDiff = completionSortKey(a.yesterdayPercent) - completionSortKey(b.yesterdayPercent);
      if (keyDiff !== 0) return keyDiff;
      return a.student.name.localeCompare(b.student.name, 'tr');
    });

    return rows;
  }, [students, hiddenIds, yesterdayPercentByStudent]);

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
        <TopBarTitle>Dün Tamamlama</TopBarTitle>
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
            <Hero>Bugün {formatDayHeading(today)}</Hero>
            <ContentTitle>
              <BarChart2 size={18} strokeWidth={2.4} style={{ marginRight: 8, verticalAlign: -3 }} />
              Dün tamamlama
            </ContentTitle>
            <ContentSub>
              Öğrenciler dünkü görev tamamlama yüzdesine göre sıralı (en düşük üstte). Görev yoksa
              —.
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
                      <Th>Öğrenci</Th>
                      <PercentTh>Dün</PercentTh>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map(({ student, yesterdayPercent }) => (
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
                        <PercentCell>
                          <PercentBadge $tone={completionTone(yesterdayPercent)}>
                            {formatCompletionLabel(yesterdayPercent)}
                          </PercentBadge>
                        </PercentCell>
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
