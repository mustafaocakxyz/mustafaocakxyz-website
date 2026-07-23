import {
  ONBOARDING_FORM_STEPS,
  isStandardStep,
  type FormStep,
} from './onboardingFormSteps';

const yesNoUnsureOptions = [
  { value: 'evet', label: 'Evet' },
  { value: 'kararsizim', label: 'Kararsızım' },
  { value: 'hayir', label: 'Hayır' },
];

const baseSteps = ONBOARDING_FORM_STEPS.filter(
  (step) => step.variant !== 'tyt-kaynaklar' && step.variant !== 'ayt-kaynaklar',
);

const personalStep = baseSteps[0];
if (!isStandardStep(personalStep)) {
  throw new Error('Expected first gelisim form step to be Kişisel Bilgiler');
}

const isimField = personalStep.fields[0];
if (isimField.type !== 'text') {
  throw new Error('Expected first personal field to be text (İsim)');
}

export const GELISIM_PROGRAMI_FORM_STEPS: FormStep[] = [
  {
    title: '#1 - Kişisel Bilgiler',
    fields: [
      { ...isimField, required: true },
      { id: 'telefon', type: 'text', label: 'Telefon Numaranız', required: true },
      ...personalStep.fields.slice(1),
    ],
  },
  baseSteps[1],
  baseSteps[2],
  baseSteps[3],
  {
    title: '#5 - Sorularımız',
    fields: [
      {
        id: 'neden-program',
        type: 'textarea',
        label: 'Neden kendin devam etmek yerine programa başvuruyorsun?',
        size: 'medium',
      },
      {
        id: 'engelleyen-sebepler',
        type: 'textarea',
        label: 'Şu ana kadar başarmanı engelleyen sebepler nelerdi?',
        size: 'medium',
      },
      {
        id: 'beklentiler',
        type: 'textarea',
        label: 'Programdan ve Mustafa Ocak\'tan beklentilerin neler?',
        size: 'medium',
      },
    ],
  },
  {
    title: '#6 - Şartlarımız',
    fields: [
      {
        id: 'alisverkanlik-hazir',
        type: 'choice',
        label:
          'Kabul edilirsen YKS çalışmalarınla birlikte ekran süresi ve uyku düzeni gibi alışkanlıklarını da düzene sokacağız. Hazır mısın?',
        options: yesNoUnsureOptions,
      },
      {
        id: 'calisma-hazir',
        type: 'choice',
        label: 'Senden istikrarlı ve çok çalışmanı isteyeceğiz. Hazır mısın?',
        options: yesNoUnsureOptions,
      },
    ],
  },
  {
    title: '#7 - Son Olarak',
    fields: [
      {
        id: 'baslangic-zamani',
        type: 'choice',
        label: 'Kabul edilirsen en erken ne zaman başlayabilirsin?',
        options: [
          { value: 'yarin', label: 'Yarın' },
          { value: 'bu-hafta', label: 'Bu Hafta' },
          { value: 'daha-sonra', label: 'Daha Sonra' },
        ],
      },
      {
        id: 'ekstra',
        type: 'textarea',
        label: 'Söylemek istediğin ekstra bir şey var mı?',
        placeholder: 'Bir şeyler yaz...',
        size: 'long',
      },
    ],
  },
];
