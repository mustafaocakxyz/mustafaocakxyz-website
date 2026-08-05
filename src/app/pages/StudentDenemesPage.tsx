import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  createDenemeEntry,
  deleteDenemeEntry,
  fetchDenemesForStudent,
  updateDenemeEntry,
} from '../api/appData';
import { useAppAuth } from '../AppAuthContext';
import { DenemePanel } from '../components/DenemePanel';
import {
  StudentPageBody,
  StudentPageFrame,
  StudentPanelCard,
  StudentShell,
  StudentSubActions,
  StudentSubLink,
  StudentSubTitle,
  StudentSubTopBar,
} from '../components/StudentShell';
import { ErrorText, LoadingText } from '../preview/AdminPreviewUi';
import type { DenemeEntry, DenemeEntryInput } from '../types';

function sortDenemesNewestFirst(entries: DenemeEntry[]): DenemeEntry[] {
  return [...entries].sort((a, b) => {
    if (a.denemeDate !== b.denemeDate) return a.denemeDate < b.denemeDate ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

const DenemeScrollCard = styled(StudentPanelCard)`
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  height: calc(100dvh - 148px);
  max-height: calc(100dvh - 148px);
`;

export function StudentDenemesPage() {
  const { user, isLoading } = useAppAuth();
  const [denemes, setDenemes] = useState<DenemeEntry[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDenemes = useCallback(async (studentId: string) => {
    const rows = await fetchDenemesForStudent(studentId);
    setDenemes(rows);
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'student') return;

    let mounted = true;
    setIsPageLoading(true);
    setError('');

    const run = async () => {
      try {
        await loadDenemes(user.id);
      } catch {
        if (mounted) setError('Deneme kayıtları yüklenemedi.');
      } finally {
        if (mounted) setIsPageLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [user, loadDenemes]);

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

  const upsertDenemeInState = (entry: DenemeEntry) => {
    setDenemes((current) =>
      sortDenemesNewestFirst([entry, ...current.filter((item) => item.id !== entry.id)]),
    );
  };

  const handleCreateDeneme = async (input: DenemeEntryInput) => {
    const created = await createDenemeEntry(user.id, input, user.id);
    upsertDenemeInState(created);
  };

  const handleUpdateDeneme = async (id: string, input: DenemeEntryInput) => {
    const updated = await updateDenemeEntry(id, input);
    upsertDenemeInState(updated);
  };

  const handleDeleteDeneme = async (id: string) => {
    await deleteDenemeEntry(id);
    setDenemes((current) => current.filter((item) => item.id !== id));
  };

  return (
    <StudentShell>
      <StudentSubTopBar>
        <StudentSubTitle>Denemeler</StudentSubTitle>
        <StudentSubActions>
          <StudentSubLink to="/app/student/chat">Sohbet</StudentSubLink>
          <StudentSubLink to="/app/student">← Panele dön</StudentSubLink>
        </StudentSubActions>
      </StudentSubTopBar>

      <StudentPageBody>
        <StudentPageFrame $maxWidth="920px">
          {error ? <ErrorText>{error}</ErrorText> : null}
          {isPageLoading ? <LoadingText>Yükleniyor...</LoadingText> : null}
          <DenemeScrollCard>
            <DenemePanel
              entries={denemes}
              onCreate={handleCreateDeneme}
              onUpdate={handleUpdateDeneme}
              onDelete={handleDeleteDeneme}
            />
          </DenemeScrollCard>
        </StudentPageFrame>
      </StudentPageBody>
    </StudentShell>
  );
}
