import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styled, { css } from 'styled-components';
import { pageBackground, type ThemeColor } from '../styles/theme';
import { getFormAccent } from '../styles/formTheme';
import {
  isStandardStep,
  ONBOARDING_FORM_STEPS,
  type FormField,
  type FormStep,
} from '../data/onboardingFormSteps';
import { FormThemeProvider } from './FormThemeContext';
import { AytBilgileriStep } from './AytBilgileriStep';
import { AytKaynaklariStep } from './AytKaynaklariStep';
import { TytKaynaklariStep } from './TytKaynaklariStep';

type OnboardingFormProps = {
  theme?: ThemeColor;
  steps?: FormStep[];
  onSubmit: (formValues: Record<string, string>) => Promise<void>;
  successTitle?: string;
  successText?: string;
};

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

const ProgressSegment = styled.div<{
  $active: boolean;
  $completed: boolean;
  $accent: ReturnType<typeof getFormAccent>;
}>`
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.12);
  transition: background 0.3s ease;

  ${({ $completed, $accent }) =>
    $completed &&
    css`
      background: ${$accent.buttonGradient};
    `}

  ${({ $active, $completed, $accent }) =>
    $active &&
    !$completed &&
    css`
      background: ${$accent.progressActive};
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

const fieldControlStyles = (accent: ReturnType<typeof getFormAccent>) => css`
  width: 100%;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid ${accent.inputBorder};
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.95);
  font-size: 1rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:focus {
    border-color: ${accent.inputBorderFocus};
    background: rgba(255, 255, 255, 0.08);
  }
`;

const FieldInput = styled.input<{ $accent: ReturnType<typeof getFormAccent> }>`
  ${({ $accent }) => fieldControlStyles($accent)}

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const FieldSelect = styled.select<{ $accent: ReturnType<typeof getFormAccent> }>`
  ${({ $accent }) => fieldControlStyles($accent)}
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

const FieldTextarea = styled.textarea<{
  $size: 'medium' | 'long';
  $accent: ReturnType<typeof getFormAccent>;
}>`
  ${({ $accent }) => fieldControlStyles($accent)}
  resize: vertical;
  min-height: ${({ $size }) => ($size === 'long' ? '120px' : '80px')};
  line-height: 1.5;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const ChoiceStack = styled.div<{ $columns: 1 | 2 | 3 }>`
  display: grid;
  grid-template-columns: ${({ $columns }) => `repeat(${$columns}, 1fr)`};
  gap: 10px;
`;

const ChoiceOption = styled.button<{
  $selected: boolean;
  $accent: ReturnType<typeof getFormAccent>;
  $columns: 1 | 2 | 3;
}>`
  width: 100%;
  min-height: ${({ $columns }) => ($columns === 1 ? 'unset' : '96px')};
  padding: ${({ $columns }) => ($columns === 1 ? '16px 18px' : '14px 10px')};
  border-radius: 14px;
  border: 1px solid
    ${({ $selected, $accent }) =>
      $selected ? $accent.choiceBorderSelected : $accent.choiceBorder};
  background: ${({ $selected, $accent }) =>
    $selected ? $accent.choiceBgSelected : 'rgba(255, 255, 255, 0.06)'};
  color: rgba(255, 255, 255, 0.95);
  font-size: ${({ $columns }) => ($columns === 1 ? '0.95rem' : '0.875rem')};
  font-family: inherit;
  line-height: 1.4;
  text-align: ${({ $columns }) => ($columns === 1 ? 'left' : 'center')};
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: ${({ $accent }) => $accent.choiceBorderHover};
    background: ${({ $selected, $accent }) =>
      $selected ? $accent.choiceBgSelectedHover : 'rgba(255, 255, 255, 0.08)'};
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

