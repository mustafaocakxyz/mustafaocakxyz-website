import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, NotebookPen, Pencil, Plus, Trash2, Video, X } from 'lucide-react';
import styled from 'styled-components';
import {
  formatHourOptionLabel,
  HOUR_TIME_OPTIONS,
  MINUTE_TIME_OPTIONS,
  type DailySubmission,
  type StudentMeeting,
  type StudentTask,
} from '../types';
import {
  buildUpcomingDays,
  formatDayHeading,
  normalizeMeetingLink,
  toDateKey,
} from '../utils/dates';
import { composeTaskLabel } from '../utils/taskLabel';
import { preview as t } from './adminPreviewTheme';
import {
  ContentTitle,
  NestedCard,
  SectionStack,
} from './AdminPreviewUi';

const TaskStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TaskRow = styled.div<{ $completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  opacity: ${({ $completed }) => ($completed ? 0.72 : 1)};
`;

const StatusIndicator = styled.span<{ $checked: boolean }>`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid
    ${({ $checked }) => ($checked ? 'rgba(96, 165, 250, 0.7)' : t.borderStrong)};
  background: ${({ $checked }) =>
    $checked ? 'rgba(59, 130, 246, 0.28)' : 'rgba(15, 23, 42, 0.5)'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${t.text};
`;

const TaskLabel = styled.span<{ $completed: boolean }>`
  flex: 1;
  min-width: 0;
  font-size: 0.94rem;
  line-height: 1.4;
  color: ${({ $completed }) => ($completed ? t.mutedSoft : t.text)};
  text-decoration: ${({ $completed }) => ($completed ? 'line-through' : 'none')};
`;

const DurationPill = styled.span`
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid ${t.border};
  background: rgba(59, 130, 246, 0.12);
  color: rgba(191, 219, 254, 0.95);
  font-size: 0.72rem;
  font-weight: 700;
`;

const TaskInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border-radius: ${t.radiusSm};
  border: 1px solid rgba(96, 165, 250, 0.45);
  background: ${t.panel};
  color: ${t.text};
  font: inherit;
  font-size: 0.92rem;
  outline: none;
`;

const IconButton = styled.button<{ $danger?: boolean; $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 32px;
  height: 32px;
  padding: 0 10px;
  flex-shrink: 0;
  border-radius: ${t.radiusSm};
  border: 1px solid
    ${({ $danger, $primary }) =>
      $danger
        ? 'rgba(248, 113, 113, 0.4)'
        : $primary
          ? 'rgba(96, 165, 250, 0.45)'
          : t.borderStrong};
  background: ${({ $primary }) =>
    $primary ? 'rgba(59, 130, 246, 0.16)' : t.panel};
  color: ${({ $danger, $primary }) =>
    $danger ? t.danger : $primary ? 'rgba(191, 219, 254, 0.98)' : t.muted};
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    color: ${t.text};
    border-color: ${({ $danger }) =>
      $danger ? 'rgba(248, 113, 113, 0.6)' : 'rgba(96, 165, 250, 0.55)'};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const AddRow = styled.div`
  display: flex;
  gap: 10px;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const AddInput = styled.input`
  flex: 1;
  padding: 12px 14px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font: inherit;
  font-size: 0.92rem;
  outline: none;

  &:focus {
    border-color: rgba(96, 165, 250, 0.55);
  }

  &::placeholder {
    color: ${t.mutedSoft};
  }
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 18px;
  min-height: 46px;
  border: 1px solid rgba(96, 165, 250, 0.5);
  border-radius: ${t.radiusMd};
  background: rgba(59, 130, 246, 0.2);
  color: rgba(219, 234, 254, 0.98);
  font: inherit;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: rgba(59, 130, 246, 0.28);
  }
`;

const SoftEmpty = styled.p`
  margin: 0;
  padding: 8px 2px;
  font-size: 0.9rem;
  color: ${t.muted};
`;

const FieldsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.label`
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${t.muted};
`;

const FieldValue = styled.div`
  padding: 12px 14px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.45;
  white-space: pre-wrap;
`;

const SleepRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const fieldControl = `
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font-size: 0.92rem;
  font-family: inherit;
  outline: none;
  color-scheme: dark;

  &:focus {
    border-color: rgba(96, 165, 250, 0.55);
  }

  &::placeholder {
    color: ${t.mutedSoft};
  }
`;

const FieldSelect = styled.select`
  ${fieldControl}
  appearance: none;

  option {
    background: ${t.panel};
    color: ${t.text};
  }
`;

const FieldInput = styled.input`
  ${fieldControl}
`;

const NoteTextarea = styled.textarea`
  ${fieldControl}
  flex: 1;
  resize: none;
  min-height: 176px;
  line-height: 1.5;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const DayNoteFields = styled(FieldsStack)`
  flex: 1;
  min-height: 0;
`;

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const JoinLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.45);
  background: rgba(59, 130, 246, 0.16);
  color: rgba(191, 219, 254, 0.98);
  font-size: 0.86rem;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    background: rgba(59, 130, 246, 0.24);
  }
