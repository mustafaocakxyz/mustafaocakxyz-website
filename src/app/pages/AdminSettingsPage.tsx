import { Link, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppAuth } from '../AppAuthContext';
import { preview as t } from '../preview/adminPreviewTheme';
import {
  ContentCard,
  ContentSub,
  ContentTitle,
  LoadingText,
  PreviewBody,
  PreviewFrame,
  PreviewShell,
  PreviewTopBar,
  TopBarActions,
  TopBarButton,
  TopBarEnd,
  TopBarTitle,
} from '../preview/AdminPreviewUi';

const SettingsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 420px;
`;

const SettingsAction = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.borderStrong};
  background: ${t.panel2};
  color: ${t.text};
  font: inherit;
  font-size: 0.95rem;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    border-color: rgba(96, 165, 250, 0.5);
  }
`;

const SettingsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.borderStrong};
  background: ${t.panel2};
  color: ${t.text};
  font: inherit;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  text-align: left;

  &:hover {
    border-color: rgba(96, 165, 250, 0.5);
  }
`;

const ActionHint = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${t.muted};
`;

export function AdminSettingsPage() {
  const { user, isLoading, logout } = useAppAuth();

  if (isLoading) {
    return (
      <PreviewShell>
        <PreviewBody>
          <PreviewFrame>
            <LoadingText>Yükleniyor...</LoadingText>
          </PreviewFrame>
        </PreviewBody>
      </PreviewShell>
    );
  }

  if (!user) return <Navigate to="/app" replace />;
  if (user.role !== 'admin') return <Navigate to="/app/student" replace />;

  return (
    <PreviewShell>
      <PreviewTopBar>
        <TopBarTitle>Ayarlar</TopBarTitle>
        <TopBarActions>
          <TopBarButton as={Link} to="/app/admin">
            ← Admin paneline dön
          </TopBarButton>
        </TopBarActions>
        <TopBarEnd />
      </PreviewTopBar>

      <PreviewBody>
        <PreviewFrame>
          <ContentCard>
            <ContentTitle>Hesap & vitrin</ContentTitle>
            <ContentSub>Vitrin düzenleme ve oturum işlemleri.</ContentSub>
            <SettingsStack>
              <SettingsAction to="/app/admin/showcase">
                Vitrin Düzenle
                <ActionHint>Öne çıkanlar</ActionHint>
              </SettingsAction>
              <SettingsButton
                type="button"
                onClick={() => {
                  void logout();
                }}
              >
                Çıkış Yap
                <ActionHint>Oturumu kapat</ActionHint>
              </SettingsButton>
            </SettingsStack>
          </ContentCard>
        </PreviewFrame>
      </PreviewBody>
    </PreviewShell>
  );
}
