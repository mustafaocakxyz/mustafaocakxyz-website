import styled from 'styled-components';
import { getFormAccent } from '../../styles/formTheme';
import type { DailySubmission } from '../types';

const accent = getFormAccent('blue');

type SubmissionFormProps = {
  value: DailySubmission;
  onChange: (value: DailySubmission) => void;
  readOnly?: boolean;
};

const FieldsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FieldLabel = styled.label`
  font-size: 0.88rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
`;

const fieldStyles = `
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid ${accent.inputBorder};
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:focus {
    border-color: ${accent.inputBorderFocus};
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.85;
    cursor: default;
  }
`;

const SmallInput = styled.input`
  ${fieldStyles}
`;

const MediumTextarea = styled.textarea`
  ${fieldStyles}
  resize: vertical;
  min-height: 96px;
  line-height: 1.5;
`;

export function SubmissionForm({ value, onChange, readOnly = false }: SubmissionFormProps) {
  const updateField = <K extends keyof DailySubmission>(field: K, next: string) => {
    onChange({ ...value, [field]: next });
  };

  return (
    <FieldsStack>
      <FieldGroup>
        <FieldLabel htmlFor="uyku-uyanma">Uyku - Uyanma</FieldLabel>
        <SmallInput
          id="uyku-uyanma"
          type="text"
          placeholder="Örn. 23:30 - 07:00"
          value={value.uykuUyanma}
          disabled={readOnly}
          onChange={(event) => updateField('uykuUyanma', event.target.value)}
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="gunluk-calisma">Günlük Çalışma</FieldLabel>
        <SmallInput
          id="gunluk-calisma"
          type="text"
          placeholder="Örn. 5 saat"
          value={value.gunlukCalisma}
          disabled={readOnly}
          onChange={(event) => updateField('gunlukCalisma', event.target.value)}
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="ekran-suresi">Ekran Süresi</FieldLabel>
        <SmallInput
          id="ekran-suresi"
          type="text"
          placeholder="Örn. 1.5 saat"
          value={value.ekranSuresi}
          disabled={readOnly}
          onChange={(event) => updateField('ekranSuresi', event.target.value)}
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="notlar">Notlar</FieldLabel>
        <MediumTextarea
          id="notlar"
          placeholder="Günün notlarını yaz..."
          value={value.notlar}
          disabled={readOnly}
          onChange={(event) => updateField('notlar', event.target.value)}
        />
      </FieldGroup>
    </FieldsStack>
  );
}
