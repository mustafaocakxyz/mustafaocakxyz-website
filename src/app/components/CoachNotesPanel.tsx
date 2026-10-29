import { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import {
  DENEME_TYPES,
  computeDenemeNet,
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

const ChartSvg = styled.svg`
  display: block;
  width: 100%;
  height: 148px;
`;

type NetPoint = {
  id: string;
  date: string;
  at: string;
  net: number;
};

function dateToMs(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00`).getTime();
}

function pointTime(point: NetPoint): number {
  const base = dateToMs(point.date);
  const created = Date.parse(point.at);
  if (!Number.isFinite(created)) return base;
  return base + (created % 86_400_000);
}

function formatChartDate(dateKey: string): string {
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(
    new Date(`${dateKey}T12:00:00`),
  );
}

function catmullRomPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function DenemeNetChart({
  points,
  stroke,
  fill,
}: {
  points: NetPoint[];
  stroke: string;
  fill: string;
}) {
  const width = 320;
  const height = 148;
  const pad = { top: 12, right: 12, bottom: 26, left: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const xs = points.map(pointTime);
  const ys = points.map((point) => point.net);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const yPad = minY === maxY ? 1 : (maxY - minY) * 0.12;
  const y0 = minY - yPad;
  const y1 = maxY + yPad;
  const sameX = maxX === minX;
  const xSpan = sameX ? 1 : maxX - minX;
  const mapped = points.map((point, index) => {
    const x =
      pad.left +
      (sameX && points.length > 1
        ? (index / (points.length - 1)) * plotW
        : ((pointTime(point) - minX) / xSpan) * plotW);
    const y = pad.top + ((y1 - point.net) / (y1 - y0)) * plotH;
    return { ...point, x, y };
  });
  const ticksY = [y1, (y0 + y1) / 2, y0];
  const ticksX =
    points.length === 1 || points[0].date === points[points.length - 1].date
      ? [points[0].date]
      : [points[0].date, points[points.length - 1].date];

  return (
    <ChartSvg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Net / tarih grafiği">
      {ticksY.map((value, index) => {
        const y = pad.top + ((y1 - value) / (y1 - y0)) * plotH;
        return (
          <g key={`y-${index}`}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.18"
            />
            <text x={pad.left - 6} y={y + 3.5} textAnchor="end" fontSize="8" fill="currentColor">
              {formatDenemeNet(value)}
            </text>
          </g>
        );
      })}
      {ticksX.map((dateKey, index) => {
        const x =
          mapped.find((point) => point.date === dateKey)?.x ??
          pad.left + (index === 0 ? 0 : plotW);
        return (
          <text
            key={`x-${dateKey}-${index}`}
            x={x}
            y={height - 8}
            textAnchor={index === 0 ? 'start' : 'end'}
            fontSize="8"
            fill="currentColor"
          >
            {formatChartDate(dateKey)}
          </text>
        );
      })}
      {mapped.length > 1 ? (
        <path d={catmullRomPath(mapped)} fill="none" stroke={stroke} strokeWidth="2.2" />
      ) : null}
      {mapped.map((point) => (
        <circle key={point.id} cx={point.x} cy={point.y} r="3.4" fill={fill} stroke={stroke} strokeWidth="1.2">
          <title>{`${formatChartDate(point.date)} · ${formatDenemeNet(point.net)}`}</title>
        </circle>
      ))}
    </ChartSvg>
  );
}

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
  paragraf: {
    bg: 'rgba(249, 115, 22, 0.2)',
    border: 'rgba(249, 115, 22, 0.45)',
    text: 'rgba(255, 237, 213, 0.98)',
  },
  ayt_matematik: {
    bg: 'rgba(14, 165, 233, 0.2)',
    border: 'rgba(14, 165, 233, 0.48)',
    text: 'rgba(224, 242, 254, 0.98)',
  },
};

const AverageCard = styled.div<{ $bg: string; $border: string; $text: string }>`
  border-radius: ${t.radiusSm};
  border: 1px solid ${({ $border }) => $border};
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  overflow: hidden;
`;

const AverageHead = styled.button`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 10px 14px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid rgba(251, 191, 36, 0.55);
    outline-offset: -2px;
  }
`;

const ChartWrap = styled.div`
  padding: 0 8px 10px;
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
  const [expandedTypeIds, setExpandedTypeIds] = useState<Set<DenemeTypeId>>(() => new Set());

  useEffect(() => {
    setEditing(null);
    setGradeDraft(notes.grade ?? '11');
    setCoachDraft(notes.coachNotes);
    setStepDraft(notes.currentStep);
    setSubjectDraft('');
    setDateDraft('');
    setError('');
  }, [notes.studentId, notes.updatedAt, notes.grade, notes.coachNotes, notes.currentStep]);

  useEffect(() => {
    setExpandedTypeIds(new Set());
  }, [notes.studentId]);

  const averages = useMemo(
    () =>
      DENEME_TYPES.flatMap((type) => {
        const ofType = denemes.filter(
          (entry) =>
            entry.typeId === type.id &&
            (!notes.studentId || entry.studentId === notes.studentId),
        );
        if (ofType.length < 3) return [];
        const result = lastThreeDenemeAverage(ofType, type.id);
        if (!result) return [];
        const series = [...ofType]
          .sort((a, b) => {
            if (a.denemeDate !== b.denemeDate) return a.denemeDate < b.denemeDate ? -1 : 1;
            return a.createdAt < b.createdAt ? -1 : 1;
          })
          .map((entry) => ({
            id: entry.id,
            date: entry.denemeDate,
            at: entry.createdAt,
            net: computeDenemeNet(entry.typeId, entry.scores),
          }));
        return [{ typeId: type.id, label: type.label, result, series }];
      }),
    [denemes, notes.studentId],
  );

  const toggleAverage = (typeId: DenemeTypeId) => {
    setExpandedTypeIds((current) => {
      const next = new Set(current);
      if (next.has(typeId)) next.delete(typeId);
      else next.add(typeId);
      return next;
    });
  };

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
              const expanded = expandedTypeIds.has(row.typeId);
              return (
                <AverageCard
                  key={row.typeId}
                  $bg={tone.bg}
                  $border={tone.border}
                  $text={tone.text}
                >
                  <AverageHead
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => toggleAverage(row.typeId)}
                  >
                    <span>{row.label}</span>
                    <strong>{formatDenemeNet(row.result.average)}</strong>
                  </AverageHead>
                  {expanded ? (
                    <ChartWrap>
                      <DenemeNetChart
                        points={row.series}
                        stroke={tone.border}
                        fill={tone.text}
                      />
                    </ChartWrap>
                  ) : null}
                </AverageCard>
              );
            })}
          </AverageTable>
        )}
      </Section>

      {error ? <ErrorText>{error}</ErrorText> : null}
    </Stack>
  );
}
