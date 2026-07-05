import { GradientTitle } from '../components/GradientTitle';
import {
  BackLink,
  InfoBlock,
  InfoLabel,
  InfoRow,
  InfoValue,
  PaymentContent,
  SurfaceCard,
  WarningText,
} from '../components/PaymentUI';
import { DetailLayout } from '../components/PageLayout';

export function GelisimProgramiHavalePage() {
  return (
    <DetailLayout>
      <GradientTitle $detail>Hesap Bilgileri</GradientTitle>
      <PaymentContent>
        <SurfaceCard $theme="orange" $delay="0.4s">
          <InfoBlock>
            <InfoRow>
              <InfoLabel>İsim Soyisim</InfoLabel>
              <InfoValue>MUSTAFA OCAK</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>IBAN</InfoLabel>
              <InfoValue>TR44 0001 0090 1103 6208 4050 02</InfoValue>
            </InfoRow>
          </InfoBlock>
        </SurfaceCard>

        <SurfaceCard $theme="orange" $delay="0.55s">
          <WarningText>
            Lütfen açıklamaya isim soyisim ve telefon numarası yazdığınızdan
            emin olun. En geç 24 saat içerisinde sizinle iletişime geçeceğiz.
          </WarningText>
        </SurfaceCard>

        <SurfaceCard $theme="orange" $delay="0.7s">
          <WarningText>
            Havale yapacağınız hesap bilgileri kişisel bir hesap değil, İçerik
            Üreticilerine Yönelik Vergi Muafiyeti kapsamında bulunan bir İstisna
            Hesabı'na aittir ve otomatik olarak vergilendirilmektedir.
          </WarningText>
        </SurfaceCard>

        <BackLink $theme="orange" to="/gelisim-programi/odeme">
          Geri Dön
        </BackLink>
      </PaymentContent>
    </DetailLayout>
  );
}
