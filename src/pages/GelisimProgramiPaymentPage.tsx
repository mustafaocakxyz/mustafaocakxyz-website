import { GradientTitle } from '../components/GradientTitle';
import {
  BackLink,
  PaymentActionLink,
  PaymentActionRouterLink,
  PaymentContent,
  PaymentOptionCard,
  PaymentOptionLabel,
  ProductSubtitle,
} from '../components/PaymentUI';
import { DetailLayout } from '../components/PageLayout';

const SHOPIER_URL = 'https://www.shopier.com/xakademi_xyz/48690880';

export function GelisimProgramiPaymentPage() {
  return (
    <DetailLayout>
      <GradientTitle $detail>Ödeme</GradientTitle>
      <PaymentContent>
        <ProductSubtitle $theme="orange">5900₺ (aylık)</ProductSubtitle>

        <PaymentOptionCard $theme="orange" $delay="0.5s">
          <PaymentOptionLabel>Kart ile Ödeme</PaymentOptionLabel>
          <PaymentActionLink
            $theme="orange"
            href={SHOPIER_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Shopier'e Git
          </PaymentActionLink>
        </PaymentOptionCard>

        <PaymentOptionCard $theme="orange" $delay="0.65s">
          <PaymentOptionLabel>Havale ile Ödeme</PaymentOptionLabel>
          <PaymentActionRouterLink $theme="orange" to="/gelisim-programi/odeme/havale">
            Hesap Bilgileri
          </PaymentActionRouterLink>
        </PaymentOptionCard>

        <BackLink $theme="orange" to="/gelisim-programi">
          Geri Dön
        </BackLink>
      </PaymentContent>
    </DetailLayout>
  );
}
