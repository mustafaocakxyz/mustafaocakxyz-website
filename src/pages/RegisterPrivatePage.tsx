import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { getFormAccent } from '../styles/formTheme';
import { registerUser } from '../app/api/registerUser';
import { AppCard, AppContent, AppShell, AppSubtitle, BlueTitle } from '../app/components/AppShell';
import { PrimaryButton } from '../app/components/AppUi';

const accent = getFormAccent('blue');

const FormCard = styled(AppCard)`
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
`;

const FieldsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FieldLabel = styled.label`
  font-size: 0.88rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
`;

const FieldInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid ${accent.inputBorder};
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:focus {
    border-color: ${accent.inputBorderFocus};
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const ErrorMessage = styled.p`
  margin: 0;
  font-size: 0.88rem;
  color: #ff8a80;
`;

const SuccessMessage = styled.p`
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.5;
  color: rgba(144, 202, 249, 0.95);
`;

const FooterLink = styled(Link)`
  font-size: 0.9rem;
  color: rgba(100, 181, 246, 0.9);
  text-decoration: none;

  &:hover {
    color: rgba(144, 202, 249, 1);
  }
`;

export function RegisterPrivatePage() {
  const [displayName, setDisplayName] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const trimmedUsername = loginUsername.trim().toLowerCase();
    const trimmedName = displayName.trim();

    if (!trimmedName || !trimmedUsername || !password) {
      setError('Tüm alanları doldurun.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerUser({
        loginUsername: trimmedUsername,
        displayName: trimmedName,
        password,
      });

      if (result.session) {
        setSuccess('Hesap oluşturuldu. Giriş sayfasına yönlenebilirsin.');
      } else {
        setSuccess(
          'Hesap oluşturuldu. E-posta doğrulaması açıksa gelen kutunu kontrol et, ardından giriş yap.',
        );
      }

      setDisplayName('');
      setLoginUsername('');
      setPassword('');
      setConfirmPassword('');
    } catch (registerError) {
      const message =
        registerError instanceof Error ? registerError.message : 'Kayıt oluşturulamadı.';
      if (message.toLowerCase().includes('rate limit')) {
        setError('Çok fazla deneme yapıldı. Birkaç dakika bekleyip tekrar deneyin.');
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <AppContent>
        <div>
          <BlueTitle>Öğrenci kaydı</BlueTitle>
          <AppSubtitle style={{ marginTop: 8 }}>Gizli kayıt sayfası</AppSubtitle>
        </div>

        <FormCard as="form" onSubmit={handleSubmit}>
          <FieldsStack>
            <FieldGroup>
              <FieldLabel htmlFor="display-name">Ad soyad</FieldLabel>
              <FieldInput
                id="display-name"
                type="text"
                placeholder="Ayşe Yılmaz"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="login-username">Kullanıcı adı</FieldLabel>
              <FieldInput
                id="login-username"
                type="text"
                autoComplete="username"
                placeholder="ogrenci"
                value={loginUsername}
                onChange={(event) => setLoginUsername(event.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="password">Şifre</FieldLabel>
              <FieldInput
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="En az 6 karakter"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="confirm-password">Şifre tekrar</FieldLabel>
              <FieldInput
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Şifrenizi tekrar girin"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </FieldGroup>

            {error ? <ErrorMessage>{error}</ErrorMessage> : null}
            {success ? <SuccessMessage>{success}</SuccessMessage> : null}

            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Kayıt oluşturuluyor...' : 'Hesap oluştur'}
            </PrimaryButton>
          </FieldsStack>
        </FormCard>

        <FooterLink to="/app">Giriş sayfasına git</FooterLink>
      </AppContent>
    </AppShell>
  );
}
