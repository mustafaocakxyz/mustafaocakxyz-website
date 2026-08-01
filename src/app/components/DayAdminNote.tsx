import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { preview as t } from '../preview/adminPreviewTheme';
import { AccentButton } from '../preview/AdminPreviewUi';

type DayAdminNoteProps = {
  value: string;
  readOnly?: boolean;
  onSave?: (value: string) => Promise<void>;
};

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const NoteTextarea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  min-height: 110px;
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
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &:focus {
    border-color: rgba(96, 165, 250, 0.55);
    background: rgba(30, 41, 59, 0.92);
  }

  &::placeholder {
    color: ${t.mutedSoft};
  }

  &:disabled {
    opacity: 0.9;
    cursor: default;
    resize: none;
  }
`;

const ReadNote = styled.p`
  margin: 0;
  padding: 12px 14px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font-size: 0.95rem;
  line-height: 1.55;
  white-space: pre-wrap;
`;

const EmptyState = styled.p`
  margin: 0;
  padding: 8px 4px 4px;
  font-size: 0.9rem;
  color: ${t.muted};
`;

const SaveRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatusText = styled.span<{ $error?: boolean }>`
  font-size: 0.85rem;
  color: ${({ $error }) => ($error ? t.danger : t.success)};
`;

export function DayAdminNote({ value, readOnly = false, onSave }: DayAdminNoteProps) {
  const [draft, setDraft] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    setDraft(value);
    setStatus(null);
  }, [value]);

  if (readOnly) {
    const trimmed = value.trim();
    if (!trimmed) {
      return <EmptyState>Bu gün için not yok.</EmptyState>;
    }
    return <ReadNote>{trimmed}</ReadNote>;
  }

  const handleSave = async () => {
    if (!onSave) return;
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
    <Stack>
      <NoteTextarea
        id="bugune-notlar"
        placeholder="Bugüne not yaz..."
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setStatus(null);
        }}
      />
      <SaveRow>
        <AccentButton type="button" disabled={isSaving} onClick={() => void handleSave()}>
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </AccentButton>
        {status ? <StatusText $error={status.error}>{status.text}</StatusText> : null}
      </SaveRow>
    </Stack>
  );
}
