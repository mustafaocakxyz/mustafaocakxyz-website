import styled from 'styled-components';
import { branchFieldId, getAytBranches } from '../data/aytBranches';
import { useFormTheme } from './FormThemeContext';
import { getFormAccent } from '../styles/formTheme';

const AYT_PLACEHOLDER = 'Bu dersteki netini veya güncel durumunu yaz';

const FieldsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FieldLabel = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
`;

const FieldInput = styled.input<{ $theme: ReturnType<typeof getFormAccent> }>`
  width: 100%;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid ${({ $theme }) => $theme.inputBorder};
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.95);
  font-size: 1rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  &:focus {
    border-color: ${({ $theme }) => $theme.inputBorderFocus};
    background: rgba(255, 255, 255, 0.08);
  }
`;

const EmptyState = styled.p<{ $theme: ReturnType<typeof getFormAccent> }>`
  margin: 0;
  padding: 20px;
  border-radius: 14px;
  border: 1px dashed ${({ $theme }) => $theme.emptyBorder};
  background: ${({ $theme }) => $theme.emptyBg};
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.95rem;
  line-height: 1.6;
`;

type AytBilgileriStepProps = {
  alan: string;
  formValues: Record<string, string>;
  onFieldChange: (id: string, value: string) => void;
};

export function AytBilgileriStep({
  alan,
  formValues,
  onFieldChange,
}: AytBilgileriStepProps) {
  const theme = useFormTheme();
  const accent = getFormAccent(theme);
  const branches = getAytBranches(alan);

  if (branches.length === 0) {
    return (
      <EmptyState $theme={accent}>
        AYT sorularını görmek için 1. adımda alan seçimi yapmalısın.
      </EmptyState>
    );
  }

  return (
    <FieldsStack>
      {branches.map((branch) => {
        const id = branchFieldId('ayt', branch);
        return (
          <FieldGroup key={id}>
            <FieldLabel htmlFor={id}>{branch} Netiniz / Durumunuz</FieldLabel>
            <FieldInput
              $theme={accent}
              id={id}
              name={id}
              type="text"
              value={formValues[id] ?? ''}
              onChange={(e) => onFieldChange(id, e.target.value)}
              placeholder={AYT_PLACEHOLDER}
            />
          </FieldGroup>
        );
      })}
    </FieldsStack>
  );
}
