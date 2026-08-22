import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { requestPasswordReset } from '../lib/requestPasswordReset';

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

const Button = styled.button`
  margin-top: 4px;
  border: none;
  border-radius: 14px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #2196f3 100%);
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
 * Hidden password reset request page (not in main nav).
 * Public URL: https://mustafaocak.xyz/legal/x-akademi-sifre-sifirla
 */
export function XAkademiPasswordResetPage() {
  const [username, setUsername] = useState('');
  const [note, setNote] = useState('');
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

    setSubmitting(true);
    try {
      const result = await requestPasswordReset({
        loginUsername: username,
        note,
      });
      setSuccess(
        result.message ?? 'Talebin alındı. Koçun en kısa sürede yeni şifreni iletecek.',
      );
      setUsername('');
      setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Talep gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page>
      <Inner>
        <Title>X Akademi — Şifre sıfırlama talebi</Title>
        <Meta>Gelişim programı öğrenci hesabı</Meta>

        <Section>
          <p>
            Şifreni unuttuysan kullanıcı adını gönder. Koçun talebi görüp yeni bir şifre
            belirleyecek ve sana iletecek. Hesabın ve geçmiş verilerin aynı kalır.
          </p>
        </Section>

        <Section>
          <h2>Nasıl işler?</h2>
          <ul>
            <li>Sadece uygulamadaki <strong>kullanıcı adını</strong> yazman yeterli.</li>
            <li>Talep koça düşer; yeni şifre WhatsApp grubundan veya koçtan iletilir.</li>
            <li>E-posta ile otomatik sıfırlama yoktur (hesap e-postaları sanaldır).</li>
          </ul>
        </Section>

        <Section>
          <h2>Talep formu</h2>
          {success ? <SuccessText>{success}</SuccessText> : null}
          {error ? <ErrorText>{error}</ErrorText> : null}

          {!success ? (
            <Form onSubmit={(e) => void onSubmit(e)}>
              <Label>
                Kullanıcı adı *
                <Input
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="örn. ahmet123"
                  required
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
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Gönderiliyor…' : 'Şifre sıfırlama talebi gönder'}
              </Button>
            </Form>
          ) : null}
        </Section>
      </Inner>
    </Page>
  );
}
