import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronRight, Library, ListVideo, Play } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppAuth } from '../AppAuthContext';
import {
  LIBRARY_KIND_LABEL,
  MOCK_LIBRARY_MATERIALS,
  flatEntryRightLabel,
  isFlatQuestionBank,
  materialItemCountLabel,
  questionBankEntryNoun,
  type LibraryMaterial,
  type LibraryMaterialKind,
} from '../data/libraryMaterials';
import { preview as t } from '../preview/adminPreviewTheme';
import {
  ContentCard,
  ContentSub,
  ContentTitle,
  CountBadge,
  DashboardGrid,
  EmptyState,
  IdentityCard,
  IdentityLeft,
  IdentitySub,
  IdentityTitle,
  IdentityTop,
  MainPanel,
  PreviewBody,
  PreviewFrame,
  PreviewShell,
  PreviewTopBar,
  SearchInput,
  Sidebar,
  SidebarHead,
  SidebarTitle,
  StatusChip,
  StudentCardButton,
  StudentListScroll,
  StudentName,
  TopBarActions,
  TopBarButton,
  TopBarEnd,
  TopBarTitle,
} from '../preview/AdminPreviewUi';

const DetailMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
`;

const DetailScroll = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100dvh - 240px);
  overflow-y: auto;
  padding-right: 2px;
  scrollbar-width: thin;
`;

const CompactCard = styled(ContentCard)`
  padding: 14px 16px;
  gap: 8px;
`;

const CompactTitle = styled(ContentTitle)`
  font-size: 0.95rem;
`;

const CompactSub = styled(ContentSub)`
  margin: 0 0 4px;
  font-size: 0.78rem;
`;

const VideoTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const VideoRow = styled.div`
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 52px;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: ${t.panel2};
`;

const VideoIndex = styled.span`
  font-size: 0.72rem;
  font-weight: 800;
  color: ${t.muted};
  text-align: center;
`;

const VideoTitle = styled.span`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${t.text};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const VideoDuration = styled.span`
  font-size: 0.72rem;
  font-weight: 800;
  color: ${t.muted};
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

const AccordionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const AccordionItem = styled.div<{ $open: boolean }>`
  border-radius: 10px;
  border: 1px solid ${({ $open }) => ($open ? 'rgba(96, 165, 250, 0.4)' : t.border)};
  background: ${({ $open }) => ($open ? 'rgba(59, 130, 246, 0.1)' : t.panel2)};
  overflow: hidden;
`;

const AccordionHeader = styled.button`
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: rgba(148, 163, 184, 0.08);
  }
`;

const AccordionChevron = styled(ChevronRight)<{ $open: boolean }>`
  color: ${t.muted};
  transform: rotate(${({ $open }) => ($open ? '90deg' : '0deg')});
  transition: transform 0.15s ease;
  flex-shrink: 0;
`;

const AccordionTitle = styled.span`
  font-size: 0.8rem;
  font-weight: 800;
  color: ${t.text};
  line-height: 1.25;
  min-width: 0;
`;

const AccordionCount = styled.span`
  font-size: 0.7rem;
  font-weight: 800;
  color: ${t.muted};
  white-space: nowrap;
`;

const AccordionBody = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 10px 8px 34px;
`;

const TestChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 7px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.65);
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(248, 250, 252, 0.9);
  line-height: 1.2;
`;

const IndexEntryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 8px 8px 28px;
`;

const IndexEntryRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 8px;
  padding: 4px 2px;
`;

const IndexEntryText = styled.span<{ $tone?: string }>`
  min-width: 0;
  font-size: 0.78rem;
  line-height: 1.35;
  color: ${({ $tone }) =>
    $tone === 'uygulama'
      ? '#f87171'
      : $tone === 'cevap'
        ? '#34d399'
        : $tone === 'kontrol'
          ? 'rgba(248, 250, 252, 0.92)'
          : 'rgba(248, 250, 252, 0.88)'};
  font-weight: ${({ $tone }) =>
    $tone === 'uygulama' || $tone === 'kontrol' || $tone === 'cevap' ? 800 : 600};
`;

const IndexEntryPrefix = styled.span`
  font-weight: 800;
  color: rgba(248, 250, 252, 0.96);
`;

const IndexEntryPage = styled.span`
  font-size: 0.72rem;
  font-weight: 800;
  color: ${t.muted};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

const AccordionTitleBlue = styled(AccordionTitle)`
  color: #93c5fd;