`;

const MetaText = styled.p`
  margin: 0;
  font-size: 0.94rem;
  line-height: 1.45;
  color: ${t.text};
  font-weight: 600;
`;

const StatusText = styled.span<{ $error?: boolean }>`
  font-size: 0.84rem;
  color: ${({ $error }) => ($error ? t.danger : t.success)};
`;

const TimeRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  align-items: center;
`;

const TimeSep = styled.span`
  color: ${t.muted};
  font-weight: 700;
`;

const PlanButton = styled.button`
  width: 100%;
  padding: 14px 18px;
  border-radius: ${t.radiusMd};
  border: 1px solid rgba(96, 165, 250, 0.5);
  background: rgba(59, 130, 246, 0.18);
  color: rgba(219, 234, 254, 0.98);
  font: inherit;
  font-size: 0.92rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: rgba(59, 130, 246, 0.26);
  }
`;

function displayOrDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

const NoteCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding-left: 40px;
  min-height: 32px;
`;

const NoteMinimizeButton = styled.button`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.borderStrong};
  background: ${t.panel2};
  color: ${t.muted};
  cursor: pointer;

  &:hover {
    color: ${t.text};
    border-color: rgba(96, 165, 250, 0.5);
  }
`;

const NoteFab = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  border: 1px solid rgba(96, 165, 250, 0.45);
  background: rgba(59, 130, 246, 0.16);
  color: rgba(191, 219, 254, 0.98);
  cursor: pointer;
  box-shadow: 0 0 16px rgba(59, 130, 246, 0.18);

  &:hover {
    background: rgba(59, 130, 246, 0.24);
  }
`;

const DayNoteCard = styled(NestedCard)`
  position: relative;
  min-height: 356px;
`;

/** Sits in the right viewport gutter; does not shrink the main frame. */
const DayNoteRail = styled.aside<{ $top: number | null }>`
  position: absolute;
  top: ${({ $top }) => ($top == null ? '22px' : `${$top}px`)};
  left: calc(var(--preview-frame-left) + var(--preview-frame-max) + 14px);
  width: min(300px, calc(100% - var(--preview-frame-left) - var(--preview-frame-max) - 28px));
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;

  @media (max-width: 1520px) {
    position: static;
    left: auto;
    top: auto;
    width: 100%;
    max-width: var(--preview-frame-max);
    box-sizing: border-box;
    padding: 0 48px 40px;
    margin-top: -24px;
    margin-left: var(--preview-frame-left);
  }

  @media (max-width: 1100px) {
    padding: 0 32px 40px;
  }

  @media (max-width: 768px) {
    padding: 0 16px 32px;
  }
`;

const TASKS_CARD_ID = 'preview-admin-tasks-card';

