import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styled, { css } from 'styled-components';
import { blueButtonGradient, pageBackground } from '../styles/theme';
import { submitBasvuru } from '../lib/submitBasvuru';
import { AytBilgileriStep } from './AytBilgileriStep';
import { AytKaynaklariStep } from './AytKaynaklariStep';
import { TytKaynaklariStep } from './TytKaynaklariStep';

type TextField = {
  id: string;
  type: 'text';
  label: string;
  placeholder?: string;
};

type TextareaField = {
  id: string;
  type: 'textarea';
  label: string;
  placeholder?: string;
  size?: 'medium' | 'long';
};

type SelectField = {
  id: string;
  type: 'select';
  label: string;
  options: string[];
  placeholder?: string;
};

type ChoiceField = {
  id: string;
  type: 'choice';
  label: string;
  options: { value: string; label: string }[];
};

type FormField = TextField | TextareaField | SelectField | ChoiceField;

type StandardFormStep = {
  variant?: 'standard';
  title: string;
  description?: string;
  fields: FormField[];
};

type AytFormStep = {
  variant: 'ayt';
  title: string;
  description?: string;
};

type TytKaynaklarFormStep = {
  variant: 'tyt-kaynaklar';
  title: string;
  description?: string;
};

type AytKaynaklarFormStep = {
  variant: 'ayt-kaynaklar';
  title: string;
  description?: string;
};

type FormStep =
  | StandardFormStep
  | AytFormStep
  | TytKaynaklarFormStep
  | AytKaynaklarFormStep;

function isStandardStep(step: FormStep): step is StandardFormStep {
  return step.variant === undefined || step.variant === 'standard';
}

