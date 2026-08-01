import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  fetchStudentShowcaseHighlights,
  updateShowcaseSortOrders,
  updateStudentShowcaseHighlight,
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

const HighlightTextarea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  min-height: 120px;
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font-size: 0.95rem;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: rgba(96, 165, 250, 0.55);
    background: rgba(30, 41, 59, 0.92);
  }

  &::placeholder {
    color: ${t.mutedSoft};
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
  showcaseHighlight: string;
  showcaseSortOrder: number;
};

export function AdminShowcasePage() {
  const { user, isLoading } = useAppAuth();
  const [students, setStudents] = useState<StudentHighlight[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
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
    setDraft(selected?.showcaseHighlight ?? '');
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

  const handleSave = async () => {
    if (!selected) return;
    setIsSaving(true);
    setError('');
    setSavedMessage('');
    try {
      const nextValue = draft.trim();
      await updateStudentShowcaseHighlight(selected.id, nextValue);
      setStudents((current) =>
        current.map((entry) =>
          entry.id === selected.id
            ? { ...entry, showcaseHighlight: nextValue }
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
              Öğrenci seçip serbest metin gir. Soldaki oklarla /ogrenciler sırasını
              değiştir. Boş bırakırsan öne çıkan kart gizlenir.
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
                    <FieldLabel htmlFor="showcase-highlight">Öne çıkan başarı metni</FieldLabel>
                    <HighlightTextarea
                      id="showcase-highlight"
                      placeholder="Örn. TYT 24 netten 52 nete çıkardı"
                      value={draft}
                      onChange={(event) => {
                        setDraft(event.target.value);
                        setSavedMessage('');
                      }}
                    />
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
