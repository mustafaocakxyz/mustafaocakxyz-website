import styled, { css } from 'styled-components';
import { branchFieldId, getAytBranches } from '../data/aytBranches';

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

const fieldControlStyles = css`
  width: 100%;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid rgba(66, 165, 245, 0.25);
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
    border-color: rgba(66, 165, 245, 0.6);
    background: rgba(255, 255, 255, 0.08);
  }
`;

const FieldInput = styled.input`
  ${fieldControlStyles}
`;

const EmptyState = styled.p`
  margin: 0;
  padding: 20px;
  border-radius: 14px;
  border: 1px dashed rgba(66, 165, 245, 0.35);
  background: rgba(21, 101, 192, 0.12);
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
  const branches = getAytBranches(alan);

  if (branches.length === 0) {
    return (
      <EmptyState>
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