const STEPS: FormStep[] = [
  {
    title: '#1 - Kişisel Bilgiler',
    fields: [
      { id: 'isim', type: 'text', label: 'İsim' },
      { id: 'sinif', type: 'text', label: 'Sınıf' },
      {
        id: 'alan',
        type: 'select',
        label: 'Alan',
        placeholder: 'Seçiniz',
        options: ['SAY', 'EA', 'SÖZ', 'DİL'],
      },
      { id: 'hedef-bolum', type: 'text', label: 'Hedef Bölüm' },
      { id: 'hedef-derece', type: 'text', label: 'Hedef Derece' },
      {
        id: 'gecmis-dereceler',
        type: 'text',
        label: '(Mezun ise) Geçmiş Dereceler',
      },
    ],
  },
  {
    title: '#2 - TYT Bilgileri',
    fields: [
      {
        id: 'tyt-turkce',
        type: 'text',
        label: 'TYT Türkçe Netiniz / Durumunuz',
        placeholder: '30 üstü, dil bilgisi yok vb.',
      },
      {
        id: 'tyt-sosyal',
        type: 'text',
        label: 'TYT Sosyal Netiniz / Durumunuz',
        placeholder: '10 civarı, coğrafya eksik vb.',
      },
      {
        id: 'tyt-matematik',
        type: 'text',
        label: 'TYT Matematik Netiniz / Durumunuz',
        placeholder: '15 civarı, temelim var ama problemlerde sıkıntı yaşıyorum vb.',
      },
      {
        id: 'tyt-geometri',
        type: 'text',
        label: 'TYT Geometri Netiniz / Durumunuz',
        placeholder: 'sıfırım veya 3 - 4 net yapabiliyorum vb.',
      },
      {
        id: 'tyt-fen',
        type: 'text',
        label: 'TYT Fen Netiniz / Durumunuz',
        placeholder: 'kimya 5+ geliyor ama fizik ve biyoloji sıfır vb.',
      },
    ],
  },
  {
    variant: 'ayt',
    title: '#3 - AYT Bilgileri',
  },
  {
    title: '#4 - Alışkanlıklar',
    fields: [
      {
        id: 'ortalama-calisma',
        type: 'text',
        label: 'Ortalama Çalışma',
        placeholder: '3 saat, çok değişiyor, bilmiyorum vb.',
      },
      {
        id: 'ortalama-ekran',
        type: 'text',
        label: 'Ortalama Ekran Süresi',
        placeholder: '4+ saat, çok değişiyor, bilmiyorum vb.',
      },
      {
        id: 'uyku-duzeni',
        type: 'text',
        label: 'Uyku Düzeni',
        placeholder: "genellikle 23.00 öncesi uyuyup 08.00'den erken kalkıyorum vb.",
      },
    ],
  },
  {
    variant: 'tyt-kaynaklar',
    title: '#5 - TYT Kaynakları',
  },
  {
    variant: 'ayt-kaynaklar',
    title: '#6 - AYT Kaynakları',
  },
  {
    title: '#7 - Gelmeden Önce',
    fields: [
      {
        id: 'program-tercihi',
        type: 'choice',
        label: 'Hangisi sana uygun?',
        options: [
          {
            value: 'sifirdan-program',
            label: 'Sıfırdan yeni bir program yapmak istiyorum.',
          },
          {
            value: 'program-gelistir',
            label: 'Programımı onaylatmak ve geliştirmek istiyorum.',
          },
        ],
      },
      {
        id: 'zorlayan-seyler',
        type: 'textarea',
        label: 'Şu anda seni zorlayan / engelleyen şeyler neler?',
        placeholder:
          'Anlamadığın veya zorlandığın konular, istikrarsızlık, telefon bağımlılığı vb.',
        size: 'long',
      },
      {
        id: 'beklentiler',
        type: 'textarea',
        label: 'Bu görüşmeden beklentilerin neler?',
        placeholder: 'Bir şeyler yaz...',
        size: 'long',
      },
    ],
  },
  {
    title: '#8 - Son Olarak',
    fields: [
      {
        id: 'musaitlik',
        type: 'textarea',
        label:
          'Önümüzdeki günlerde görüşme için müsaitliğin nasıl? Lütfen detaylı ve net cevap ver:',
        placeholder:
          "Pazartesi salı tüm gün müsaitim, çarşamba saat 18.00'den sonra olabilir vb.",
        size: 'medium',
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

const TOTAL_STEPS = STEPS.length;

const FormShell = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: ${pageBackground};
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const FormContainer = styled.div`
  width: 100%;
  max-width: 480px;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 24px 20px 20px;
`;

const ProgressHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
`;

const StepCounter = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const ProgressTrack = styled.div`
  display: flex;
  gap: 6px;
`;

const ProgressSegment = styled.div<{ $active: boolean; $completed: boolean }>`
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.12);
  transition: background 0.3s ease;

  ${({ $completed }) =>
    $completed &&
    css`
      background: ${blueButtonGradient};
    `}

  ${({ $active, $completed }) =>
    $active &&
    !$completed &&
    css`
      background: rgba(33, 150, 243, 0.6);
    `}
`;

const StepContent = styled.main`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  animation: stepIn 0.35s ease-out both;
  padding-bottom: 8px;

  @keyframes stepIn {
    from {
      opacity: 0;
      transform: translateX(16px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const StepTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.25;
  margin: 0;
`;

const StepDescription = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.6);
  margin: -12px 0 0;
`;

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

  &:focus {
    border-color: rgba(66, 165, 245, 0.6);
    background: rgba(255, 255, 255, 0.08);
  }
`;

const FieldInput = styled.input`
  ${fieldControlStyles}

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const FieldSelect = styled.select`
  ${fieldControlStyles}
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 44px;
  cursor: pointer;

  option {
    background: #1a1a1a;
    color: rgba(255, 255, 255, 0.95);
  }

  &:invalid,
  &.placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const FieldTextarea = styled.textarea<{ $size: 'medium' | 'long' }>`
  ${fieldControlStyles}
  resize: vertical;
  min-height: ${({ $size }) => ($size === 'long' ? '120px' : '80px')};
  line-height: 1.5;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const ChoiceStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ChoiceOption = styled.button<{ $selected: boolean }>`
  width: 100%;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid
    ${({ $selected }) =>
      $selected ? 'rgba(66, 165, 245, 0.6)' : 'rgba(66, 165, 245, 0.25)'};
  background: ${({ $selected }) =>
    $selected ? 'rgba(33, 150, 243, 0.18)' : 'rgba(255, 255, 255, 0.06)'};
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.95rem;
  font-family: inherit;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: rgba(66, 165, 245, 0.45);
    background: ${({ $selected }) =>
      $selected ? 'rgba(33, 150, 243, 0.22)' : 'rgba(255, 255, 255, 0.08)'};
  }
`;

const FormFooter = styled.footer`
  display: flex;
  gap: 12px;
  padding-top: 32px;
  margin-top: auto;
`;

const baseButton = css`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 20px;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  border: none;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:not(:disabled):active {
    transform: scale(0.98);
  }
`;

const BackButton = styled.button`
  ${baseButton}
  flex: 0 0 auto;
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);

  &:not(:disabled):hover {
    background: rgba(255, 255, 255, 0.12);
  }
`;

const NextButton = styled.button`
  ${baseButton}
  background: ${blueButtonGradient};
  color: white;
  box-shadow: 0 8px 25px rgba(21, 101, 192, 0.3);

  &:not(:disabled):hover {
    box-shadow: 0 12px 35px rgba(21, 101, 192, 0.4);
  }
`;

const ErrorMessage = styled.p`
  margin: 12px 0 0;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(211, 47, 47, 0.15);
  border: 1px solid rgba(244, 67, 54, 0.35);
  color: rgba(255, 200, 200, 0.95);
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: center;
`;

const SuccessPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
  padding: 40px 20px;
`;

const SuccessTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
`;

const SuccessText = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
  max-width: 360px;
`;

export function OnboardingForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const step = STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  const updateField = (id: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const renderField = (field: FormField) => {
    if (field.type === 'select') {
      return (
        <FieldSelect
          id={field.id}
          name={field.id}
          value={formValues[field.id] ?? ''}
          onChange={(e) => updateField(field.id, e.target.value)}
          required
        >
          <option value="" disabled>
            {field.placeholder ?? 'Seçiniz'}
          </option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </FieldSelect>
      );
    }

    if (field.type === 'textarea') {
      return (
        <FieldTextarea
          id={field.id}
          name={field.id}
          $size={field.size ?? 'long'}
          value={formValues[field.id] ?? ''}
          onChange={(e) => updateField(field.id, e.target.value)}
          placeholder={field.placeholder}
        />
      );
    }

    if (field.type === 'choice') {
      return (
        <ChoiceStack role="radiogroup" aria-labelledby={`${field.id}-label`}>
          {field.options.map((option) => (
            <ChoiceOption
              key={option.value}
              type="button"
              role="radio"
              aria-checked={formValues[field.id] === option.value}
              $selected={formValues[field.id] === option.value}
              onClick={() => updateField(field.id, option.value)}
            >
              {option.label}
            </ChoiceOption>
          ))}
        </ChoiceStack>
      );
    }

    return (
      <FieldInput
        id={field.id}
        name={field.id}
        type="text"
        value={formValues[field.id] ?? ''}
        onChange={(e) => updateField(field.id, e.target.value)}
        placeholder={field.placeholder}
      />
    );
  };

  const renderStepBody = () => {
    if (isStandardStep(step)) {
      return (
        <FieldsStack>
          {step.fields.map((field) => (
            <FieldGroup key={field.id}>
              <FieldLabel id={`${field.id}-label`} htmlFor={field.type !== 'choice' ? field.id : undefined}>
                {field.label}
              </FieldLabel>
              {renderField(field)}
            </FieldGroup>
          ))}
        </FieldsStack>
      );
    }

    if (step.variant === 'tyt-kaynaklar') {
      return (
        <TytKaynaklariStep
          formValues={formValues}
          onFieldChange={updateField}
        />
      );
    }

    if (step.variant === 'ayt-kaynaklar') {
      return (
        <AytKaynaklariStep
          alan={formValues.alan ?? ''}
          formValues={formValues}
          onFieldChange={updateField}
        />
      );
    }

    if (step.variant === 'ayt') {
      return (
        <AytBilgileriStep
          alan={formValues.alan ?? ''}
          formValues={formValues}
          onFieldChange={updateField}
        />
      );
    }

    return null;
  };

  const goNext = async () => {
    if (isLastStep) {
      setSubmitError(null);
      setIsSubmitting(true);
      try {
        await submitBasvuru(formValues);
        setIsSubmitted(true);
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'Gönderim başarısız.',
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setCurrentStep((s) => s + 1);
  };

  const goBack = () => {
    if (!isFirstStep) setCurrentStep((s) => s - 1);
  };

  if (isSubmitted) {
    return (
      <FormShell>
        <FormContainer>
          <SuccessPanel>
            <SuccessTitle>Başvurun alındı</SuccessTitle>
            <SuccessText>
              Formunu başarıyla gönderdik. En kısa sürede seninle iletişime geçeceğiz.
            </SuccessText>
          </SuccessPanel>
        </FormContainer>
      </FormShell>
    );
  }

  return (
    <FormShell>
      <FormContainer>
        <ProgressHeader>
          <StepCounter>
            {currentStep + 1} / {TOTAL_STEPS}
          </StepCounter>
          <ProgressTrack>
            {STEPS.map((_, index) => (
              <ProgressSegment
                key={index}
                $active={index === currentStep}
                $completed={index < currentStep}
              />
            ))}
          </ProgressTrack>
        </ProgressHeader>

        <StepContent key={currentStep}>
          <div>
            <StepTitle>{step.title}</StepTitle>
            {step.description && (
              <StepDescription>{step.description}</StepDescription>
            )}
          </div>

          {renderStepBody()}
        </StepContent>

        <FormFooter>
          <BackButton type="button" onClick={goBack} disabled={isFirstStep || isSubmitting}>
            <ChevronLeft size={20} />
          </BackButton>
          <NextButton type="button" onClick={goNext} disabled={isSubmitting}>
            {isSubmitting ? 'Gönderiliyor...' : isLastStep ? 'Gönder' : 'Devam'}
            {!isLastStep && !isSubmitting && <ChevronRight size={20} />}
          </NextButton>
        </FormFooter>
        {submitError && <ErrorMessage>{submitError}</ErrorMessage>}
      </FormContainer>
    </FormShell>
  );
}
