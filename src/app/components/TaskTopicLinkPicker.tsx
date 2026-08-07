import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Library,
  Minus,
  Search,
  Settings2,
  X,
} from 'lucide-react';
import styled from 'styled-components';
import { preview as t } from '../preview/adminPreviewTheme';
import type {
  CurriculumCatalog,
  CurriculumTopic,
  MaterialTopicProgress,
  SubjectTopicProgress,
  TaskTopicLink,
  TopicStatus,
} from '../types';
import { TOPIC_STATUS_LABEL } from '../types';

export function topicLinkKey(link: TaskTopicLink): string {
  return `${link.scope}:${link.topicId}`;
}

export function resolveTopicLinkLabel(
  catalog: CurriculumCatalog,
  link: TaskTopicLink,
): { parent: string; topic: string } | null {
  if (link.scope === 'subject') {
    for (const subject of catalog.subjects) {
      const topic = subject.topics.find((row) => row.id === link.topicId);
      if (topic) return { parent: subject.label, topic: topic.label };
    }
    return null;
  }
  for (const material of catalog.materials) {
    const topic = material.topics.find((row) => row.id === link.topicId);
    if (topic) {
      const subjectLabel =
        catalog.subjects.find((s) => s.id === material.subjectId)?.label ?? material.label;
      return { parent: `${subjectLabel} · ${material.label}`, topic: topic.label };
    }
  }
  return null;
}

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR');
}

const STATUS_ICON = {
  none: Minus,
  current: Settings2,
  completed_warn: AlertTriangle,
  completed_ok: Check,
} as const;

type SourceCard =
  | {
      key: string;
      scope: 'subject';
      id: string;
      title: string;
      subtitle?: string;
      topics: CurriculumTopic[];
    }
  | {
      key: string;
      scope: 'material';
      id: string;
      title: string;
      subtitle?: string;
      topics: CurriculumTopic[];
    };

type TaskTopicLinkPickerProps = {
  catalog: CurriculumCatalog;
  enrolledSubjectIds: string[];
  enrolledMaterialIds: string[];
  subjectProgress: SubjectTopicProgress[];
  materialProgress: MaterialTopicProgress[];
  initialLinks: TaskTopicLink[];
  onConfirm: (links: TaskTopicLink[]) => void;
  onClose: () => void;
};

function isLinkableStatus(status: TopicStatus): boolean {
  return status !== 'completed_ok';
}