export function PreviewTasksSection({
  tasks,
  onAdd,
  onEdit,
  onDelete,
}: {
  tasks: StudentTask[];
  onAdd: (label: string) => void;
  onEdit: (taskId: string, label: string) => void;
  onDelete: (taskId: string) => void;
}) {
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  const startEditing = (task: StudentTask) => {
    setEditingTaskId(task.id);
    setEditingLabel(composeTaskLabel(task.label, task.durationLabel));
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingLabel('');
  };

  const saveEditing = () => {
    if (!editingTaskId) return;
    const trimmed = editingLabel.trim();
    if (!trimmed) return;
    onEdit(editingTaskId, trimmed);
    cancelEditing();
  };

  const handleAdd = () => {
    const trimmed = newTaskLabel.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewTaskLabel('');
  };

  return (
    <SectionStack>
      <NestedCard id={TASKS_CARD_ID}>
        {tasks.length === 0 ? <SoftEmpty>Bu gün için görev yok.</SoftEmpty> : null}
        <TaskStack>
          {tasks.map((task) => {
            const isEditing = editingTaskId === task.id;
            return (
              <TaskRow key={task.id} $completed={task.completed}>
                <StatusIndicator $checked={task.completed}>
                  {task.completed ? <Check size={14} strokeWidth={3} /> : null}
                </StatusIndicator>
                {isEditing ? (
                  <TaskInput
                    value={editingLabel}
                    autoFocus
                    onChange={(event) => setEditingLabel(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') saveEditing();
                      if (event.key === 'Escape') cancelEditing();
                    }}
                  />
                ) : (
                  <>
                    <TaskLabel $completed={task.completed}>{task.label}</TaskLabel>
                    {task.durationLabel ? (
                      <DurationPill>{task.durationLabel}</DurationPill>
                    ) : null}
                  </>
                )}
                {isEditing ? (
                  <>
                    <IconButton type="button" aria-label="Kaydet" $primary onClick={saveEditing}>
                      <Check size={15} />
                    </IconButton>
                    <IconButton type="button" aria-label="İptal" onClick={cancelEditing}>
                      <X size={15} />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <IconButton
                      type="button"
                      aria-label="Düzenle"
                      onClick={() => startEditing(task)}
                    >
                      <Pencil size={15} />
                    </IconButton>
                    <IconButton
                      type="button"
                      aria-label="Sil"
                      $danger
                      onClick={() => onDelete(task.id)}
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </>
                )}
              </TaskRow>
            );
          })}
        </TaskStack>
      </NestedCard>

      <NestedCard>
        <ContentTitle>Görev ekle</ContentTitle>
        <AddRow>
          <AddInput
            placeholder="Örn. TYT Mat | Soru Çözümü | 2 saat"
            value={newTaskLabel}
            onChange={(event) => setNewTaskLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleAdd();
            }}
          />
          <AddButton type="button" onClick={handleAdd}>
            <Plus size={16} />
            Ekle
          </AddButton>
        </AddRow>
      </NestedCard>
    </SectionStack>
  );
}

export function PreviewDayNoteRail({
  dayNote,
  onSaveDayNote,
}: {
  dayNote: string;
  onSaveDayNote: (body: string) => Promise<void>;
}) {
  const railRef = useRef<HTMLElement>(null);
  const [noteOpen, setNoteOpen] = useState(true);
  const [topPx, setTopPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const tasksEl = document.getElementById(TASKS_CARD_ID);
    const parent = railRef.current?.offsetParent as HTMLElement | null;
    if (!tasksEl || !parent) return;

    const sync = () => {
      const tasksRect = tasksEl.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      setTopPx(Math.round(tasksRect.top - parentRect.top));
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(tasksEl);
    observer.observe(parent);
    window.addEventListener('resize', sync);
    window.addEventListener('scroll', sync, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
      window.removeEventListener('scroll', sync, true);
    };
  }, [noteOpen]);

  if (!noteOpen) {
    return (
      <DayNoteRail ref={railRef} $top={topPx}>
        <NoteFab
          type="button"
          aria-label="Güne özel notu aç"
          title="Güne özel not"
          onClick={() => setNoteOpen(true)}
        >
          <NotebookPen size={20} />
        </NoteFab>
      </DayNoteRail>
    );
  }

  return (
    <DayNoteRail ref={railRef} $top={topPx}>
      <DayNoteCard>
        <NoteMinimizeButton
          type="button"
          aria-label="Notu küçült"
          title="Küçült"
          onClick={() => setNoteOpen(false)}
        >
          <X size={15} />
        </NoteMinimizeButton>
        <NoteCardHeader>
          <ContentTitle>Güne özel not</ContentTitle>
        </NoteCardHeader>
        <PreviewDayNoteBox value={dayNote} onSave={onSaveDayNote} />
      </DayNoteCard>
    </DayNoteRail>
  );
}

