import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  fetchPendingPasswordResetRequests,
  fetchStudentAdminSettings,
  rejectPasswordResetRequest,
  updateStudentEarningsContribution,
  updateStudentSetting,
  type StudentSettingKey,
} from '../api/appData';
import { useAppAuth } from '../AppAuthContext';
import type {
  EarningsContribution,
  PasswordResetRequest,
  StudentAdminSettings,
} from '../types';
import { earningsContributionLabel, nextEarningsContribution } from '../types';
import { adminResetStudentPassword } from '../../lib/adminResetPassword';
import { preview as t } from '../preview/adminPreviewTheme';
import {
  ContentCard,
  ContentSub,
  ContentTitle,
  EmptyState,
  ErrorText,
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

const StudentSettingsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
`;

const StudentRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 8px 10px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const StudentName = styled.div`
  flex: 1 1 160px;
  min-width: 0;
  font-size: 0.88rem;
  font-weight: 800;
  color: ${t.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ToggleCluster = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex: 0 0 auto;

  @media (max-width: 720px) {
    justify-content: stretch;

    & > * {
      flex: 1 1 0;
    }
  }
`;

const ToggleChip = styled.button<{ $on: boolean; $busy?: boolean; $accent?: 'green' | 'orange' }>`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 72px;
  padding: 6px 8px;
  border-radius: 10px;
  border: 1px solid
    ${({ $on, $accent }) =>
      !$on
        ? t.border
        : $accent === 'orange'
          ? 'rgba(251, 146, 60, 0.5)'
          : 'rgba(52, 211, 153, 0.45)'};
  background: ${({ $on, $accent }) =>
    !$on
      ? 'rgba(15, 23, 42, 0.45)'
      : $accent === 'orange'
        ? 'rgba(234, 88, 12, 0.16)'
        : 'rgba(52, 211, 153, 0.14)'};
  color: ${t.text};
  font: inherit;
  cursor: ${({ $busy }) => ($busy ? 'wait' : 'pointer')};
  opacity: ${({ $busy }) => ($busy ? 0.7 : 1)};

  &:hover:not(:disabled) {
    border-color: rgba(96, 165, 250, 0.45);
  }

  &:disabled {
    cursor: wait;
  }
`;

const ToggleLabel = styled.span`
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.2;
  color: ${t.muted};
  white-space: nowrap;
`;

const ToggleValue = styled.span<{ $on: boolean; $accent?: 'green' | 'orange' }>`
  font-size: 0.72rem;
  font-weight: 800;
  color: ${({ $on, $accent }) =>
    !$on ? t.mutedSoft : $accent === 'orange' ? '#fdba74' : t.success};
`;

const ResetStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
`;

const ResetRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
`;

const ResetMeta = styled.div`
  flex: 1 1 180px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ResetTitle = styled.div`
  font-size: 0.88rem;
  font-weight: 800;
  color: ${t.text};
`;

const ResetSub = styled.div`
  font-size: 0.74rem;
  color: ${t.muted};
  line-height: 1.35;
`;

const ResetActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const ResetInput = styled.input`
  min-width: 140px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid ${t.borderStrong};
  background: rgba(15, 23, 42, 0.55);
  color: ${t.text};
  font: inherit;
  font-size: 0.82rem;

  &:focus {
    outline: none;
    border-color: rgba(96, 165, 250, 0.5);
  }
`;

const ResetSelect = styled.select`
  min-width: 180px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid ${t.borderStrong};
  background: rgba(15, 23, 42, 0.55);
  color: ${t.text};
  font: inherit;
  font-size: 0.82rem;
`;

const ResetButton = styled.button<{ $variant?: 'danger' | 'primary' }>`
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid
    ${({ $variant }) =>
      $variant === 'danger' ? 'rgba(248, 113, 113, 0.45)' : 'rgba(96, 165, 250, 0.45)'};
  background: ${({ $variant }) =>
    $variant === 'danger' ? 'rgba(248, 113, 113, 0.14)' : 'rgba(59, 130, 246, 0.16)'};
  color: ${t.text};
  font: inherit;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`;

const HiddenLinkHint = styled.code`
  font-size: 0.78rem;
  color: ${t.muted};
`;

function formatRequestTime(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

const BOOL_SETTING_ROWS: { key: StudentSettingKey; label: string; title: string }[] = [
  { key: 'showOnAdminDashboard', label: 'Panel', title: 'Admin panelde göster' },
  { key: 'showOnOgrenciler', label: 'Öğrenciler', title: 'Öğrenciler sayfasında göster' },
  { key: 'dayCountActive', label: 'Gün', title: 'Gün sayacı aktif' },
];

function boolSettingValue(student: StudentAdminSettings, key: StudentSettingKey): boolean {
  if (key === 'showOnAdminDashboard') return student.showOnAdminDashboard;
  if (key === 'showOnOgrenciler') return student.showOnOgrenciler;
  return student.dayCountActive;
}

function earningsAccent(value: EarningsContribution): 'green' | 'orange' | undefined {
  if (value === 5000) return 'green';
  if (value === 6000) return 'orange';
  return undefined;
}

export function AdminSettingsPage() {
  const { user, isLoading, logout } = useAppAuth();
  const [students, setStudents] = useState<StudentAdminSettings[]>([]);
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadResetRequests = async () => {
    setResetLoading(true);
    try {
      const rows = await fetchPendingPasswordResetRequests();
      setResetRequests(rows);
    } catch {
      setError('Şifre sıfırlama talepleri yüklenemedi. 033 SQL çalıştırıldı mı?');
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    let mounted = true;
    setPageLoading(true);
    setError('');
    void (async () => {
      try {
        const rows = await fetchStudentAdminSettings();
        if (mounted) setStudents(rows);
      } catch {
        if (mounted) setError('Öğrenci ayarları yüklenemedi. 026/032 SQL çalıştırıldı mı?');
      } finally {
        if (mounted) setPageLoading(false);
      }
    })();
    void loadResetRequests();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleBoolToggle = async (studentId: string, key: StudentSettingKey) => {
    const current = students.find((row) => row.id === studentId);
    if (!current) return;
    const nextValue = !boolSettingValue(current, key);
    const token = `${studentId}:${key}`;
    setBusyKey(token);
    setError('');
    try {
      const updated = await updateStudentSetting(studentId, key, nextValue);
      setStudents((rows) => rows.map((row) => (row.id === studentId ? updated : row)));
    } catch {
      setError('Ayar kaydedilemedi.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleEarningsCycle = async (studentId: string) => {
    const current = students.find((row) => row.id === studentId);
    if (!current) return;
    const nextValue = nextEarningsContribution(current.earningsContribution);
    const token = `${studentId}:earnings`;
    setBusyKey(token);
    setError('');
    try {
      const updated = await updateStudentEarningsContribution(studentId, nextValue);
      setStudents((rows) => rows.map((row) => (row.id === studentId ? updated : row)));
    } catch {
      setError('Kazanç ayarı kaydedilemedi. 032 SQL çalıştırıldı mı?');
    } finally {
      setBusyKey(null);
    }
  };

  const studentNameById = (studentId: string | null, loginUsername: string) => {
    if (!studentId) return loginUsername;
    return students.find((row) => row.id === studentId)?.name ?? loginUsername;
  };

  const handleSavePassword = async (request: PasswordResetRequest) => {
    if (!request.userId) {
      setError('Bu talep geçersiz (öğrenci kimliği yok).');
      return;
    }
    const newPassword = passwordDrafts[request.id]?.trim() ?? '';
    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalı.');
      return;
    }

    const token = `reset:save:${request.id}`;
    setBusyKey(token);
    setError('');
    try {
      await adminResetStudentPassword({
        studentId: request.userId,
        newPassword,
        requestId: request.id,
      });
      setPasswordDrafts((drafts) => {
        const next = { ...drafts };
        delete next[request.id];
        return next;
      });
      await loadResetRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre kaydedilemedi.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const token = `reset:reject:${requestId}`;
    setBusyKey(token);
    setError('');
    try {
      await rejectPasswordResetRequest(requestId);
      await loadResetRequests();
    } catch {
      setError('Talep reddedilemedi.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleManualReset = async () => {
    if (!manualStudentId) {
      setError('Öğrenci seç.');
      return;
    }
    const newPassword = manualPassword.trim();
    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalı.');
      return;
    }

    setBusyKey('reset:manual');
    setError('');
    try {
      await adminResetStudentPassword({
        studentId: manualStudentId,
        newPassword,
      });
      setManualPassword('');
      await loadResetRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre kaydedilemedi.');
    } finally {
      setBusyKey(null);
    }
  };

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

          <ContentCard>
            <ContentTitle>Şifre sıfırlama</ContentTitle>
            <ContentSub>
              Öğrenci talepleri burada görünür. Yeni şifreyi kaydet, WhatsApp’tan ilet. Gizli
              talep linki:{' '}
              <HiddenLinkHint>/legal/x-akademi-sifre-sifirla</HiddenLinkHint>
            </ContentSub>
            {resetLoading ? <LoadingText>Talepler yükleniyor...</LoadingText> : null}
            {!resetLoading && resetRequests.length === 0 ? (
              <EmptyState>Bekleyen şifre sıfırlama talebi yok.</EmptyState>
            ) : null}
            {!resetLoading && resetRequests.length > 0 ? (
              <ResetStack>
                {resetRequests.map((request) => {
                  const busySave = busyKey === `reset:save:${request.id}`;
                  const busyReject = busyKey === `reset:reject:${request.id}`;
                  return (
                    <ResetRow key={request.id}>
                      <ResetMeta>
                        <ResetTitle>
                          {studentNameById(request.userId, request.loginUsername)}
                        </ResetTitle>
                        <ResetSub>
                          @{request.loginUsername} · {formatRequestTime(request.requestedAt)}
                          {request.note ? ` · ${request.note}` : ''}
                        </ResetSub>
                      </ResetMeta>
                      <ResetActions>
                        <ResetInput
                          type="text"
                          autoComplete="new-password"
                          placeholder="Yeni şifre"
                          value={passwordDrafts[request.id] ?? ''}
                          disabled={busySave || busyReject}
                          onChange={(event) =>
                            setPasswordDrafts((drafts) => ({
                              ...drafts,
                              [request.id]: event.target.value,
                            }))
                          }
                        />
                        <ResetButton
                          type="button"
                          $variant="primary"
                          disabled={busySave || busyReject}
                          onClick={() => void handleSavePassword(request)}
                        >
                          {busySave ? 'Kaydediliyor…' : 'Kaydet'}
                        </ResetButton>
                        <ResetButton
                          type="button"
                          $variant="danger"
                          disabled={busySave || busyReject}
                          onClick={() => void handleRejectRequest(request.id)}
                        >
                          {busyReject ? '…' : 'Reddet'}
                        </ResetButton>
                      </ResetActions>
                    </ResetRow>
                  );
                })}
              </ResetStack>
            ) : null}

            <ContentSub style={{ marginTop: 16 }}>
              Talep olmadan da öğrenci seçip şifre sıfırlayabilirsin.
            </ContentSub>
            <ResetActions style={{ marginTop: 8 }}>
              <ResetSelect
                value={manualStudentId}
                onChange={(event) => setManualStudentId(event.target.value)}
                disabled={busyKey === 'reset:manual'}
              >
                <option value="">Öğrenci seç…</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </ResetSelect>
              <ResetInput
                type="text"
                autoComplete="new-password"
                placeholder="Yeni şifre"
                value={manualPassword}
                disabled={busyKey === 'reset:manual'}
                onChange={(event) => setManualPassword(event.target.value)}
              />
              <ResetButton
                type="button"
                $variant="primary"
                disabled={busyKey === 'reset:manual'}
                onClick={() => void handleManualReset()}
              >
                {busyKey === 'reset:manual' ? 'Kaydediliyor…' : 'Manuel sıfırla'}
              </ResetButton>
            </ResetActions>
          </ContentCard>

          <ContentCard>
            <ContentTitle>Öğrenci ayarları</ContentTitle>
            <ContentSub>
              Panel / öğrenciler / gün: aç-kapa. Kazanç: Kapalı → 5000 → 6000 (tıkla).
            </ContentSub>
            {error ? <ErrorText>{error}</ErrorText> : null}
            {pageLoading ? <LoadingText>Yükleniyor...</LoadingText> : null}
            {!pageLoading && students.length === 0 ? (
              <EmptyState>Aktif öğrenci yok.</EmptyState>
            ) : null}
            <StudentSettingsStack>
              {students.map((student) => {
                const earnings = student.earningsContribution;
                const earningsOn = earnings > 0;
                const earningsBusy = busyKey === `${student.id}:earnings`;
                const accent = earningsAccent(earnings);
                return (
                  <StudentRow key={student.id}>
                    <StudentName title={student.name}>{student.name}</StudentName>
                    <ToggleCluster>
                      {BOOL_SETTING_ROWS.map((row) => {
                        const on = boolSettingValue(student, row.key);
                        const busy = busyKey === `${student.id}:${row.key}`;
                        return (
                          <ToggleChip
                            key={row.key}
                            type="button"
                            $on={on}
                            $busy={busy}
                            disabled={busy}
                            title={row.title}
                            aria-label={`${student.name}: ${row.title}`}
                            onClick={() => void handleBoolToggle(student.id, row.key)}
                          >
                            <ToggleLabel>{row.label}</ToggleLabel>
                            <ToggleValue $on={on}>{on ? 'Açık' : 'Kapalı'}</ToggleValue>
                          </ToggleChip>
                        );
                      })}
                      <ToggleChip
                        type="button"
                        $on={earningsOn}
                        $accent={accent}
                        $busy={earningsBusy}
                        disabled={earningsBusy}
                        title="Kazanç katkısı: Kapalı → 5000 → 6000"
                        aria-label={`${student.name}: Kazanç ${earningsContributionLabel(earnings)}`}
                        onClick={() => void handleEarningsCycle(student.id)}
                      >
                        <ToggleLabel>Kazanç</ToggleLabel>
                        <ToggleValue $on={earningsOn} $accent={accent}>
                          {earningsContributionLabel(earnings)}
                        </ToggleValue>
                      </ToggleChip>
                    </ToggleCluster>
                  </StudentRow>
                );
              })}
            </StudentSettingsStack>
          </ContentCard>
        </PreviewFrame>
      </PreviewBody>
    </PreviewShell>
  );
}