export function TaskTopicLinkPicker({
  catalog,
  enrolledSubjectIds,
  enrolledMaterialIds,
  subjectProgress,
  materialProgress,
  initialLinks,
  onConfirm,
  onClose,
}: TaskTopicLinkPickerProps) {
  const [query, setQuery] = useState('');
  const [activeSourceKey, setActiveSourceKey] = useState<string | null>(null);

  const statusByTopic = useMemo(() => {
    const map = new Map<string, TopicStatus>();
    for (const row of subjectProgress) {
      map.set(`subject:${row.topicId}`, row.status);
    }
    for (const row of materialProgress) {
      map.set(`material:${row.topicId}`, row.status);
    }
    return map;
  }, [subjectProgress, materialProgress]);

  const topicStatus = (scope: 'subject' | 'material', topicId: string): TopicStatus =>
    statusByTopic.get(`${scope}:${topicId}`) ?? 'none';

  const sources = useMemo(() => {
    const cards: SourceCard[] = [];
    for (const subject of catalog.subjects) {
      if (!enrolledSubjectIds.includes(subject.id)) continue;
      cards.push({
        key: `subject:${subject.id}`,
        scope: 'subject',
        id: subject.id,
        title: subject.label,
        subtitle: `${subject.topics.length} konu`,
        topics: subject.topics,
      });
    }
    for (const material of catalog.materials) {
      if (!enrolledMaterialIds.includes(material.id)) continue;
      const subjectLabel =
        catalog.subjects.find((s) => s.id === material.subjectId)?.label ?? '';
      cards.push({
        key: `material:${material.id}`,
        scope: 'material',
        id: material.id,
        title: material.label,
        subtitle: subjectLabel
          ? `${subjectLabel} · ${material.topics.length} konu`
          : `${material.topics.length} konu`,
        topics: material.topics,
      });
    }
    return cards;
  }, [catalog, enrolledSubjectIds, enrolledMaterialIds]);

  const allLinkableTopics = useMemo(() => {
    const rows: Array<{ key: string; link: TaskTopicLink }> = [];
    for (const source of sources) {
      for (const topic of source.topics) {
        if (!isLinkableStatus(topicStatus(source.scope, topic.id))) continue;
        const link: TaskTopicLink = { scope: source.scope, topicId: topic.id };
        rows.push({ key: topicLinkKey(link), link });
      }
    }
    return rows;
  }, [sources, statusByTopic]);

  const [selected, setSelected] = useState<Set<string>>(() => {
    const next = new Set<string>();
    for (const link of initialLinks) {
      if (!isLinkableStatus(topicStatus(link.scope, link.topicId))) continue;
      next.add(topicLinkKey(link));
    }
    return next;
  });

  const activeSource = sources.find((card) => card.key === activeSourceKey) ?? null;

  const filteredSources = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return sources;
    return sources.filter((card) =>
      normalizeSearch(`${card.title} ${card.subtitle ?? ''}`).includes(q),
    );
  }, [sources, query]);

  const filteredTopics = useMemo(() => {
    if (!activeSource) return [];
    const q = normalizeSearch(query);
    if (!q) return activeSource.topics;
    return activeSource.topics.filter((topic) => normalizeSearch(topic.label).includes(q));
  }, [activeSource, query]);

  const subjectCards = filteredSources.filter((card) => card.scope === 'subject');
  const materialCards = filteredSources.filter((card) => card.scope === 'material');

  const selectedCountForSource = (source: SourceCard) =>
    source.topics.reduce((count, topic) => {
      const key = topicLinkKey({ scope: source.scope, topicId: topic.id });
      return selected.has(key) ? count + 1 : count;
    }, 0);

  const toggle = (link: TaskTopicLink) => {
    if (!isLinkableStatus(topicStatus(link.scope, link.topicId))) return;
    const key = topicLinkKey(link);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openSource = (key: string) => {
    setActiveSourceKey(key);
    setQuery('');
  };

  const backToSources = () => {
    setActiveSourceKey(null);
    setQuery('');
  };

  const handleConfirm = () => {
    const links = allLinkableTopics
      .filter((row) => selected.has(row.key))
      .map((row) => row.link);
    onConfirm(links);
  };

  return (
    <Overlay role="dialog" aria-modal="true" aria-label="Konu bağla" onClick={onClose}>
      <Modal onClick={(event) => event.stopPropagation()}>
        <Head>
          <div>
            <Title>Konu bağla</Title>
            <Sub>
              {activeSource
                ? `${activeSource.title} konularını seç. Tamamlanan konular bağlanamaz.`
                : 'Önce ders veya materyal seç, sonra konularını bağla.'}
            </Sub>
          </div>
          <CloseButton type="button" aria-label="Kapat" onClick={onClose}>
            <X size={18} />
          </CloseButton>
        </Head>

        {activeSource ? (
          <BackButton type="button" onClick={backToSources}>
            <ChevronLeft size={16} />
            Kaynaklara dön
          </BackButton>
        ) : null}

        <SearchWrap>
          <Search size={16} />
          <SearchInput
            autoFocus
            value={query}
            placeholder={activeSource ? 'Konu ara…' : 'Ders veya materyal ara…'}
            onChange={(event) => setQuery(event.target.value)}
          />
        </SearchWrap>

        <SelectedCount>
          {activeSource
            ? `${selectedCountForSource(activeSource)} bu kaynakta · toplam ${selected.size} seçili`
            : `${selected.size} konu seçili`}
        </SelectedCount>

        <List>
          {sources.length === 0 ? (
            <Empty>Önce bu öğrenciye ders veya materyal ata.</Empty>
          ) : activeSource ? (
            filteredTopics.length === 0 ? (
              <Empty>Sonuç yok.</Empty>
            ) : (
              <Group>
                {filteredTopics.map((topic) => {
                  const link: TaskTopicLink = {
                    scope: activeSource.scope,
                    topicId: topic.id,
                  };
                  const key = topicLinkKey(link);
                  const status = topicStatus(activeSource.scope, topic.id);
                  const completedOk = status === 'completed_ok';
                  const active = completedOk || selected.has(key);
                  const StatusIcon = STATUS_ICON[status];
                  return (
                    <TopicButton
                      key={key}
                      type="button"
                      $active={active}
                      $locked={completedOk}
                      disabled={completedOk}
                      title={
                        completedOk
                          ? 'Bu konu zaten tamamlandı'
                          : TOPIC_STATUS_LABEL[status]
                      }
                      onClick={() => toggle(link)}
                    >
                      <TopicName>{topic.label}</TopicName>
                      <TopicTrailing>
                        <StatusBadge $status={status} aria-hidden>
                          <StatusIcon size={13} strokeWidth={2.4} />
                        </StatusBadge>
                        <CheckSlot $active={active} $locked={completedOk}>
                          {active ? <Check size={14} strokeWidth={3} /> : null}
                        </CheckSlot>
                      </TopicTrailing>
                    </TopicButton>
                  );
                })}
              </Group>
            )
          ) : filteredSources.length === 0 ? (
            <Empty>Sonuç yok.</Empty>
          ) : (
            <>
              {subjectCards.length > 0 ? (
                <Group>
                  <GroupTitle>
                    <Library size={14} />
                    Dersler
                  </GroupTitle>
                  {subjectCards.map((card) => {
                    const count = selectedCountForSource(card);
                    return (
                      <SourceButton key={card.key} type="button" onClick={() => openSource(card.key)}>
                        <SourceCopy>
                          <TopicName>{card.title}</TopicName>
                          <TopicParent>
                            {card.subtitle}
                            {count > 0 ? ` · ${count} seçili` : ''}
                          </TopicParent>
                        </SourceCopy>
                        <ChevronRight size={16} />
                      </SourceButton>
                    );
                  })}
                </Group>
              ) : null}
              {materialCards.length > 0 ? (
                <Group>
                  <GroupTitle>
                    <BookOpen size={14} />
                    Materyaller
                  </GroupTitle>
                  {materialCards.map((card) => {
                    const count = selectedCountForSource(card);
                    return (
                      <SourceButton key={card.key} type="button" onClick={() => openSource(card.key)}>
                        <SourceCopy>
                          <TopicName>{card.title}</TopicName>
                          <TopicParent>
                            {card.subtitle}
                            {count > 0 ? ` · ${count} seçili` : ''}
                          </TopicParent>
                        </SourceCopy>
                        <ChevronRight size={16} />
                      </SourceButton>
                    );
                  })}
                </Group>
              ) : null}
            </>
          )}
        </List>

        <Footer>
          <GhostButton type="button" onClick={onClose}>
            İptal
          </GhostButton>
          <PrimaryButton type="button" onClick={handleConfirm}>
            Kaydet ({selected.size})
          </PrimaryButton>
        </Footer>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(2, 8, 23, 0.72);
  backdrop-filter: blur(6px);
`;

const Modal = styled.div`
  width: min(560px, 100%);
  max-height: min(78vh, 720px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.borderStrong};
  background: ${t.panel};
`;

const Head = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const Title = styled.div`
  font-size: 1.05rem;
  font-weight: 800;
  color: ${t.text};
`;

const Sub = styled.div`
  margin-top: 4px;
  font-size: 0.8rem;
  color: ${t.muted};
  line-height: 1.35;
`;

const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid ${t.border};
  background: transparent;
  color: ${t.muted};
  cursor: pointer;

  &:hover {
    color: ${t.text};
    border-color: ${t.borderStrong};
  }
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  border: 0;
  background: transparent;
  color: ${t.muted};
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: ${t.text};
  }
`;

const SearchWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.muted};
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: ${t.text};
  font: inherit;
  font-size: 0.9rem;
  outline: none;

  &::placeholder {
    color: ${t.mutedSoft};
  }
`;

const SelectedCount = styled.div`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${t.muted};
`;

const List = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-right: 2px;
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const GroupTitle = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 800;
  color: #a5b4fc;
  letter-spacing: 0.02em;
`;

const SourceButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.border};
  background: rgba(15, 23, 42, 0.45);
  color: ${t.muted};
  font: inherit;
  cursor: pointer;

  &:hover {
    border-color: rgba(96, 165, 250, 0.45);
    color: ${t.text};
  }
