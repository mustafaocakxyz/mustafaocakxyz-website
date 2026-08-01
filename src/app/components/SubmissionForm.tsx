import styled from 'styled-components';
import { preview as t } from '../preview/adminPreviewTheme';
import {
  formatHourOptionLabel,
  HOUR_OPTIONS,
  TIME_OPTIONS,
  type DailySubmission,
} from '../types';

type SubmissionFormProps = {
  value: DailySubmission;
  onChange: (value: DailySubmission) => void;
  readOnly?: boolean;
};

const FieldsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SleepRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FieldLabel = styled.label`
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${t.muted};
`;

const fieldStyles = `
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
  transition: border-color 0.15s ease, background 0.15s ease;

  &:focus {
    border-color: rgba(96, 165, 250, 0.55);
    background: rgba(30, 41, 59, 0.92);
  }

  &::placeholder {
    color: ${t.mutedSoft};
  }

  &:disabled {
    opacity: 0.85;
    cursor: default;
  }
`;

const FieldSelect = styled.select`
  ${fieldStyles}
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, rgba(148, 163, 184, 0.7) 50%),
    linear-gradient(135deg, rgba(148, 163, 184, 0.7) 50%, transparent 50%);
  background-position:
    calc(100% - 18px) 50%,
    calc(100% - 12px) 50%;
  background-size:
    6px 6px,
    6px 6px;
  background-repeat: no-repeat;
  padding-right: 36px;

  option {
    background: ${t.panel};
    color: ${t.text};
  }
`;

const MediumTextarea = styled.textarea`
  ${fieldStyles}
  resize: vertical;
  min-height: 96px;
  line-height: 1.5;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
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
