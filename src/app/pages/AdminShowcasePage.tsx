import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  fetchStudentShowcaseHighlights,
  updateShowcaseSortOrders,
  updateStudentShowcaseHighlights,
} from '../api/appData';
import { useAppAuth } from '../AppAuthContext';
import { preview as t } from '../preview/adminPreviewTheme';
import {
  AccentButton,
  ContentCard,
  ContentSub,
  ContentTitle,
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

const PageIntro = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const EditorGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 300px) 1fr;
  gap: 18px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const StudentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StudentRow = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: stretch;
  gap: 6px;
  border-radius: ${t.radiusMd};
  border: 2px solid
    ${({ $selected }) =>
      $selected ? 'rgba(96, 165, 250, 0.55)' : t.border};
  background: ${({ $selected }) =>
    $selected ? 'rgba(59, 130, 246, 0.14)' : t.panel2};
  box-shadow: ${({ $selected }) =>
    $selected
      ? '0 0 0 1px rgba(96, 165, 250, 0.2), 0 0 20px rgba(59, 130, 246, 0.28)'
      : 'none'};
`;

const StudentButton = styled.button`
  flex: 1;
  min-width: 0;
  text-align: left;
  padding: 12px 14px;
  border: none;
  border-radius: ${t.radiusMd};
  background: transparent;
  color: ${t.text};
  font-size: 0.92rem;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
`;

const OrderControls = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  padding: 4px 6px 4px 0;
`;

const OrderButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 22px;
  border: none;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.55);
  color: ${t.muted};
  cursor: pointer;

  &:hover:not(:disabled) {
    color: ${t.text};
    background: rgba(59, 130, 246, 0.18);
  }

  &:disabled {
    opacity: 0.28;
    cursor: not-allowed;
  }
`;

const FieldsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const FieldLabel = styled.label`
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${t.muted};
`;

const PillEditorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;

const PillEditorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PillInput = styled.input`
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font-size: 0.92rem;
  font-family: inherit;
  outline: none;

  &:focus {
    border-color: rgba(96, 165, 250, 0.55);
    background: rgba(30, 41, 59, 0.92);
  }

  &::placeholder {
    color: ${t.mutedSoft};
  }
`;

const IconActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.muted};
  cursor: pointer;

  &:hover:not(:disabled) {
    color: ${t.text};
    border-color: rgba(96, 165, 250, 0.45);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const DangerIconButton = styled(IconActionButton)`
  &:hover:not(:disabled) {
    color: #f87171;
    border-color: rgba(248, 113, 113, 0.45);
    background: rgba(248, 113, 113, 0.1);
  }
`;

const AddPillButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  margin-top: 4px;
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px dashed rgba(96, 165, 250, 0.45);
  background: rgba(59, 130, 246, 0.08);
  color: rgba(147, 197, 253, 0.95);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: rgba(59, 130, 246, 0.14);
    border-color: rgba(96, 165, 250, 0.65);
  }
`;

const Hint = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: ${t.mutedSoft};
  line-height: 1.45;
`;

const SaveRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SuccessText = styled.p`
  margin: 0;
  color: ${t.success};
  font-size: 0.9rem;
  font-weight: 600;