`;

const SourceCopy = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TopicButton = styled.button<{ $active: boolean; $locked?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: ${t.radiusMd};
  border: 1px solid
    ${({ $active, $locked }) =>
      $locked
        ? 'rgba(52, 211, 153, 0.45)'
        : $active
          ? 'rgba(96, 165, 250, 0.55)'
          : t.border};
  background: ${({ $active, $locked }) =>
    $locked
      ? 'rgba(52, 211, 153, 0.12)'
      : $active
        ? 'rgba(59, 130, 246, 0.16)'
        : 'rgba(15, 23, 42, 0.45)'};
  color: inherit;
  font: inherit;
  cursor: ${({ $locked }) => ($locked ? 'default' : 'pointer')};
  opacity: ${({ $locked }) => ($locked ? 0.92 : 1)};

  &:hover:not(:disabled) {
    border-color: rgba(96, 165, 250, 0.45);
  }

  &:disabled {
    cursor: default;
  }
`;

const TopicName = styled.div`
  font-size: 0.9rem;
  font-weight: 800;
  color: ${t.text};
  overflow-wrap: anywhere;
`;

const TopicParent = styled.div`
  font-size: 0.76rem;
  color: ${t.muted};
  overflow-wrap: anywhere;
`;

const TopicTrailing = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const StatusBadge = styled.span<{ $status: TopicStatus }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid
    ${({ $status }) => {
      if ($status === 'none') return 'rgba(226, 232, 240, 0.35)';
      if ($status === 'current') return 'rgba(96, 165, 250, 0.55)';
      if ($status === 'completed_warn') return 'rgba(251, 191, 36, 0.55)';
      return 'rgba(52, 211, 153, 0.55)';
    }};
  background: ${({ $status }) => {
    if ($status === 'none') return 'rgba(226, 232, 240, 0.14)';
    if ($status === 'current') return 'rgba(96, 165, 250, 0.2)';
    if ($status === 'completed_warn') return 'rgba(251, 191, 36, 0.18)';
    return 'rgba(52, 211, 153, 0.18)';
  }};
  color: ${({ $status }) => {
    if ($status === 'none') return 'rgba(226, 232, 240, 0.88)';
    if ($status === 'current') return '#93C5FD';
    if ($status === 'completed_warn') return '#FBBF24';
    return '#34D399';
  }};
