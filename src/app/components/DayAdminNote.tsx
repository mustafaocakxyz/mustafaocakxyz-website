import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getFormAccent } from '../../styles/formTheme';
import { PrimaryButton } from './AppUi';

const accent = getFormAccent('blue');

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
  min-height: 110px;
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

  &:disabled {
    opacity: 0.9;
    cursor: default;
    resize: none;
  }
`;

const ReadNote = styled.p`
  margin: 0;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(66, 165, 245, 0.2);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.95rem;
  line-height: 1.55;
  white-space: pre-wrap;
`;

const EmptyState = styled.p`
  margin: 0;
  padding: 8px 4px 4px;
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.45);
`;

const SaveRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SaveButton = styled(PrimaryButton)`
  width: auto;
  min-width: 120px;
  padding: 12px 22px;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusText = styled.span<{ $error?: boolean }>`
  font-size: 0.85rem;
  color: ${({ $error }) => ($error ? '#ff8a80' : 'rgba(165, 214, 167, 0.95)')};
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
        <SaveButton type="button" disabled={isSaving} onClick={() => void handleSave()}>
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </SaveButton>
        {status ? <StatusText $error={status.error}>{status.text}</StatusText> : null}
      </SaveRow>
    </Stack>
  );
}
