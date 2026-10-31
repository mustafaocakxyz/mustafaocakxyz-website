import { GradientTitle } from '../components/GradientTitle';
import {
  DisabledActionButton,
  PaymentActionRouterLink,
  PaymentContent,
  PaymentOptionCard,
  PaymentOptionLabel,
  ProductSubtitle,
} from '../components/PaymentUI';
import { DetailLayout } from '../components/PageLayout';
import {
  GELISIM_CAPACITY_FULL_MESSAGE,
  useGelisimCapacity,
} from '../lib/gelisimCapacity';
import styled from 'styled-components';

const Description = styled.p`
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
  animation: fadeInUp 0.8s ease-out both;
  animation-delay: 0.45s;

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

export function GelisimProgramiBasvuruIntroPage() {
  const { applicationsOpen } = useGelisimCapacity();

  return (
    <DetailLayout>
      <GradientTitle $detail>Gelişim Programı</GradientTitle>
      <PaymentContent>
        <ProductSubtitle $theme="blue">Ücret: 6900₺ / ay</ProductSubtitle>

        <Description>
          {applicationsOpen
            ? 'Başvurusu kabul edilen öğrenciler ödeme için yönlendirileceklerdir. Henüz herhangi bir ödeme yapmayacaksınız.'
            : GELISIM_CAPACITY_FULL_MESSAGE}
        </Description>

        <PaymentOptionCard $theme="blue" $delay="0.6s">
          <PaymentOptionLabel>Başvurunu Yap</PaymentOptionLabel>
          {applicationsOpen ? (
            <PaymentActionRouterLink $theme="blue" to="/gelisim-programi/basvuru">
              Formu Doldur
            </PaymentActionRouterLink>
          ) : (
            <DisabledActionButton aria-disabled="true">
              Kontenjan Dolu
            </DisabledActionButton>
          )}
        </PaymentOptionCard>
      </PaymentContent>
    </DetailLayout>
  );
}
