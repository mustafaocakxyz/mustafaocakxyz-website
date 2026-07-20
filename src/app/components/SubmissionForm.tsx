import styled from 'styled-components';
import { getFormAccent } from '../../styles/formTheme';
import {
  formatHourOptionLabel,
  HOUR_OPTIONS,
  TIME_OPTIONS,
  type DailySubmission,
} from '../types';

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

const SleepRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
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
  color-scheme: dark;

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

const FieldSelect = styled.select`
  ${fieldStyles}
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, rgba(255, 255, 255, 0.55) 50%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.55) 50%, transparent 50%);
  background-position:
    calc(100% - 18px) 50%,
    calc(100% - 12px) 50%;
  background-size:
    6px 6px,
    6px 6px;
  background-repeat: no-repeat;
  padding-right: 36px;

  option {
    background: #0d2137;
    color: rgba(255, 255, 255, 0.95);
  }
`;

const MediumTextarea = styled.textarea`
  ${fieldStyles}
  resize: vertical;
  min-height: 96px;
  line-height: 1.5;
`;

function hourSelectValue(value: number | null): string {
  return value === null ? '' : String(value);
}

function parseHourSelectValue(raw: string): number | null {
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function SubmissionForm({ value, onChange, readOnly = false }: SubmissionFormProps) {
  return (
    <FieldsStack>
      <SleepRow>
        <FieldGroup>
          <FieldLabel htmlFor="uyuma-saati">Uyuma</FieldLabel>
          <FieldSelect
            id="uyuma-saati"
            value={value.uyumaSaati ?? ''}
            disabled={readOnly}
            onChange={(event) =>
              onChange({
                ...value,
                uyumaSaati: event.target.value || null,
              })
            }
          >
            <option value="">Seçiniz</option>
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </FieldSelect>
        </FieldGroup>

        <FieldGroup>
          <FieldLabel htmlFor="uyanma-saati">Uyanma</FieldLabel>
          <FieldSelect
            id="uyanma-saati"
            value={value.uyanmaSaati ?? ''}
            disabled={readOnly}
            onChange={(event) =>
              onChange({
                ...value,
                uyanmaSaati: event.target.value || null,
              })
            }
          >
            <option value="">Seçiniz</option>
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </FieldSelect>
        </FieldGroup>
      </SleepRow>

      <FieldGroup>
        <FieldLabel htmlFor="gunluk-calisma">Günlük Çalışma</FieldLabel>
        <FieldSelect
          id="gunluk-calisma"
          value={hourSelectValue(value.gunlukCalismaSaat)}
          disabled={readOnly}
          onChange={(event) =>
            onChange({
              ...value,
              gunlukCalismaSaat: parseHourSelectValue(event.target.value),
            })
          }
        >
          <option value="">Seçiniz</option>
          {HOUR_OPTIONS.map((hours) => (
            <option key={hours} value={String(hours)}>
              {formatHourOptionLabel(hours)}
            </option>
          ))}
        </FieldSelect>
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="ekran-suresi">Ekran Süresi</FieldLabel>
        <FieldSelect
          id="ekran-suresi"
          value={hourSelectValue(value.ekranSuresiSaat)}
          disabled={readOnly}
          onChange={(event) =>
            onChange({
              ...value,
              ekranSuresiSaat: parseHourSelectValue(event.target.value),
            })
          }
        >
          <option value="">Seçiniz</option>
          {HOUR_OPTIONS.map((hours) => (
            <option key={hours} value={String(hours)}>
              {formatHourOptionLabel(hours)}
            </option>
          ))}
        </FieldSelect>
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="notlar">Notlar</FieldLabel>
        <MediumTextarea
          id="notlar"
          placeholder="Günün notlarını yaz..."
          value={value.notlar}
          disabled={readOnly}
          onChange={(event) => onChange({ ...value, notlar: event.target.value })}
        />
      </FieldGroup>
    </FieldsStack>
  );
}
