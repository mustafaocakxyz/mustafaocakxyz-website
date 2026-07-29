import { GradientTitle } from '../components/GradientTitle';
import {
  PaymentActionRouterLink,
  PaymentContent,
  PaymentOptionCard,
  PaymentOptionLabel,
  ProductSubtitle,
} from '../components/PaymentUI';
import { DetailLayout } from '../components/PageLayout';
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

/* Restore when applications are closed:
const DisabledActionButton = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 22px;
  border-radius: 30px;
  background: linear-gradient(135deg, #5a5a5a 0%, #6e6e6e 50%, #7a7a7a 100%);
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  font-weight: 500;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  border: none;
  cursor: not-allowed;
  white-space: nowrap;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  user-select: none;
  pointer-events: none;

  @media (max-width: 600px) {
    width: 100%;
  }
`;
*/

export function GelisimProgramiBasvuruIntroPage() {
  return (
    <DetailLayout>
      <GradientTitle $detail>Gelişim Programı</GradientTitle>
      <PaymentContent>
        <ProductSubtitle $theme="orange">Ücret: 5900₺ / ay</ProductSubtitle>

        <Description>
          Başvurusu kabul edilen öğrenciler ödeme için yönlendirileceklerdir.
          Henüz herhangi bir ödeme yapmayacaksınız.
        </Description>
        {/* Closed-capacity copy — restore when applications close:
        <Description>
          Şu anda bütün kontenjanlarımız dolu. İlgilendiğin için teşekkürler.
        </Description>
        */}

        <PaymentOptionCard $theme="orange" $delay="0.6s">
          <PaymentOptionLabel>Başvurunu Yap</PaymentOptionLabel>
          <PaymentActionRouterLink $theme="orange" to="/gelisim-programi/basvuru">
            Formu Doldur
          </PaymentActionRouterLink>
          {/* Closed-capacity CTA — restore when applications close:
          <DisabledActionButton>Kontenjan Dolu</DisabledActionButton>
          */}
        </PaymentOptionCard>
      </PaymentContent>
    </DetailLayout>
  );
}
