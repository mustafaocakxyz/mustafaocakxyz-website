import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  fetchCurriculumCatalog,
  fetchDenemesForStudent,
  fetchStudentCurriculumState,
  upsertMaterialTopicProgress,
  upsertSubjectTopicProgress,
} from '../api/appData';
import { useAppAuth } from '../AppAuthContext';
import { KonuMateryalPanel } from '../components/KonuMateryalPanel';
import {
  StudentPageBody,
  StudentPageFrame,
  StudentShell,
  StudentSubActions,
  StudentSubLink,
  StudentSubTitle,
  StudentSubTopBar,
} from '../components/StudentShell';
import { ErrorText, LoadingText } from '../preview/AdminPreviewUi';
import type {
  CurriculumCatalog,
  DenemeEntry,
  StudentCurriculumState,
  TopicStatus,
} from '../types';

const emptyState = (): StudentCurriculumState => ({
  subjectIds: [],
  materialIds: [],
  subjectProgress: [],
  materialProgress: [],
});

export function StudentKonuPage() {
  const { user, isLoading } = useAppAuth();
  const [catalog, setCatalog] = useState<CurriculumCatalog>({ subjects: [], materials: [] });
  const [state, setState] = useState<StudentCurriculumState>(emptyState);
  const [denemes, setDenemes] = useState<DenemeEntry[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async (studentId: string) => {
    const [nextCatalog, nextState, nextDenemes] = await Promise.all([
      fetchCurriculumCatalog(),
      fetchStudentCurriculumState(studentId),
      fetchDenemesForStudent(studentId),
    ]);
    setCatalog(nextCatalog);
    setState(nextState);
    setDenemes(nextDenemes);
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    let mounted = true;
    setPageLoading(true);
    setError('');
    void (async () => {
      try {
        await reload(user.id);
      } catch {
        if (mounted) setError('Konu & materyal yüklenemedi.');
      } finally {
        if (mounted) setPageLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user, reload]);

  if (isLoading) {
    return (
      <StudentShell>
        <StudentPageFrame>
          <LoadingText>Yükleniyor...</LoadingText>
        </StudentPageFrame>
      </StudentShell>
    );
  }

  if (!user) return <Navigate to="/app" replace />;
  if (user.role !== 'student') return <Navigate to="/app/admin" replace />;

  const handleUpdateSubjectTopic = async (topicId: string, status: TopicStatus) => {
    await upsertSubjectTopicProgress(user.id, topicId, status);
    const subjectId =
      catalog.subjects.find((s) => s.topics.some((topic) => topic.id === topicId))?.id ?? '';
    setState((current) => ({
      ...current,
      subjectProgress: [
        ...current.subjectProgress.filter((row) => row.topicId !== topicId),
        { topicId, subjectId, status },
      ],
    }));
  };

  const handleUpdateMaterialTopic = async (
    topicId: string,
    input: {
      status: TopicStatus;
      correctCount: number | null;
      questionCount: number | null;
    },
  ) => {
    await upsertMaterialTopicProgress(user.id, topicId, input);
    const materialId =
      catalog.materials.find((m) => m.topics.some((topic) => topic.id === topicId))?.id ?? '';
    setState((current) => ({
      ...current,
      materialProgress: [
        ...current.materialProgress.filter((row) => row.topicId !== topicId),
        {
          topicId,
          materialId,
          status: input.status,
          correctCount: input.correctCount,
          questionCount: input.questionCount,
        },
      ],
    }));
  };

  return (
    <StudentShell>
      <StudentSubTopBar>
        <StudentSubTitle>Konu & Materyal</StudentSubTitle>
        <StudentSubActions>
          <StudentSubLink to="/app/student/denemeler">Denemeler</StudentSubLink>
          <StudentSubLink to="/app/student">← Panele dön</StudentSubLink>
        </StudentSubActions>
      </StudentSubTopBar>

      <StudentPageBody>
        <StudentPageFrame $maxWidth="920px">
          {error ? <ErrorText>{error}</ErrorText> : null}
          {pageLoading ? <LoadingText>Yükleniyor...</LoadingText> : null}
          <KonuMateryalPanel
            catalog={catalog}
            state={state}
            denemes={denemes}
            canEnroll={false}
            onEnrollSubject={async () => undefined}
            onUnenrollSubject={async () => undefined}
            onEnrollMaterial={async () => undefined}
            onUnenrollMaterial={async () => undefined}
            onUpdateSubjectTopic={handleUpdateSubjectTopic}
            onUpdateMaterialTopic={handleUpdateMaterialTopic}
          />
        </StudentPageFrame>
      </StudentPageBody>
    </StudentShell>
  );
}
