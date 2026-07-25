import { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2, Video } from 'lucide-react';
import styled from 'styled-components';
import { getFormAccent } from '../../styles/formTheme';
import { HOUR_TIME_OPTIONS, MINUTE_TIME_OPTIONS, type StudentMeeting } from '../types';
import {
  buildUpcomingDays,
  formatDayHeading,
  formatDayPill,
  normalizeMeetingLink,
  toDateKey,
} from '../utils/dates';
import { PrimaryButton } from './AppUi';

const accent = getFormAccent('blue');

type MeetingPanelProps = {
  meeting: StudentMeeting | null;
  readOnly?: boolean;
  onSave?: (input: {
    meetingDate: string;
    meetingTime: string;
    meetingLink: string;
  }) => Promise<void>;
  onDelete?: (meetingId: string) => Promise<void>;
};

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PreviewBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MetaText = styled.p`
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.88);
`;

const CompactMeta = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.82);
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
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 138, 101, 0.45);
  background: rgba(230, 74, 25, 0.22);
  color: rgba(255, 204, 188, 0.98);
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  text-decoration: none;

  &:hover {
    border-color: rgba(255, 171, 145, 0.65);
    background: rgba(230, 74, 25, 0.32);
  }
`;

const IconButton = styled.button<{ $danger?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid
    ${({ $danger }) =>
      $danger ? 'rgba(255, 138, 128, 0.35)' : 'rgba(66, 165, 245, 0.3)'};
  background: rgba(255, 255, 255, 0.05);
  color: ${({ $danger }) => ($danger ? '#ff8a80' : 'rgba(144, 202, 249, 0.95)')};
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.09);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PlanButton = styled(PrimaryButton)`
  width: auto;
  align-self: stretch;
  padding: 14px 18px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.label`
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
`;

const fieldStyles = `
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid ${accent.inputBorder};
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.92rem;
  font-family: inherit;
  outline: none;

  &:focus {
    border-color: ${accent.inputBorderFocus};
    background: rgba(255, 255, 255, 0.08);
  }
`;

const FieldSelect = styled.select`
  ${fieldStyles}
  appearance: none;
  color-scheme: dark;

  option {
    background: #0d2137;
    color: rgba(255, 255, 255, 0.95);
  }
`;

const FieldInput = styled.input`
  ${fieldStyles}

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const TimeRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  align-items: center;
`;

const TimeSep = styled.span`
  color: rgba(255, 255, 255, 0.55);
  font-weight: 600;
`;

const StatusText = styled.span<{ $error?: boolean }>`
  font-size: 0.85rem;
  color: ${({ $error }) => ($error ? '#ff8a80' : 'rgba(165, 214, 167, 0.95)')};
`;

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

function formatMeetingWhenShort(meeting: StudentMeeting): string {
  const [year, month, day] = meeting.meetingDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return `${formatDayPill(date)} · ${meeting.meetingTime}`;
}

export function MeetingPanel({
  meeting,
  readOnly = false,
  onSave,
  onDelete,
}: MeetingPanelProps) {
  const dayOptions = useMemo(() => buildUpcomingDays(10), []);
  const [isEditing, setIsEditing] = useState(false);
  const [dateKey, setDateKey] = useState(toDateKey(dayOptions[0]));
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
      setDateKey(toDateKey(dayOptions[0]));
      setHour('12');
      setMinute('00');
      setLink('');
      setIsEditing(false);
    }
    setStatus(null);
  }, [meeting, dayOptions]);

  if (readOnly) {
    if (!meeting) return null;
    const href = normalizeMeetingLink(meeting.meetingLink);
    return (
      <Stack>
        <CompactMeta>{formatMeetingWhenShort(meeting)}</CompactMeta>
        {href ? (
          <JoinLink href={href} target="_blank" rel="noopener noreferrer">
            <Video size={16} />
            Görüşmeye Katıl
          </JoinLink>
        ) : null}
      </Stack>
    );
  }

  const showForm = isEditing || !meeting;

  const handleSave = async () => {
    if (!onSave) return;
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
    if (!meeting || !onDelete) return;
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
      <Stack>
        <PreviewBlock>
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
        </PreviewBlock>
      </Stack>
    );
  }

  if (!isEditing && !meeting) {
    return (
      <Stack>
        <PlanButton type="button" onClick={() => setIsEditing(true)}>
          Görüşme Planla
        </PlanButton>
      </Stack>
    );
  }

  return (
    <Stack>
      <FieldGroup>
        <FieldLabel htmlFor="meeting-date">Gün</FieldLabel>
        <FieldSelect
          id="meeting-date"
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
        <FieldLabel htmlFor="meeting-link">Görüşme linki</FieldLabel>
        <FieldInput
          id="meeting-link"
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
        <IconButton type="button" disabled={isSaving} onClick={() => void handleSave()}>
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </IconButton>
        {meeting ? (
          <IconButton
            type="button"
            onClick={() => {
              const parts = splitTime(meeting.meetingTime);
              setDateKey(meeting.meetingDate);
              setHour(parts.hour);
              setMinute(parts.minute);
              setLink(meeting.meetingLink);
              setIsEditing(false);
              setStatus(null);
            }}
          >
            İptal
          </IconButton>
        ) : (
          <IconButton
            type="button"
            onClick={() => {
              setIsEditing(false);
              setStatus(null);
            }}
          >
            İptal
          </IconButton>
        )}
        {status ? <StatusText $error={status.error}>{status.text}</StatusText> : null}
      </ActionsRow>
    </Stack>
  );
}