`;

type StudentHighlight = {
  id: string;
  name: string;
  showcaseHighlights: string[];
  showcaseSortOrder: number;
};

export function AdminShowcasePage() {
  const { user, isLoading } = useAppAuth();
  const [students, setStudents] = useState<StudentHighlight[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    let isMounted = true;

    const load = async () => {
      setIsPageLoading(true);
      setError('');
      try {
        const rows = await fetchStudentShowcaseHighlights();
        if (!isMounted) return;
        setStudents(rows);
        if (rows.length > 0) {
          setSelectedId((current) => current ?? rows[0].id);
        }
      } catch {
        if (isMounted) setError('Öğrenciler yüklenemedi.');
      } finally {
        if (isMounted) setIsPageLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    const selected = students.find((entry) => entry.id === selectedId);
    setDraft([...(selected?.showcaseHighlights ?? [])]);
    setSavedMessage('');
  }, [selectedId, students]);

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

  const selected = students.find((entry) => entry.id === selectedId) ?? null;

  const updateDraftAt = (index: number, value: string) => {
    setDraft((current) => current.map((entry, i) => (i === index ? value : entry)));
    setSavedMessage('');
  };

  const removeDraftAt = (index: number) => {
    setDraft((current) => current.filter((_, i) => i !== index));
    setSavedMessage('');
  };

  const addDraftPill = () => {
    setDraft((current) => [...current, '']);
    setSavedMessage('');
  };

  const handleSave = async () => {
    if (!selected) return;
    setIsSaving(true);
    setError('');
    setSavedMessage('');
    try {
      const nextValue = draft.map((entry) => entry.trim()).filter(Boolean);
      await updateStudentShowcaseHighlights(selected.id, nextValue);
      setStudents((current) =>
        current.map((entry) =>
          entry.id === selected.id
            ? { ...entry, showcaseHighlights: nextValue }
            : entry,
        ),
      );
      setDraft(nextValue);
      setSavedMessage('Kaydedildi.');
    } catch {
      setError('Kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  const moveStudent = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= students.length || isReordering) return;

    const previous = students;
    const next = [...students];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    const withOrder = next.map((entry, sortOrder) => ({
      ...entry,
      showcaseSortOrder: sortOrder,
    }));

    setStudents(withOrder);
    setIsReordering(true);
    setError('');
    try {
      await updateShowcaseSortOrders(withOrder.map((entry) => entry.id));
    } catch {
      setStudents(previous);
      setError('Sıra kaydedilemedi.');
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <PreviewShell>
      <PreviewTopBar>
        <TopBarTitle>Kayda değer</TopBarTitle>
        <TopBarActions>
          <TopBarButton as={Link} to="/app/admin">
            ← Admin paneline dön
          </TopBarButton>
        </TopBarActions>
        <TopBarEnd />
      </PreviewTopBar>

      <PreviewBody>
        <PreviewFrame>
          <PageIntro>
            <ContentSub>
              Öğrenci seçip istediğin kadar pill ekle. Soldaki oklarla /ogrenciler
              sırasını değiştir. Hiçbir pill yoksa öne çıkan alan gizlenir.
            </ContentSub>
          </PageIntro>

          {error ? <ErrorText>{error}</ErrorText> : null}
          {isPageLoading ? <LoadingText>Yükleniyor...</LoadingText> : null}

          <EditorGrid>
            <ContentCard>
              <ContentTitle>Öğrenciler</ContentTitle>
              <StudentList>
                {students.map((student, index) => (
                  <StudentRow key={student.id} $selected={student.id === selectedId}>
                    <StudentButton type="button" onClick={() => setSelectedId(student.id)}>
                      {student.name}
                    </StudentButton>
                    <OrderControls>
                      <OrderButton
                        type="button"
                        aria-label="Yukarı taşı"
                        disabled={index === 0 || isReordering}
                        onClick={() => void moveStudent(index, -1)}
                      >
                        <ChevronUp size={14} />
                      </OrderButton>
                      <OrderButton
                        type="button"
                        aria-label="Aşağı taşı"
                        disabled={index === students.length - 1 || isReordering}
                        onClick={() => void moveStudent(index, 1)}
                      >
                        <ChevronDown size={14} />
                      </OrderButton>
                    </OrderControls>
                  </StudentRow>
                ))}
                {students.length === 0 && !isPageLoading ? (
                  <ContentSub>Henüz öğrenci yok.</ContentSub>
                ) : null}
              </StudentList>
            </ContentCard>

            <ContentCard>
              <ContentTitle>{selected ? selected.name : 'Öğrenci seç'}</ContentTitle>
              {selected ? (
                <FieldsStack>
                  <div>
                    <FieldLabel>Kayda değer pilleri</FieldLabel>
                    <PillEditorList>
                      {draft.map((value, index) => (
                        <PillEditorRow key={`pill-${index}`}>
                          <PillInput
                            value={value}
                            placeholder="Örn. TYT 24 → 52"
                            onChange={(event) => updateDraftAt(index, event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                void handleSave();
                              }
                            }}
                          />
                          <DangerIconButton
                            type="button"
                            aria-label="Pili sil"
                            onClick={() => removeDraftAt(index)}
                          >
                            <Trash2 size={15} />
                          </DangerIconButton>
                        </PillEditorRow>
                      ))}
                    </PillEditorList>
                    <AddPillButton type="button" onClick={addDraftPill}>
                      <Plus size={15} />
                      Pill ekle
                    </AddPillButton>
                  </div>
                  <Hint>
                    Örnekler: “6+ saat çalışma”, “AYT Mat 0 → 16”, “22 gündür aktif”
                  </Hint>
                  <SaveRow>
                    <AccentButton
                      type="button"
                      disabled={isSaving}
                      onClick={() => void handleSave()}
                    >
                      {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </AccentButton>
                    {savedMessage ? <SuccessText>{savedMessage}</SuccessText> : null}
                  </SaveRow>
                </FieldsStack>
              ) : (
                <ContentSub>Düzenlemek için soldan bir öğrenci seç.</ContentSub>
              )}
            </ContentCard>
          </EditorGrid>
        </PreviewFrame>
      </PreviewBody>
    </PreviewShell>
  );
}
