import styled from 'styled-components';

const Page = styled.main`
  min-height: 100vh;
  background: #0a0a0a;
  color: rgba(255, 255, 255, 0.9);
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const Inner = styled.article`
  max-width: 720px;
  margin: 0 auto;
  padding: 48px 20px 80px;
`;

const Title = styled.h1`
  margin: 0 0 8px;
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
`;

const Meta = styled.p`
  margin: 0 0 32px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
`;

const Section = styled.section`
  margin-bottom: 28px;

  h2 {
    margin: 0 0 10px;
    font-size: 1.1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
  }

  p,
  li {
    margin: 0 0 10px;
    font-size: 0.95rem;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.78);
  }

  ul {
    margin: 0 0 10px;
    padding-left: 1.25rem;
  }
`;

/**
 * Hidden legal page for store listings — not linked from main site nav.
 * Public URL: https://mustafaocak.xyz/legal/x-akademi-gizlilik
 */
export function XAkademiPrivacyPage() {
  return (
    <Page>
      <Inner>
        <Title>X Akademi App — Gizlilik Politikası</Title>
        <Meta>Son güncelleme: 29 Temmuz 2026</Meta>

        <Section>
          <p>
            Bu gizlilik politikası, Mustafa Ocak tarafından sunulan{' '}
            <strong>X Akademi App</strong> mobil uygulaması ve ilişkili öğrenci
            takip hizmetleri için geçerlidir. Uygulama, aylık koçluk
            öğrencilerinin görev, not, form ve mesajlaşma süreçlerini takip etmek
            amacıyla kullanılır.
          </p>
        </Section>

        <Section>
          <h2>1. Veri sorumlusu</h2>
          <p>
            Veri sorumlusu: Mustafa Ocak (mustafaocak.xyz).
            <br />
            İletişim: site üzerindeki başvuru / iletişim kanalları veya
            koçluk sürecinizde size verilen e-posta adresi.
          </p>
        </Section>

        <Section>
          <h2>2. Toplanan veriler</h2>
          <p>Uygulama kapsamında şu veriler işlenebilir:</p>
          <ul>
            <li>
              <strong>Hesap bilgileri:</strong> kullanıcı adı, görünen ad, kimlik
              doğrulama için gerekli oturum bilgileri (öğrenci hesapları
              yönetici tarafından oluşturulur; uygulama üzerinden kayıt yoktur).
            </li>
            <li>
              <strong>Koçluk içeriği:</strong> günlük görevler ve tamamlanma
              durumu, öğrenci form yanıtları, yönetici notları, görüşme
              bilgileri.
            </li>
            <li>
              <strong>Mesajlaşma:</strong> öğrenci–yönetici sohbet metinleri;
              isteğe bağlı olarak görsel, belge ve sesli mesaj ekleri.
            </li>
            <li>
              <strong>Bildirimler:</strong> cihaz bildirim izni verildiğinde
              push bildirim token’ı (cihaz/uygulama bildirimleri için).
            </li>
            <li>
              <strong>Teknik veriler:</strong> uygulama sürümü, cihaz platformu
              (iOS/Android) ve hizmetin güvenli çalışması için gerekli temel
              günlükler.
            </li>
          </ul>
        </Section>

        <Section>
          <h2>3. Verilerin kullanım amacı</h2>
          <ul>
            <li>Koçluk sürecinin yürütülmesi ve ilerlemenin takibi</li>
            <li>Görev, form, not ve görüşme bilgilerinin gösterilmesi</li>
            <li>Öğrenci ile yönetici arasında güvenli mesajlaşma</li>
            <li>Yeni mesaj ve hatırlatmalar için bildirim gönderimi</li>
            <li>Hizmet güvenliği, hata ayıklama ve iyileştirme</li>
          </ul>
        </Section>

        <Section>
          <h2>4. Saklama ve altyapı</h2>
          <p>
            Veriler, hizmet sağlayıcımız <strong>Supabase</strong> (bulut veri
            tabanı, kimlik doğrulama ve dosya depolama) üzerinde, erişim
            kontrolleri (rol tabanlı güvenlik) ile saklanır. Sohbet ekleri
            güvenli depolama alanında tutulur ve yalnızca ilgili taraflarca
            erişilebilir.
          </p>
          <p>
            Push bildirimleri, Expo / Firebase Cloud Messaging (Android) ve
            Apple Push Notification servisi (iOS) altyapıları üzerinden
            iletilir.
          </p>
        </Section>

        <Section>
          <h2>5. Paylaşım</h2>
          <p>
            Öğrenci verileri, koçluk hizmetini sunmak dışında üçüncü taraflara
            satılmaz. Veriler yalnızca:
          </p>
          <ul>
            <li>hizmetin teknik olarak çalışması için gerekli altyapı
              sağlayıcılarına (ör. Supabase, Apple, Google/Firebase, Expo),</li>
            <li>yasal zorunluluk halinde yetkili mercilere</li>
          </ul>
          <p>aktarılabilir.</p>
        </Section>

        <Section>
          <h2>6. Saklama süresi</h2>
          <p>
            Veriler, koçluk ilişkisinin devamı ve yasal yükümlülükler için
            gerekli olduğu süre boyunca saklanır. Hesap kapatma veya silme
            talepleri için veri sorumlusuna başvurabilirsiniz.
          </p>
        </Section>

        <Section>
          <h2>7. Haklarınız</h2>
          <p>
            KVKK kapsamında (uygun olduğu ölçüde) verilerinize erişme,
            düzeltme, silme, işlemeyi kısıtlama ve itiraz etme haklarına
            sahipsiniz. Taleplerinizi veri sorumlusuna iletebilirsiniz.
          </p>
        </Section>

        <Section>
          <h2>8. Çocuklar</h2>
          <p>
            Uygulama, koçluk programına kayıtlı öğrenciler içindir. 18 yaş
            altı kullanıcılar için hesaplar veli/yasal temsilci bilgilendirmesi
            ve yönetici onayı çerçevesinde oluşturulur.
          </p>
        </Section>

        <Section>
          <h2>9. Değişiklikler</h2>
          <p>
            Bu politika güncellenebilir. Güncel sürüm her zaman bu sayfada
            yayımlanır; önemli değişikliklerde uygulama veya ilgili kanallar
            üzerinden bilgilendirme yapılabilir.
          </p>
        </Section>

        <Section>
          <h2>10. İletişim</h2>
          <p>
            Gizlilik ile ilgili sorularınız için:{' '}
            <a href="https://mustafaocak.xyz" style={{ color: '#90caf9' }}>
              mustafaocak.xyz
            </a>
          </p>
          <p>
            Hesap ve veri silme talebi:{' '}
            <a href="/legal/x-akademi-hesap-silme" style={{ color: '#90caf9' }}>
              /legal/x-akademi-hesap-silme
            </a>
          </p>
        </Section>
      </Inner>
    </Page>
  );
}
