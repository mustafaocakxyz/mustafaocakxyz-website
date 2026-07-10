import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getFormAccent } from '../../styles/formTheme';
import { useAppAuth } from '../AppAuthContext';
import { AppCard, AppContent, AppShell, AppSubtitle, BlueTitle } from '../components/AppShell';
import { PrimaryButton } from '../components/AppUi';

const accent = getFormAccent('blue');

const LoginCard = styled(AppCard)`
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

const LoadingText = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
  text-align: center;
`;

export function AppLoginPage() {
  const { user, isLoading, login } = useAppAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <AppShell>
        <LoadingText>Yükleniyor...</LoadingText>
      </AppShell>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/app/admin' : '/app/student'} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const authenticated = await login(username, password);
      if (!authenticated) {
        setError('Kullanıcı adı veya şifre hatalı.');
        return;
      }

      navigate(authenticated.role === 'admin' ? '/app/admin' : '/app/student');
    } catch {
      setError('Giriş yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <AppContent>
        <div>
          <BlueTitle>Giriş</BlueTitle>
          <AppSubtitle style={{ marginTop: 8 }}>Gelişim programı uygulaması</AppSubtitle>
        </div>

        <LoginCard as="form" onSubmit={handleSubmit}>
          <FieldsStack>
            <FieldGroup>
              <FieldLabel htmlFor="username">Kullanıcı adı</FieldLabel>
              <FieldInput
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Kullanıcı adınız"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError('');
                }}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="password">Şifre</FieldLabel>
              <FieldInput
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Şifreniz"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError('');
                }}
              />
            </FieldGroup>

            {error ? <ErrorMessage>{error}</ErrorMessage> : null}

            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş yap'}
            </PrimaryButton>
          </FieldsStack>
        </LoginCard>
      </AppContent>
    </AppShell>
  );
}
