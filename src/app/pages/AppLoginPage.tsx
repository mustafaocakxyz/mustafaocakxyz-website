import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppAuth } from '../AppAuthContext';
import { preview as t } from '../preview/adminPreviewTheme';
import {
  AccentButton,
  ContentCard,
  ContentSub,
  ContentTitle,
  LoadingText,
  PreviewShell,
} from '../preview/AdminPreviewUi';

const LoginBody = styled.div`
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px 48px;
  box-sizing: border-box;
`;

const LoginCard = styled(ContentCard)`
  width: 100%;
  max-width: 420px;
`;

const Intro = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 4px;
`;

const FieldsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.label`
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${t.muted};
`;

const FieldInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;

  &:focus {
    border-color: rgba(96, 165, 250, 0.55);
    background: rgba(30, 41, 59, 0.92);
  }

  &::placeholder {
    color: ${t.mutedSoft};
  }
`;

const ErrorMessage = styled.p`
  margin: 0;
  font-size: 0.88rem;
  color: ${t.danger};
`;

const SubmitButton = styled(AccentButton)`
  width: 100%;
  justify-content: center;
  padding: 14px 18px;
  margin-top: 4px;
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
      <PreviewShell>
        <LoginBody>
          <LoadingText>Yükleniyor...</LoadingText>
        </LoginBody>
      </PreviewShell>
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
    <PreviewShell>
      <LoginBody>
        <LoginCard as="form" onSubmit={handleSubmit}>
          <Intro>
            <ContentTitle>Giriş</ContentTitle>
            <ContentSub>Gelişim programı uygulaması</ContentSub>
          </Intro>

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

            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş yap'}
            </SubmitButton>
          </FieldsStack>
        </LoginCard>
      </LoginBody>
    </PreviewShell>
  );
}
