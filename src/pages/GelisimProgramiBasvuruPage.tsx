import { OnboardingForm } from '../components/OnboardingForm';
import { GELISIM_PROGRAMI_FORM_STEPS } from '../data/gelisimProgramiFormSteps';
import { submitGelisimBasvuru } from '../lib/submitGelisimBasvuru';

export function GelisimProgramiBasvuruPage() {
  return (
    <OnboardingForm
      theme="orange"
      steps={GELISIM_PROGRAMI_FORM_STEPS}
      onSubmit={submitGelisimBasvuru}
      successTitle="Başvurun alındı"
      successText="Başvurunu aldık. Değerlendirme sonrası seninle iletişime geçeceğiz."
    />
  );
}
