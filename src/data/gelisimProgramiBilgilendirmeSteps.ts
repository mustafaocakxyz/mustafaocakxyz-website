import {
  ONBOARDING_FORM_STEPS,
  isStandardStep,
  type FormStep,
} from './onboardingFormSteps';

const step1 = ONBOARDING_FORM_STEPS[0];
const step2 = ONBOARDING_FORM_STEPS[1];
const step3 = ONBOARDING_FORM_STEPS[2];
const step5 = ONBOARDING_FORM_STEPS[4];
const step6 = ONBOARDING_FORM_STEPS[5];

if (!isStandardStep(step1)) {
  throw new Error('Expected first bilgilendirme step to be standard');
}

export const GELISIM_PROGRAMI_BILGILENDIRME_STEPS: FormStep[] = [
  {
    title: '#1 - Kişisel Bilgiler',
    fields: step1.fields.slice(0, 3),
  },
  step2,
  step3,
  step5,
  step6,
  {
    title: '#6 - Son Olarak',
    fields: [
      {
        id: 'ilk-gorusme-musaitlik',
        type: 'choice',
        label:
          'Bu hafta bitmeden ilk görüşmemizi yapacağız ve süreci başlatacağız. Müsait misin?',
        layout: 'row-2',
        options: [
          { value: 'musaitim', label: 'Müsaitim' },
          { value: 'degilim', label: 'Değilim' },
        ],
      },
      {
        id: 'ekstra',
        type: 'textarea',
        label:
          'Söylemek istediğin ekstra bir şey var mı? (Müsait değilsen sebebini buraya yazabilirsin.)',
        placeholder: 'Bir şeyler yaz...',
        size: 'long',
      },
    ],
  },
];
