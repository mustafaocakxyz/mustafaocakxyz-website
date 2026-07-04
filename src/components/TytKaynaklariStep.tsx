import { BranchFieldsStep } from './BranchFieldsStep';
import { getTytBranches } from '../data/tytBranches';

const KAYNAK_PLACEHOLDER = 'Soru bankası, konu anlatım fasikülü vb.';

type TytKaynaklariStepProps = {
  formValues: Record<string, string>;
  onFieldChange: (id: string, value: string) => void;
};

export function TytKaynaklariStep({
  formValues,
  onFieldChange,
}: TytKaynaklariStepProps) {
  return (
    <BranchFieldsStep
      branches={getTytBranches()}
      fieldPrefix="tyt-kaynak"
      getLabel={(branch) => `${branch} Kaynaklarınız:`}
      placeholder={KAYNAK_PLACEHOLDER}
      formValues={formValues}
      onFieldChange={onFieldChange}
    />
  );
}
