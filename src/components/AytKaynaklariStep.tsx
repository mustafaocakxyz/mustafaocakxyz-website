import { getAytBranches } from '../data/aytBranches';
import { BranchFieldsStep } from './BranchFieldsStep';

const KAYNAK_PLACEHOLDER = 'Soru bankası, konu anlatım fasikülü vb.';

type AytKaynaklariStepProps = {
  alan: string;
  formValues: Record<string, string>;
  onFieldChange: (id: string, value: string) => void;
};

export function AytKaynaklariStep({
  alan,
  formValues,
  onFieldChange,
}: AytKaynaklariStepProps) {
  return (
    <BranchFieldsStep
      branches={getAytBranches(alan)}
      fieldPrefix="ayt-kaynak"
      getLabel={(branch) => `${branch} Kaynaklarınız:`}
      placeholder={KAYNAK_PLACEHOLDER}
      emptyMessage="AYT kaynak sorularını görmek için 1. adımda alan seçimi yapmalısın."
      formValues={formValues}
      onFieldChange={onFieldChange}
    />
  );
}