`;

const CheckSlot = styled.span<{ $active: boolean; $locked?: boolean }>`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 7px;
  border: 1px solid
    ${({ $active, $locked }) =>
      $locked
        ? 'rgba(52, 211, 153, 0.7)'
        : $active
          ? 'rgba(96, 165, 250, 0.7)'
          : t.borderStrong};
  background: ${({ $active, $locked }) =>
    $locked
      ? 'rgba(52, 211, 153, 0.28)'
      : $active
        ? 'rgba(59, 130, 246, 0.28)'
        : 'rgba(15, 23, 42, 0.5)'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${t.text};
`;

const Empty = styled.p`
  margin: 0;
  padding: 24px 12px;
  text-align: center;
  color: ${t.muted};
  font-size: 0.88rem;
  border: 1px dashed ${t.border};
  border-radius: ${t.radiusMd};
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const GhostButton = styled.button`
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid ${t.border};
  background: transparent;
  color: ${t.muted};
  font: inherit;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    color: ${t.text};
    border-color: ${t.borderStrong};
  }
`;

const PrimaryButton = styled.button`
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.5);
  background: rgba(59, 130, 246, 0.22);
  color: rgba(219, 234, 254, 0.98);
  font: inherit;
  font-size: 0.84rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: rgba(59, 130, 246, 0.3);
  }
`;
