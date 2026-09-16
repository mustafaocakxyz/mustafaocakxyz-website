import { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import {
  DENEME_TYPES,
  formatDenemeNet,
  lastThreeDenemeAverage,
  type DenemeTypeId,
} from '../data/denemeTypes';
import { preview as t } from '../preview/adminPreviewTheme';
import {
  AccentButton,
  ContentTitle,
  EmptyState,
  ErrorText,
  GhostButton,
} from '../preview/AdminPreviewUi';
import type { DenemeEntry, FinishedStudyStep, StudentCoachNotes, StudentGrade } from '../types';
import { STUDENT_GRADES, studentGradeLabel } from '../types';

type CoachNotesPanelProps = {
  notes: StudentCoachNotes;
  denemes: DenemeEntry[];
  onSave: (
    next: Pick<StudentCoachNotes, 'grade' | 'coachNotes' | 'currentStep' | 'finishedSteps'>,
  ) => Promise<void>;
};

type EditingField = 'grade' | 'coachNotes' | 'currentStep' | 'newStep' | string | null;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const GradeHero = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const GradeValue = styled.p`
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: ${t.warn};
  line-height: 1.2;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
  border-top: 1px solid ${t.border};
`;

const SectionHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

const NoteRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

const BodyText = styled.p`
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 0.92rem;
  line-height: 1.5;
  color: ${t.text};
  white-space: pre-wrap;
  word-break: break-word;
`;

const Muted = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${t.muted};
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${t.muted};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const TextArea = styled.textarea`
  min-height: 96px;
  padding: 12px 14px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font: inherit;
  font-size: 0.92rem;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  line-height: 1.45;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${t.accentBorder};
  }
`;

const TextInput = styled.input`
  padding: 10px 12px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font: inherit;
  font-size: 0.92rem;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;

  &:focus {
    outline: none;
    border-color: ${t.accentBorder};
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;

  &:focus {
    outline: none;
    border-color: ${t.accentBorder};
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const EditButton = styled(GhostButton)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const breath = keyframes`
  0%,
  100% {
    transform: scale(0.85);
    opacity: 0.7;
  }
  50% {
    transform: scale(2.1);
    opacity: 0;
  }
`;

const CurrentStepPill = styled.div`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 10px;
  max-width: 100%;
  padding: 10px 16px 10px 12px;
  border-radius: 999px;
  border: 1px solid rgba(251, 146, 60, 0.45);
  background: rgba(249, 115, 22, 0.18);
  color: rgba(255, 237, 213, 0.98);
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.35;
  white-space: pre-wrap;
  word-break: break-word;
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
  background: #fb923c;
  box-shadow: 0 0 10px rgba(251, 146, 60, 0.75);
  z-index: 1;
`;

const LiveDotPulse = styled.span`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(251, 146, 60, 0.5);
  animation: ${breath} 1.8s ease-in-out infinite;
`;

const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StepRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border-radius: ${t.radiusSm};
  border: 1px solid rgba(52, 211, 153, 0.4);
  background: rgba(16, 185, 129, 0.22);
`;

const StepMain = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const StepCheck = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: rgba(52, 211, 153, 0.28);
  color: ${t.success};
`;

const StepLabel = styled.span`
  font-size: 0.92rem;
  font-weight: 700;
  color: rgba(209, 250, 229, 0.98);
`;

const StepEditGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const AverageTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const AVERAGE_TONES: Record<
  DenemeTypeId,
  { bg: string; border: string; text: string }
> = {
  sayilar: {
    bg: 'rgba(251, 191, 36, 0.18)',
    border: 'rgba(251, 191, 36, 0.42)',
    text: 'rgba(254, 243, 199, 0.98)',
  },
  problemler: {
    bg: 'rgba(244, 63, 94, 0.18)',
    border: 'rgba(244, 63, 94, 0.42)',
    text: 'rgba(255, 228, 230, 0.98)',
  },
  tyt_geometri: {
    bg: 'rgba(168, 85, 247, 0.2)',
    border: 'rgba(168, 85, 247, 0.48)',
    text: 'rgba(243, 232, 255, 0.98)',
  },
  tyt_matematik: {
    bg: 'rgba(59, 130, 246, 0.2)',
    border: 'rgba(59, 130, 246, 0.48)',
    text: 'rgba(219, 234, 254, 0.98)',
  },
  tyt_fen: {
    bg: 'rgba(16, 185, 129, 0.2)',
    border: 'rgba(16, 185, 129, 0.45)',
    text: 'rgba(209, 250, 229, 0.98)',
  },
  tyt_sosyal: {
    bg: 'rgba(20, 184, 166, 0.2)',
    border: 'rgba(20, 184, 166, 0.45)',
    text: 'rgba(204, 251, 241, 0.98)',
  },
  tyt_genel: {
    bg: 'rgba(99, 102, 241, 0.22)',
    border: 'rgba(99, 102, 241, 0.48)',
    text: 'rgba(224, 231, 255, 0.98)',
  },
};

const AverageRow = styled.div<{ $bg: string; $border: string; $text: string }>`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 14px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${({ $border }) => $border};
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  font-size: 0.9rem;
`;

function formatStepLine(step: FinishedStudyStep): string {
  const subject = step.subject.trim() || '—';
  const dateLabel = step.dateLabel.trim();
  return dateLabel ? `${subject} - ${dateLabel}` : subject;
}

export function CoachNotesPanel({ notes, denemes, onSave }: CoachNotesPanelProps) {
  const [editing, setEditing] = useState<EditingField>(null);
  const [gradeDraft, setGradeDraft] = useState<StudentGrade>(notes.grade ?? '11');
  const [coachDraft, setCoachDraft] = useState(notes.coachNotes);
  const [stepDraft, setStepDraft] = useState(notes.currentStep);
  const [subjectDraft, setSubjectDraft] = useState('');
  const [dateDraft, setDateDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEditing(null);
    setGradeDraft(notes.grade ?? '11');
    setCoachDraft(notes.coachNotes);
    setStepDraft(notes.currentStep);
    setSubjectDraft('');
    setDateDraft('');
    setError('');
  }, [notes.studentId, notes.updatedAt, notes.grade, notes.coachNotes, notes.currentStep]);

  const averages = useMemo(
    () =>
      DENEME_TYPES.flatMap((type) => {
        const count = denemes.filter((entry) => entry.typeId === type.id).length;
        if (count < 3) return [];
        const result = lastThreeDenemeAverage(denemes, type.id);
        if (!result) return [];
        return [{ typeId: type.id, label: type.label, result }];
      }),
    [denemes],
  );

  const persist = async (
    next: Pick<StudentCoachNotes, 'grade' | 'coachNotes' | 'currentStep' | 'finishedSteps'>,
  ) => {
    setSaving(true);
    setError('');
    try {
      await onSave(next);
      setEditing(null);
      setSubjectDraft('');
      setDateDraft('');
    } catch {
      setError('Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const startEditStep = (step: FinishedStudyStep) => {
    setEditing(step.id);
    setSubjectDraft(step.subject);
    setDateDraft(step.dateLabel);
  };

  const handleSaveGrade = () =>
    persist({
      grade: gradeDraft,
      coachNotes: notes.coachNotes,
      currentStep: notes.currentStep,
      finishedSteps: notes.finishedSteps,
    });

  const handleSaveCoachNotes = () =>
    persist({
      grade: notes.grade,
      coachNotes: coachDraft,
      currentStep: notes.currentStep,
      finishedSteps: notes.finishedSteps,
    });

  const handleSaveCurrentStep = () =>
    persist({
      grade: notes.grade,
      coachNotes: notes.coachNotes,
      currentStep: stepDraft,
      finishedSteps: notes.finishedSteps,
    });

  const handleSaveFinishedStep = async (existingId: string | null) => {
    const subject = subjectDraft.trim();
    const dateLabel = dateDraft.trim();
    if (!subject || !dateLabel) {
      setError('Konu ve tarih gerekli.');
      return;
    }
    const nextSteps =
      existingId == null
        ? [...notes.finishedSteps, { id: crypto.randomUUID(), subject, dateLabel }]
        : notes.finishedSteps.map((step) =>
            step.id === existingId ? { ...step, subject, dateLabel } : step,
          );
    await persist({
      grade: notes.grade,
      coachNotes: notes.coachNotes,
      currentStep: notes.currentStep,
      finishedSteps: nextSteps,
    });
  };

  const handleRemoveFinishedStep = async (id: string) => {
    await persist({
      grade: notes.grade,
      coachNotes: notes.coachNotes,
      currentStep: notes.currentStep,
      finishedSteps: notes.finishedSteps.filter((step) => step.id !== id),
    });
  };

  return (
    <Stack>
      <GradeHero>
        <GradeValue>{studentGradeLabel(notes.grade)}</GradeValue>
        {editing === 'grade' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
            <Select
              value={gradeDraft}
              onChange={(event) => setGradeDraft(event.target.value as StudentGrade)}
              disabled={saving}
            >
              {STUDENT_GRADES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
            <Actions>
              <AccentButton type="button" disabled={saving} onClick={() => void handleSaveGrade()}>
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </AccentButton>
              <GhostButton type="button" disabled={saving} onClick={() => setEditing(null)}>
                İptal
              </GhostButton>
            </Actions>
          </div>
        ) : (
          <EditButton type="button" onClick={() => setEditing('grade')}>
            <Pencil size={14} /> Düzenle
          </EditButton>
        )}
      </GradeHero>

      <Section>
        {editing === 'coachNotes' ? (
          <>
            <TextArea value={coachDraft} onChange={(event) => setCoachDraft(event.target.value)} />
            <Actions>
              <AccentButton type="button" disabled={saving} onClick={() => void handleSaveCoachNotes()}>
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </AccentButton>
              <GhostButton type="button" disabled={saving} onClick={() => setEditing(null)}>
                İptal
              </GhostButton>
            </Actions>
          </>
        ) : (
          <NoteRow>
            {notes.coachNotes.trim() ? (
              <BodyText>{notes.coachNotes}</BodyText>
            ) : (
              <Muted>Henüz not yok.</Muted>
            )}
            <EditButton
              type="button"
              onClick={() => {
                setCoachDraft(notes.coachNotes);
                setEditing('coachNotes');
              }}
            >
              <Pencil size={14} /> Düzenle
            </EditButton>
          </NoteRow>
        )}
      </Section>

      <Section>
        <SectionHead>
          <div>
            <ContentTitle>Güncel Çalışma Adımı</ContentTitle>
          </div>
          {editing !== 'currentStep' ? (
            <EditButton
              type="button"
              onClick={() => {
                setStepDraft(notes.currentStep);
                setEditing('currentStep');
              }}
            >
              <Pencil size={14} /> Düzenle
            </EditButton>
          ) : null}
        </SectionHead>
        {editing === 'currentStep' ? (
          <>
            <TextArea value={stepDraft} onChange={(event) => setStepDraft(event.target.value)} />
            <Actions>
              <AccentButton type="button" disabled={saving} onClick={() => void handleSaveCurrentStep()}>
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </AccentButton>
              <GhostButton type="button" disabled={saving} onClick={() => setEditing(null)}>
                İptal
              </GhostButton>
            </Actions>
          </>
        ) : notes.currentStep.trim() ? (
          <CurrentStepPill>
            <LiveDotWrap>
              <LiveDotPulse />
              <LiveDotCore />
            </LiveDotWrap>
            <span>{notes.currentStep}</span>
          </CurrentStepPill>
        ) : (
          <Muted>Henüz adım yazılmadı.</Muted>
        )}
      </Section>

      <Section>
        <SectionHead>
          <div>
            <ContentTitle>Bitirilen Adımlar</ContentTitle>
          </div>
          {editing !== 'newStep' ? (
            <EditButton
              type="button"
              onClick={() => {
                setSubjectDraft('');
                setDateDraft('');
                setEditing('newStep');
              }}
            >
              <Plus size={14} /> Ekle
            </EditButton>
          ) : null}
        </SectionHead>

        {editing === 'newStep' ? (
          <>
            <StepEditGrid>
              <Field>
                Konu
                <TextInput
                  value={subjectDraft}
                  placeholder="TYT Matematik"
                  onChange={(event) => setSubjectDraft(event.target.value)}
                />
              </Field>
              <Field>
                Tarih
                <TextInput
                  value={dateDraft}
                  placeholder="18 Ağustos"
                  onChange={(event) => setDateDraft(event.target.value)}
                />
              </Field>
            </StepEditGrid>
            <Actions>
              <AccentButton
                type="button"
                disabled={saving}
                onClick={() => void handleSaveFinishedStep(null)}
              >
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </AccentButton>
              <GhostButton type="button" disabled={saving} onClick={() => setEditing(null)}>
                İptal
              </GhostButton>
            </Actions>
          </>
        ) : null}

        {notes.finishedSteps.length === 0 && editing !== 'newStep' ? (
          <EmptyState>Henüz bitirilen adım yok.</EmptyState>
        ) : (
          <StepList>
            {notes.finishedSteps.map((step) =>
              editing === step.id ? (
                <div key={step.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <StepEditGrid>
                    <Field>
                      Konu
                      <TextInput
                        value={subjectDraft}
                        onChange={(event) => setSubjectDraft(event.target.value)}
                      />
                    </Field>
                    <Field>
                      Tarih
                      <TextInput
                        value={dateDraft}
                        onChange={(event) => setDateDraft(event.target.value)}
                      />
                    </Field>
                  </StepEditGrid>
                  <Actions>
                    <AccentButton
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSaveFinishedStep(step.id)}
                    >
                      {saving ? 'Kaydediliyor…' : 'Kaydet'}
                    </AccentButton>
                    <GhostButton type="button" disabled={saving} onClick={() => setEditing(null)}>
                      İptal
                    </GhostButton>
                  </Actions>
                </div>
              ) : (
                <StepRow key={step.id}>
                  <StepMain>
                    <StepCheck>
                      <Check size={14} strokeWidth={3} />
                    </StepCheck>
                    <StepLabel>{formatStepLine(step)}</StepLabel>
                  </StepMain>
                  <Actions>
                    <EditButton type="button" onClick={() => startEditStep(step)}>
                      <Pencil size={14} />
                    </EditButton>
                    <EditButton
                      type="button"
                      disabled={saving}
                      onClick={() => void handleRemoveFinishedStep(step.id)}
                    >
                      <Trash2 size={14} />
                    </EditButton>
                  </Actions>
                </StepRow>
              ),
            )}
          </StepList>
        )}
      </Section>

      <Section>
        <div>
          <ContentTitle>Deneme Ortalamaları</ContentTitle>
        </div>
        {averages.length === 0 ? (
          <EmptyState>Son 3 kaydı olan deneme türü yok.</EmptyState>
        ) : (
          <AverageTable>
            {averages.map((row) => {
              const tone = AVERAGE_TONES[row.typeId];
              return (
                <AverageRow
                  key={row.typeId}
                  $bg={tone.bg}
                  $border={tone.border}
                  $text={tone.text}
                >
                  <span>{row.label}</span>
                  <strong>{formatDenemeNet(row.result.average)}</strong>
                </AverageRow>
              );
            })}
          </AverageTable>
        )}
      </Section>

      {error ? <ErrorText>{error}</ErrorText> : null}
    </Stack>
  );
}
