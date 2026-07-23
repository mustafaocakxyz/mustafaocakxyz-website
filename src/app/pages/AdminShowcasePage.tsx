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
import {
  AdminCard,
  AdminContent,
  AdminShell,
  AppCardTitle,
  AppSubtitle,
  BlueTitle,
} from '../components/AppShell';
import { PrimaryButton } from '../components/AppUi';
import { getFormAccent } from '../../styles/formTheme';

const accent = getFormAccent('blue');

const BackLink = styled(Link)`
  display: inline-block;
  margin-bottom: 12px;
  color: rgba(100, 181, 246, 0.9);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;

  &:hover {
    color: rgba(144, 202, 249, 1);
  }
`;

const LoadingText = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
`;

const ErrorText = styled.p`
  margin: 0;
  color: #ff8a80;
`;

const SuccessText = styled.p`
  margin: 0;
  color: rgba(165, 214, 167, 0.95);
`;

const EditorGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 300px) 1fr;
  gap: 20px;

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
  border-radius: 14px;
  border: 1px solid
    ${({ $selected }) =>
      $selected ? 'rgba(66, 165, 245, 0.65)' : 'rgba(66, 165, 245, 0.22)'};
  background: ${({ $selected }) =>
    $selected ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 255, 255, 0.04)'};
`;

const StudentButton = styled.button`
  flex: 1;
  min-width: 0;
  text-align: left;
  padding: 12px 14px;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.92rem;
  font-weight: 500;
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
  background: rgba(255, 255, 255, 0.06);
  color: rgba(144, 202, 249, 0.95);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
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
  font-size: 0.88rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
`;

const HighlightTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid ${accent.inputBorder};
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.95rem;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: ${accent.inputBorderFocus};
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const Hint = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.45;
`;

const SaveRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SaveButton = styled(PrimaryButton)`
  width: auto;
  min-width: 140px;
  padding: 12px 22px;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }
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
    <AdminShell>
      <AdminContent>
        <div>
          <BackLink to="/app/admin">← Admin paneline dön</BackLink>
          <BlueTitle>Kayda değer</BlueTitle>
          <AppSubtitle style={{ marginTop: 8 }}>
            Öğrenci seçip serbest metin gir. Soldaki oklarla /ogrenciler sırasını
            değiştir. Boş bırakırsan öne çıkan kart gizlenir.
          </AppSubtitle>
        </div>

        {error ? <ErrorText>{error}</ErrorText> : null}
        {isPageLoading ? <LoadingText>Yükleniyor...</LoadingText> : null}

        <EditorGrid>
          <AdminCard>
            <AppCardTitle>Öğrenciler</AppCardTitle>
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
                <AppSubtitle>Henüz öğrenci yok.</AppSubtitle>
              ) : null}
            </StudentList>
          </AdminCard>

          <AdminCard>
            <AppCardTitle>
              {selected ? selected.name : 'Öğrenci seç'}
            </AppCardTitle>
            {selected ? (
              <FieldsStack>
                <div>
                  <FieldLabel htmlFor="showcase-highlight">Öne çıkan başarı metni</FieldLabel>
                  <HighlightTextarea
                    id="showcase-highlight"
                    style={{ marginTop: 8 }}
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
                  <SaveButton type="button" disabled={isSaving} onClick={() => void handleSave()}>
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </SaveButton>
                  {savedMessage ? <SuccessText>{savedMessage}</SuccessText> : null}
                </SaveRow>
              </FieldsStack>
            ) : (
              <AppSubtitle>Düzenlemek için soldan bir öğrenci seç.</AppSubtitle>
            )}
          </AdminCard>
        </EditorGrid>
      </AdminContent>
    </AdminShell>
  );
}
