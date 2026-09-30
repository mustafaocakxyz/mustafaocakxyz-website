import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  fetchAssistantTestDetail,
  fetchSubmittedAssistantTests,
  type AssistantTestDetail,
  type AssistantTestListItem,
} from '../assistantTest/adminApi';
import { useAppAuth } from '../AppAuthContext';
import { AssistantExamPane } from './AssistantTestPage';
import { preview as t } from '../preview/adminPreviewTheme';
import {
  EmptyState,
  ErrorText,
  LoadingText,
  PreviewShell,
  PreviewTopBar,
  TopBarActions,
  TopBarButton,
  TopBarEnd,
  TopBarTitle,
} from '../preview/AdminPreviewUi';

function formatSubmitted(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function AdminAssistantResultsPage() {
  const { user, isLoading } = useAppAuth();
  const [items, setItems] = useState<AssistantTestListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AssistantTestDetail | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    let active = true;
    setListLoading(true);
    setError('');
    void fetchSubmittedAssistantTests()
      .then((rows) => {
        if (!active) return;
        setItems(rows);
        setSelectedId((current) => current ?? rows[0]?.id ?? null);
      })
      .catch(() => {
        if (active) setError('Sonuçlar alınamadı.');
      })
      .finally(() => {
        if (active) setListLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!selectedId || !user || user.role !== 'admin') {
      setDetail(null);
      return;
    }
    let active = true;
    setDetail(null);
    setDetailLoading(true);
    setError('');
    void fetchAssistantTestDetail(selectedId)
      .then((row) => {
        if (active) setDetail(row);
      })
      .catch(() => {
        if (active) setError('Bu sonuç açılamadı.');
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId, user]);

  if (isLoading) {
    return (
      <Page>
        <PreviewTopBar>
          <TopBarTitle>Asistan sonuçları</TopBarTitle>
          <TopBarActions />
          <TopBarEnd />
        </PreviewTopBar>
        <LoadingText>Yükleniyor...</LoadingText>
      </Page>
    );
  }

  if (!user) return <Navigate to="/app" replace />;
  if (user.role !== 'admin') return <Navigate to="/app/student" replace />;

  return (
    <Page>
      <PreviewTopBar>
        <TopBarTitle>Asistan sonuçları</TopBarTitle>
        <TopBarActions>
          <TopBarButton as={Link} to="/app/admin">
            ← Admin paneline dön
          </TopBarButton>
        </TopBarActions>
        <TopBarEnd />
      </PreviewTopBar>

      <Workspace>
        <NameColumn aria-label="Gönderenler">
          <ColumnLabel>Gönderenler</ColumnLabel>
          {listLoading ? <LoadingText>Yükleniyor...</LoadingText> : null}
          {!listLoading && items.length === 0 ? (
            <EmptyState>Henüz gönderilmiş sonuç yok.</EmptyState>
          ) : null}
          <NameList>
            {items.map((item) => {
              const selected = item.id === selectedId;
              return (
                <NameButton
                  key={item.id}
                  type="button"
                  $selected={selected}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => setSelectedId(item.id)}
                >
                  <Name>
                    {item.firstName} {item.lastName}
                  </Name>
                  <When>{formatSubmitted(item.submittedAt)}</When>
                </NameButton>
              );
            })}
          </NameList>
        </NameColumn>

        <ReviewSlot>
          {error ? <ErrorText>{error}</ErrorText> : null}
          {detailLoading ? <LoadingText>Yükleniyor...</LoadingText> : null}
          {!detailLoading && detail ? (
            <AssistantExamPane
              firstName={detail.firstName}
              lastName={detail.lastName}
              answers={detail.answers}
              readOnly
              fill
            />
          ) : null}
          {!listLoading && !detailLoading && items.length === 0 ? (
            <EmptyHint>Gönderilen bir değerlendirme seçildiğinde burada açılır.</EmptyHint>
          ) : null}
        </ReviewSlot>
      </Workspace>
    </Page>
  );
}

const Page = styled(PreviewShell)`
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
`;

const Workspace = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
  }
`;

const NameColumn = styled.aside`
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-right: 1px solid ${t.border};
  background: rgba(15, 23, 42, 0.72);

  @media (max-width: 860px) {
    border-right: none;
    border-bottom: 1px solid ${t.border};
    max-height: 220px;
  }
`;

const ColumnLabel = styled.p`
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${t.muted};
`;

const NameList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NameButton = styled.button<{ $selected: boolean }>`
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${({ $selected }) => ($selected ? 'rgba(96, 165, 250, 0.55)' : t.border)};
  background: ${({ $selected }) => ($selected ? 'rgba(59, 130, 246, 0.16)' : t.panel)};
  color: ${t.text};
  font: inherit;
  cursor: pointer;

  &:hover {
    border-color: rgba(96, 165, 250, 0.45);
  }
`;

const Name = styled.span`
  font-size: 0.95rem;
  font-weight: 800;
`;

const When = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${t.muted};
`;

const ReviewSlot = styled.div`
  min-height: 0;
  min-width: 0;
  overflow: hidden;
`;

const EmptyHint = styled.p`
  margin: 0;
  padding: 28px 20px;
  color: ${t.muted};
`;
