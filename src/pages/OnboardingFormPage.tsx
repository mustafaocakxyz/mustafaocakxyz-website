import { OnboardingForm } from '../components/OnboardingForm';
import { submitBasvuru } from '../lib/submitBasvuru';

export function OnboardingFormPage() {
  return <OnboardingForm theme="blue" onSubmit={submitBasvuru} />;
}
