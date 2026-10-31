import { OnboardingForm } from '../components/OnboardingForm';
import { GradientTitle } from '../components/GradientTitle';
import { BackLink, PaymentContent } from '../components/PaymentUI';
import { DetailLayout } from '../components/PageLayout';
import { GELISIM_PROGRAMI_FORM_STEPS } from '../data/gelisimProgramiFormSteps';
import {
  GELISIM_CAPACITY_FULL_MESSAGE,
  useGelisimCapacity,
} from '../lib/gelisimCapacity';
import { submitGelisimBasvuru } from '../lib/submitGelisimBasvuru';
import styled from 'styled-components';

const ClosedCopy = styled.p`
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
`;

export function GelisimProgramiBasvuruPage() {
  const { applicationsOpen, isLoading } = useGelisimCapacity();

  if (isLoading) {
    return <DetailLayout />;
  }

  if (!applicationsOpen) {
    return (
      <DetailLayout>
        <GradientTitle $detail>Gelişim Programı</GradientTitle>
        <PaymentContent>
          <ClosedCopy>{GELISIM_CAPACITY_FULL_MESSAGE}</ClosedCopy>
          <BackLink $theme="blue" to="/gelisim-programi">
            Programa Dön
          </BackLink>
        </PaymentContent>
      </DetailLayout>
    );
  }

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
