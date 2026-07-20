import { OnboardingForm } from '../components/OnboardingForm';
import { GELISIM_PROGRAMI_BILGILENDIRME_STEPS } from '../data/gelisimProgramiBilgilendirmeSteps';
import { submitGelisimBilgilendirme } from '../lib/submitGelisimBilgilendirme';

export function GelisimProgramiBilgilendirmePage() {
  return (
    <OnboardingForm
      theme="orange"
      steps={GELISIM_PROGRAMI_BILGILENDIRME_STEPS}
      onSubmit={submitGelisimBilgilendirme}
      successTitle="Teşekkürler"
      successText="Şu anda bilgilerini inceleyip programını hazırlıyorum. Programın hazır olduğunda sana haber vereceğim ve inşallah bu hafta süreci başlatacağız."
    />
  );
}