function PreviewSubmissionRead({ value }: { value: DailySubmission }) {
  return (
    <FieldsStack>
      <SleepRow>
        <FieldGroup>
          <FieldLabel>Uyuma</FieldLabel>
          <FieldValue>{displayOrDash(value.uyumaSaati)}</FieldValue>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>Uyanma</FieldLabel>
          <FieldValue>{displayOrDash(value.uyanmaSaati)}</FieldValue>
        </FieldGroup>
      </SleepRow>
      <SleepRow>
        <FieldGroup>
          <FieldLabel>Günlük çalışma</FieldLabel>
          <FieldValue>
            {value.gunlukCalismaSaat === null
              ? '—'
              : formatHourOptionLabel(value.gunlukCalismaSaat)}
          </FieldValue>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>Ekran süresi</FieldLabel>
          <FieldValue>
            {value.ekranSuresiSaat === null
              ? '—'
              : formatHourOptionLabel(value.ekranSuresiSaat)}
          </FieldValue>
        </FieldGroup>
      </SleepRow>
      <FieldGroup>
        <FieldLabel>Notlar</FieldLabel>
        <FieldValue>{value.notlar.trim() ? value.notlar : '—'}</FieldValue>
      </FieldGroup>
    </FieldsStack>
  );
}

function splitTime(value: string): { hour: string; minute: string } {
  const [hour = '12', minute = '00'] = value.split(':');
  return {
    hour: hour.padStart(2, '0'),
    minute: minute.padStart(2, '0'),
  };
}

function formatMeetingWhen(meeting: StudentMeeting): string {
  const [year, month, day] = meeting.meetingDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return `${formatDayHeading(date)} · ${meeting.meetingTime}`;
}