`;

const SourceLink = styled.a`
  font-size: 0.82rem;
  font-weight: 700;
  color: #93c5fd;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const CompactIdentity = styled(IdentityCard)`
  padding: 14px 16px;
`;

function kindIcon(kind: LibraryMaterialKind) {
  if (kind === 'playlist') return <ListVideo size={14} strokeWidth={2.4} aria-hidden />;
  if (kind === 'video_course') return <Play size={14} strokeWidth={2.4} aria-hidden />;
  return <BookOpen size={14} strokeWidth={2.4} aria-hidden />;
}

function PlaylistDetail({ material }: { material: Extract<LibraryMaterial, { kind: 'playlist' }> }) {
  return (
    <CompactCard>
      <CompactTitle>Videolar</CompactTitle>
      <CompactSub>{material.videos.length} video · YouTube playlist</CompactSub>
      <VideoTable>
        {material.videos.map((video, index) => (
          <VideoRow key={video.id}>
            <VideoIndex>{index + 1}</VideoIndex>
            <VideoTitle title={video.title}>{video.title}</VideoTitle>
            <VideoDuration>{video.duration}</VideoDuration>
          </VideoRow>
        ))}
      </VideoTable>
    </CompactCard>
  );
}

function QuestionBankDetail({
  material,
}: {
  material: Extract<LibraryMaterial, { kind: 'question_bank' }>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const entryNoun = questionBankEntryNoun(material);
  const flatIndex = isFlatQuestionBank(material);

  useEffect(() => {
    setOpenId(null);
  }, [material.id]);

  if (flatIndex) {
    const entries = material.chapters.flatMap((chapter) => chapter.tests);
    return (
      <CompactCard>
        <CompactTitle>İçindekiler</CompactTitle>
        <CompactSub>{materialItemCountLabel(material)}</CompactSub>
        <VideoTable>
          {entries.map((entry, index) => (
            <VideoRow key={entry.id}>
              <VideoIndex>{index + 1}</VideoIndex>
              <VideoTitle title={entry.title}>{entry.title}</VideoTitle>
              <VideoDuration>{flatEntryRightLabel(entry)}</VideoDuration>
            </VideoRow>
          ))}
        </VideoTable>
      </CompactCard>
    );
  }

  return (
    <CompactCard>
      <CompactTitle>İçindekiler</CompactTitle>
      <CompactSub>
        {materialItemCountLabel(material)} — başlığa tıkla
      </CompactSub>
      <AccordionList>
        {material.chapters.map((chapter) => {
          const open = openId === chapter.id;
          const indexStyle = chapter.tests.some(
            (test) => test.prefix != null || test.page != null || test.tone != null,
          );
          const TitleEl = indexStyle ? AccordionTitleBlue : AccordionTitle;
          return (
            <AccordionItem key={chapter.id} $open={open}>
              <AccordionHeader
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : chapter.id)}
              >
                <AccordionChevron size={14} strokeWidth={2.6} $open={open} aria-hidden />
                <TitleEl>{chapter.title}</TitleEl>
                <AccordionCount>
                  {chapter.pageRange
                    ? chapter.pageRange
                    : `${chapter.tests.length} ${entryNoun}`}
                </AccordionCount>
              </AccordionHeader>
              {open ? (
                indexStyle ? (
                  <IndexEntryList>
                    {chapter.tests.map((test) => (
                      <IndexEntryRow key={test.id}>
                        <IndexEntryText $tone={test.tone}>
                          {test.prefix ? (
                            <>
                              <IndexEntryPrefix>{test.prefix}</IndexEntryPrefix>{' '}
                              {test.title}:
                            </>
                          ) : (
                            <>{test.title}:</>
                          )}
                        </IndexEntryText>
                        {test.page != null ? (
                          <IndexEntryPage>{test.page}</IndexEntryPage>
                        ) : null}
                      </IndexEntryRow>
                    ))}
                  </IndexEntryList>
                ) : (
                  <AccordionBody>
                    {chapter.tests.map((test, index) => (
                      <TestChip key={test.id}>
                        <span>
                          {index + 1}. {test.title}
                        </span>
                      </TestChip>
                    ))}
                  </AccordionBody>
                )
              ) : null}
            </AccordionItem>
          );
        })}
      </AccordionList>
    </CompactCard>
  );
}

function MaterialDetail({ material }: { material: LibraryMaterial }) {
  return (
    <>
      <CompactIdentity>
        <IdentityTop>
          <IdentityLeft>
            <IdentityTitle>{material.name}</IdentityTitle>
            <IdentitySub>{material.subtitle}</IdentitySub>
            <DetailMetaRow>
              <StatusChip $tone="muted">
                {kindIcon(material.kind)}
                {LIBRARY_KIND_LABEL[material.kind]}
              </StatusChip>
              <StatusChip $tone="muted">{materialItemCountLabel(material)}</StatusChip>
              {material.kind === 'playlist' && material.sourceUrl ? (
                <SourceLink href={material.sourceUrl} target="_blank" rel="noopener noreferrer">
                  Kaynağı aç
                </SourceLink>
              ) : null}
            </DetailMetaRow>
          </IdentityLeft>
        </IdentityTop>
      </CompactIdentity>

      <DetailScroll>
        {material.kind === 'playlist' ? <PlaylistDetail material={material} /> : null}
        {material.kind === 'question_bank' ? (
          <QuestionBankDetail material={material} />
        ) : null}
        {material.kind === 'video_course' ? (
          <CompactCard>
            <CompactTitle>Dersler</CompactTitle>
            <CompactSub>{material.videos.length} video</CompactSub>
            <VideoTable>
              {material.videos.map((video, index) => (
                <VideoRow key={video.id}>
                  <VideoIndex>{index + 1}</VideoIndex>
                  <VideoTitle title={video.title}>{video.title}</VideoTitle>
                  <VideoDuration>{video.duration}</VideoDuration>
                </VideoRow>
              ))}
            </VideoTable>
          </CompactCard>
        ) : null}
      </DetailScroll>
    </>
  );
}

export function AdminLibraryPage() {
  const { user, isLoading } = useAppAuth();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>('bilgisarmal-tyt-matematik');

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    if (!q) return MOCK_LIBRARY_MATERIALS;
    return MOCK_LIBRARY_MATERIALS.filter((m) => {
      const haystack = `${m.name} ${m.subtitle} ${LIBRARY_KIND_LABEL[m.kind]}`.toLocaleLowerCase(
        'tr',
      );
      return haystack.includes(q);
    });
  }, [query]);

  const selected = useMemo(
    () => MOCK_LIBRARY_MATERIALS.find((m) => m.id === selectedId) ?? null,
    [selectedId],
  );

  if (isLoading) {
    return (
      <PreviewShell>
        <PreviewBody>
          <EmptyState>Yükleniyor…</EmptyState>
        </PreviewBody>
      </PreviewShell>
    );
  }

  if (!user) return <Navigate to="/app" replace />;
  if (user.role !== 'admin') return <Navigate to="/app/student" replace />;

  return (
    <PreviewShell>
      <PreviewTopBar>
        <TopBarTitle>Kütüphane</TopBarTitle>
        <TopBarActions>
          <TopBarButton as={Link} to="/app/admin">
            ← Admin paneline dön
          </TopBarButton>
        </TopBarActions>
        <TopBarEnd />
      </PreviewTopBar>

      <PreviewBody>
        <PreviewFrame>
          <DashboardGrid>
            <Sidebar>
              <SidebarHead>
                <SidebarTitle>Materyaller</SidebarTitle>
                <CountBadge>{filtered.length}</CountBadge>
              </SidebarHead>
              <SearchInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Materyal ara..."
                aria-label="Materyal ara"
              />
              <StudentListScroll>
                {filtered.map((material) => (
                  <StudentCardButton
                    key={material.id}
                    type="button"
                    $selected={material.id === selectedId}
                    onClick={() => setSelectedId(material.id)}
                  >
                    <StudentName>{material.name}</StudentName>
                  </StudentCardButton>
                ))}
                {filtered.length === 0 ? (
                  <EmptyState>Materyal bulunamadı.</EmptyState>
                ) : null}
              </StudentListScroll>
            </Sidebar>

            <MainPanel>
              {selected ? (
                <MaterialDetail material={selected} />
              ) : (
                <EmptyState>
                  <Library size={20} strokeWidth={2.2} aria-hidden />
                  &nbsp;Soldan bir materyal seç.
                </EmptyState>
              )}
            </MainPanel>
          </DashboardGrid>
        </PreviewFrame>
      </PreviewBody>
    </PreviewShell>
  );
}