const NextButton = styled.button<{ $accent: ReturnType<typeof getFormAccent> }>`
  ${baseButton}
  background: ${({ $accent }) => $accent.buttonGradient};
  color: white;
  box-shadow: ${({ $accent }) => $accent.buttonShadow};

  &:not(:disabled):hover {
    box-shadow: ${({ $accent }) => $accent.buttonShadowHover};
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

export function OnboardingForm({
  theme = 'blue',
  steps = ONBOARDING_FORM_STEPS,
  onSubmit,
  successTitle = 'Başvurun alındı',
  successText = 'Formunu başarıyla gönderdik. En kısa sürede seninle iletişime geçeceğiz.',
}: OnboardingFormProps) {
  const accent = getFormAccent(theme);
  const totalSteps = steps.length;
  const [currentStep, setCurrentStep] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const updateField = (id: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [id]: value }));
    setSubmitError(null);
  };

  const getMissingRequiredLabels = (targetStep: FormStep): string[] => {
    if (!isStandardStep(targetStep)) return [];
    return targetStep.fields
      .filter(
        (field) =>
          'required' in field &&
          field.required &&
          !(formValues[field.id] ?? '').trim(),
      )
      .map((field) => field.label);
  };

  const renderField = (field: FormField) => {
    if (field.type === 'select') {
      return (
        <FieldSelect
          $accent={accent}
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
          $accent={accent}
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
      const columns =
        field.layout === 'row-2'
          ? 2
          : field.layout === 'row-3' || field.options.length === 3
            ? 3
            : 1;

      return (
        <ChoiceStack
          role="radiogroup"
          aria-labelledby={`${field.id}-label`}
          $columns={columns}
        >
          {field.options.map((option) => (
            <ChoiceOption
              $accent={accent}
              $columns={columns}
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
        $accent={accent}
        id={field.id}
        name={field.id}
        type="text"
        value={formValues[field.id] ?? ''}
        onChange={(e) => updateField(field.id, e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        aria-required={field.required || undefined}
      />
    );
  };

  const renderStepBody = () => {
    if (isStandardStep(step)) {
      return (
        <FieldsStack>
          {step.fields.map((field) => (
            <FieldGroup key={field.id}>
              <FieldLabel
                id={`${field.id}-label`}
                htmlFor={field.type !== 'choice' ? field.id : undefined}
              >
                {field.label}
                {'required' in field && field.required ? ' *' : ''}
              </FieldLabel>
              {renderField(field)}
            </FieldGroup>
          ))}
        </FieldsStack>
      );
    }

    if (step.variant === 'tyt-kaynaklar') {
      return (
        <TytKaynaklariStep formValues={formValues} onFieldChange={updateField} />
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
    const missing = getMissingRequiredLabels(step);
    if (missing.length > 0) {
      setSubmitError(`${missing.join(' ve ')} zorunludur.`);
      return;
    }

    if (isLastStep) {
      setSubmitError(null);
      setIsSubmitting(true);
      try {
        await onSubmit(formValues);
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

    setSubmitError(null);
    setCurrentStep((s) => s + 1);
  };

  const goBack = () => {
    if (!isFirstStep) setCurrentStep((s) => s - 1);
  };

  if (isSubmitted) {
    return (
      <FormThemeProvider theme={theme}>
        <FormShell>
          <FormContainer>
            <SuccessPanel>
              <SuccessTitle>{successTitle}</SuccessTitle>
              <SuccessText>{successText}</SuccessText>
            </SuccessPanel>
          </FormContainer>
        </FormShell>
      </FormThemeProvider>
    );
  }

  return (
    <FormThemeProvider theme={theme}>
      <FormShell>
        <FormContainer>
          <ProgressHeader>
            <StepCounter>
              {currentStep + 1} / {totalSteps}
            </StepCounter>
            <ProgressTrack>
              {steps.map((_, index) => (
                <ProgressSegment
                  key={index}
                  $accent={accent}
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
            <BackButton
              type="button"
              onClick={goBack}
              disabled={isFirstStep || isSubmitting}
            >
              <ChevronLeft size={20} />
            </BackButton>
            <NextButton
              $accent={accent}
              type="button"
              onClick={goNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Gönderiliyor...' : isLastStep ? 'Gönder' : 'Devam'}
              {!isLastStep && !isSubmitting && <ChevronRight size={20} />}
            </NextButton>
          </FormFooter>
          {submitError && <ErrorMessage>{submitError}</ErrorMessage>}
        </FormContainer>
      </FormShell>
    </FormThemeProvider>
  );
}
