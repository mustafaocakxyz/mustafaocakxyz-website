import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { requestAccountDeletion } from '../lib/requestAccountDeletion';

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
  margin: 0 0 28px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
`;

const Section = styled.section`
  margin-bottom: 24px;

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

  a {
    color: #90caf9;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 8px;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.88rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;

  &:focus {
    border-color: rgba(144, 202, 249, 0.7);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 96px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  resize: vertical;

  &:focus {
    border-color: rgba(144, 202, 249, 0.7);
  }
`;

const CheckboxRow = styled.label`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.78);
  cursor: pointer;

  input {
    margin-top: 3px;
  }
`;

const Button = styled.button`
  margin-top: 4px;
  border: none;
  border-radius: 14px;
  padding: 14px 18px;
  background: #e53935;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.p`
  margin: 0;
  color: #ff8a80;
  font-size: 0.9rem;
`;

const SuccessText = styled.p`
  margin: 0;
  color: rgba(144, 202, 249, 0.95);
  font-size: 0.95rem;
  line-height: 1.55;
`;

/**
 * Hidden Play/App Store account-deletion page (not in main nav).
 * Public URL: https://mustafaocak.xyz/legal/x-akademi-hesap-silme
 */
export function XAkademiAccountDeletionPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim()) {
      setError('Kullanıcı adını gir.');
      return;
    }
    if (!confirmed) {
      setError('Devam etmek için silme onay kutusunu işaretle.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await requestAccountDeletion({
        loginUsername: username,
        contactEmail: email,
        note,
      });
      setSuccess(
        result.message ??
          'Talebin alındı. Hesap bulunduysa erişim hemen kapatılır; kişisel veriler en geç 30 gün içinde silinir.',
      );
      setUsername('');
      setEmail('');
      setNote('');
      setConfirmed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Talep gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page>
      <Inner>
        <Title>X Akademi App — Hesap Silme Talebi</Title>
        <Meta>Google Play / App Store hesap silme talebi</Meta>

        <Section>
          <p>
            Bu sayfa, <strong>X Akademi App</strong> öğrenci hesabınızın ve ilişkili
            kişisel verilerinizin silinmesini talep etmek içindir. Hesaplar
            yönetici tarafından oluşturulur; silme talebi web üzerinden
            yapılabilir.
          </p>
        </Section>

        <Section>
          <h2>Ne silinir / ne zaman?</h2>
          <ul>
            <li>
              Talep alındığında (eşleşen öğrenci hesabı varsa) hesap erişimi{' '}
              <strong>hemen kapatılır</strong> (giriş yapılamaz).
            </li>
            <li>
              Push bildirim token’ları derhal kaldırılır.
            </li>
            <li>
              Görevler, form yanıtları, notlar, görüşmeler, sohbet mesajları ve
              ekler dahil kişisel veriler <strong>en geç 30 gün içinde</strong>{' '}
              kalıcı olarak silinir.
            </li>
            <li>
              Yasal saklama zorunluluğu olan kayıtlar (varsa) ilgili süre kadar
              tutulabilir.
            </li>
          </ul>
          <p>
            Gizlilik politikası:{' '}
            <a href="/legal/x-akademi-gizlilik">/legal/x-akademi-gizlilik</a>
          </p>
        </Section>

        <Section>
          <h2>Silme talebi formu</h2>
          {success ? <SuccessText>{success}</SuccessText> : null}
          {error ? <ErrorText>{error}</ErrorText> : null}

          {!success ? (
            <Form onSubmit={(e) => void onSubmit(e)}>
              <Label>
                Uygulama kullanıcı adı *
                <Input
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="örn. teststudent"
                  required
                />
              </Label>
              <Label>
                İletişim e-postası (isteğe bağlı)
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Yanıt için e-posta"
                />
              </Label>
              <Label>
                Not (isteğe bağlı)
                <TextArea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Varsa ek bilgi"
                />
              </Label>
              <CheckboxRow>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span>
                  Hesabımın kapatılmasını ve kişisel verilerimin yukarıdaki
                  süreler içinde silinmesini talep ettiğimi onaylıyorum.
                </span>
              </CheckboxRow>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Gönderiliyor…' : 'Hesap silme talebi gönder'}
              </Button>
            </Form>
          ) : null}
        </Section>
      </Inner>
    </Page>
  );
}