function PreviewMeetingBox({
  meeting,
  preferredDateKey,
  onSave,
  onDelete,
}: {
  meeting: StudentMeeting | null;
  preferredDateKey: string;
  onSave: (input: {
    meetingDate: string;
    meetingTime: string;
    meetingLink: string;
  }) => Promise<void>;
  onDelete: (meetingId: string) => Promise<void>;
}) {
  const dayOptions = useMemo(() => buildUpcomingDays(10), []);
  const dayOptionKeys = useMemo(
    () => dayOptions.map((day) => toDateKey(day)),
    [dayOptions],
  );
  const fallbackDateKey = useMemo(() => {
    if (preferredDateKey && dayOptionKeys.includes(preferredDateKey)) {
      return preferredDateKey;
    }
    return dayOptionKeys[0] ?? toDateKey(new Date());
  }, [preferredDateKey, dayOptionKeys]);

  const [isEditing, setIsEditing] = useState(false);
  const [dateKey, setDateKey] = useState(fallbackDateKey);
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [link, setLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (meeting) {
      const parts = splitTime(meeting.meetingTime);
      setDateKey(meeting.meetingDate);
      setHour(parts.hour);
      setMinute(parts.minute);
      setLink(meeting.meetingLink);
      setIsEditing(false);
    } else {
      setDateKey(fallbackDateKey);
      setHour('12');
      setMinute('00');
      setLink('');
      setIsEditing(false);
    }
    setStatus(null);
  }, [meeting, fallbackDateKey]);

  const showForm = isEditing || !meeting;

  const handleSave = async () => {
    const trimmedLink = link.trim();
    if (!trimmedLink) {
      setStatus({ text: 'Görüşme linki gerekli.', error: true });
      return;
    }
    setIsSaving(true);
    setStatus(null);
    try {
      await onSave({
        meetingDate: dateKey,
        meetingTime: `${hour}:${minute}`,
        meetingLink: trimmedLink,
      });
      setIsEditing(false);
      setStatus({ text: 'Kaydedildi.' });
    } catch {
      setStatus({ text: 'Kaydedilemedi.', error: true });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!meeting) return;
    setIsDeleting(true);
    setStatus(null);
    try {
      await onDelete(meeting.id);
      setIsEditing(false);
    } catch {
      setStatus({ text: 'Silinemedi.', error: true });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!showForm && meeting) {
    const href = normalizeMeetingLink(meeting.meetingLink);
    return (
      <FieldsStack>
        <MetaText>{formatMeetingWhen(meeting)}</MetaText>
        <ActionsRow>
          {href ? (
            <JoinLink href={href} target="_blank" rel="noopener noreferrer">
              <Video size={16} />
              Görüşmeye Katıl
            </JoinLink>
          ) : null}
          <IconButton type="button" onClick={() => setIsEditing(true)}>
            <Pencil size={14} />
            Düzenle
          </IconButton>
          <IconButton
            type="button"
            $danger
            disabled={isDeleting}
            onClick={() => void handleDelete()}
          >
            <Trash2 size={14} />
            {isDeleting ? 'Siliniyor...' : 'Kaldır'}
          </IconButton>
        </ActionsRow>
        {status ? <StatusText $error={status.error}>{status.text}</StatusText> : null}
      </FieldsStack>
    );
  }

  if (!isEditing && !meeting) {
    return (
      <PlanButton type="button" onClick={() => setIsEditing(true)}>
        Görüşme Planla
      </PlanButton>
    );
  }

  return (
    <FieldsStack>
      <FieldGroup>
        <FieldLabel htmlFor="preview-meeting-date">Gün</FieldLabel>
        <FieldSelect
          id="preview-meeting-date"
          value={dateKey}
          onChange={(event) => setDateKey(event.target.value)}
        >
          {dayOptions.map((day) => {
            const key = toDateKey(day);
            return (
              <option key={key} value={key}>
                {formatDayHeading(day)}
              </option>
            );
          })}
        </FieldSelect>
      </FieldGroup>
      <FieldGroup>
        <FieldLabel>Saat</FieldLabel>
        <TimeRow>
          <FieldSelect
            aria-label="Saat"
            value={hour}
            onChange={(event) => setHour(event.target.value)}
          >
            {HOUR_TIME_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FieldSelect>
          <TimeSep>:</TimeSep>
          <FieldSelect
            aria-label="Dakika"
            value={minute}
            onChange={(event) => setMinute(event.target.value)}
          >
            {MINUTE_TIME_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FieldSelect>
        </TimeRow>
      </FieldGroup>
      <FieldGroup>
        <FieldLabel htmlFor="preview-meeting-link">Görüşme linki</FieldLabel>
        <FieldInput
          id="preview-meeting-link"
          type="url"
          placeholder="https://meet.google.com/..."
          value={link}
          onChange={(event) => {
            setLink(event.target.value);
            setStatus(null);
          }}
        />
      </FieldGroup>
      <ActionsRow>
        <IconButton type="button" $primary disabled={isSaving} onClick={() => void handleSave()}>
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </IconButton>
        <IconButton
          type="button"
          onClick={() => {
            if (meeting) {
              const parts = splitTime(meeting.meetingTime);
              setDateKey(meeting.meetingDate);
              setHour(parts.hour);
              setMinute(parts.minute);
              setLink(meeting.meetingLink);
            }
            setIsEditing(false);
            setStatus(null);
          }}
        >
          İptal
        </IconButton>
        {status ? <StatusText $error={status.error}>{status.text}</StatusText> : null}
      </ActionsRow>
    </FieldsStack>
  );
}

function PreviewDayNoteBox({
  value,
  onSave,
}: {
  value: string;
  onSave: (body: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    setDraft(value);
    setStatus(null);
  }, [value]);

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      await onSave(draft);
      setStatus({ text: 'Kaydedildi.' });
    } catch {
      setStatus({ text: 'Kaydedilemedi.', error: true });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DayNoteFields>
      <NoteTextarea
        placeholder="Bugüne not yaz..."
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setStatus(null);
        }}
      />
      <ActionsRow>
        <IconButton type="button" $primary disabled={isSaving} onClick={() => void handleSave()}>
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </IconButton>
        {status ? <StatusText $error={status.error}>{status.text}</StatusText> : null}
      </ActionsRow>
    </DayNoteFields>
  );
}

export function PreviewFormSection({
  submission,
  meeting,
  preferredDateKey,
  onSaveMeeting,
  onDeleteMeeting,
}: {
  submission: DailySubmission;
  meeting: StudentMeeting | null;
  preferredDateKey: string;
  onSaveMeeting: (input: {
    meetingDate: string;
    meetingTime: string;
    meetingLink: string;
  }) => Promise<void>;
  onDeleteMeeting: (meetingId: string) => Promise<void>;
}) {
  return (
    <SectionStack>
      <NestedCard>
        <PreviewSubmissionRead value={submission} />
      </NestedCard>

      <NestedCard>
        <ContentTitle>Görüşme</ContentTitle>
        <PreviewMeetingBox
          key={`${preferredDateKey}-${meeting?.id ?? 'new'}`}
          meeting={meeting}
          preferredDateKey={preferredDateKey}
          onSave={onSaveMeeting}
          onDelete={onDeleteMeeting}
        />
      </NestedCard>
    </SectionStack>
  );
}
