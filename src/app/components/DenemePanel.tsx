import { useMemo, useState } from 'react';
import { CalendarDays, Clock3, Plus } from 'lucide-react';
import styled from 'styled-components';
import {
  computeDenemeNet,
  DENEME_TYPES,
  emptyScoresForType,
  formatDenemeNet,
  getDenemeType,
  isDenemeTypeId,
  leafEmptyCount,
  validateDenemeScores,
  type DenemeLeafDef,
  type DenemeTypeId,
} from '../data/denemeTypes';
import { preview as t } from '../preview/adminPreviewTheme';
import type { DenemeEntry, DenemeEntryInput, DenemeLeafScore } from '../types';
import { toDateKey } from '../utils/dates';
import {
  AccentButton,
  ContentSub,
  ContentTitle,
  EmptyState,
  ErrorText,
  GhostButton,
} from '../preview/AdminPreviewUi';

type DenemePanelProps = {
  entries: DenemeEntry[];
  onCreate: (input: DenemeEntryInput) => Promise<void>;
  onUpdate: (id: string, input: DenemeEntryInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

type FormState = {
  denemeDate: string;
  name: string;
  duration: string;
  typeId: DenemeTypeId;
  scores: DenemeLeafScore[];
  topics: string[];
  topicDraft: string;
};

function formatDenemeDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(y, m - 1, d));
}

function sortDenemesNewestFirst(entries: DenemeEntry[]): DenemeEntry[] {
  return [...entries].sort((a, b) => {
    if (a.denemeDate !== b.denemeDate) return a.denemeDate < b.denemeDate ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

function toFormState(entry?: DenemeEntry | null): FormState {
  if (entry && isDenemeTypeId(entry.typeId)) {
    const def = getDenemeType(entry.typeId)!;
    const scores = def.leaves.map((leaf) => {
      const existing = entry.scores.find((s) => s.leafId === leaf.id);
      return {
        leafId: leaf.id,
        correct: existing?.correct ?? 0,
        wrong: existing?.wrong ?? 0,
      };
    });
    return {
      denemeDate: entry.denemeDate,
      name: entry.name,
      duration: entry.duration,
      typeId: entry.typeId,
      scores,
      topics: [...entry.topics],
      topicDraft: '',
    };
  }
  return {
    denemeDate: toDateKey(new Date()),
    name: '',
    duration: '',
    typeId: 'sayilar',
    scores: emptyScoresForType('sayilar'),
    topics: [],
    topicDraft: '',
  };
}

function topicPreviewList(topics: string[], max = 3): string[] {
  return topics.slice(0, max);
}

function groupLeaves(leaves: DenemeLeafDef[]): {
  title: string;
  showTitle: boolean;
  leaves: DenemeLeafDef[];
}[] {
  const hasGroups = leaves.some((leaf) => Boolean(leaf.group));
  if (!hasGroups) {
    return [{ title: 'Skorlar', showTitle: false, leaves }];
  }

  const groups: { title: string; showTitle: boolean; leaves: DenemeLeafDef[] }[] = [];
  for (const leaf of leaves) {
    const title = leaf.group ?? 'Diğer';
    const last = groups[groups.length - 1];
    if (last && last.title === title) {
      last.leaves.push(leaf);
    } else {
      groups.push({ title, showTitle: true, leaves: [leaf] });
    }
  }
  return groups;
}

const TYT_GENEL_SUMMARY_ORDER = [
  'TYT Türkçe',
  'TYT Matematik',
  'TYT Sosyal',
  'TYT Fen',
] as const;

const TYT_GENEL_BREAKDOWN_ORDER = ['TYT Matematik', 'TYT Sosyal', 'TYT Fen'] as const;

const TYT_GENEL_SHORT_LABEL: Record<string, string> = {
  'TYT Türkçe': 'Türkçe',
  'TYT Matematik': 'Matematik',
  'TYT Sosyal': 'Sosyal',
  'TYT Fen': 'Fen',
};

function orderGroupsByTitles(
  groups: ReturnType<typeof groupLeaves>,
  titles: readonly string[],
): ReturnType<typeof groupLeaves> {
  const byTitle = new Map(groups.map((group) => [group.title, group]));
  return titles
    .map((title) => byTitle.get(title))
    .filter((group): group is NonNullable<typeof group> => Boolean(group));
}

function aggregateGroupScores(
  group: ReturnType<typeof groupLeaves>[number],
  scores: DenemeLeafScore[],
) {
  let correct = 0;
  let wrong = 0;
  let empty = 0;
  let net = 0;
  for (const leaf of group.leaves) {
    const score = scores.find((s) => s.leafId === leaf.id);
    const c = score?.correct ?? 0;
    const w = score?.wrong ?? 0;
    const e = leafEmptyCount(leaf.questionCount, c, w);
    correct += c;
    wrong += w;
    empty += e;
    net += c - w / 4;
  }
  return { correct, wrong, empty, net };
}

function LeafScoreCard({
  leaf,
  correct,
  wrong,
  empty,
}: {
  leaf: DenemeLeafDef;
  correct: number;
  wrong: number;
  empty: number;
}) {
  return (
    <LeafCard>
      <LeafCardName>{leaf.label}</LeafCardName>
      <MiniScoreRow>
        <MiniScore $tone="correct">{correct}</MiniScore>
        <MiniScore $tone="wrong">{wrong}</MiniScore>
        <MiniScore $tone="empty">{empty}</MiniScore>
      </MiniScoreRow>
      <MiniScoreLegend>
        <span>D</span>
        <span>Y</span>
        <span>B</span>
      </MiniScoreLegend>
    </LeafCard>
  );
}

export function DenemePanel({ entries, onCreate, onUpdate, onDelete }: DenemePanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => toFormState());
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  /** Empty set = show all types. */
  const [activeTypeFilters, setActiveTypeFilters] = useState<Set<DenemeTypeId>>(() => new Set());

  const typeDef = useMemo(() => getDenemeType(form.typeId), [form.typeId]);
  const liveNet = useMemo(
    () => formatDenemeNet(computeDenemeNet(form.typeId, form.scores)),
    [form.typeId, form.scores],
  );

  const sortedEntries = useMemo(() => sortDenemesNewestFirst(entries), [entries]);

  const filteredEntries = useMemo(() => {
    if (activeTypeFilters.size === 0) return sortedEntries;
    return sortedEntries.filter(
      (entry) => isDenemeTypeId(entry.typeId) && activeTypeFilters.has(entry.typeId),
    );
  }, [sortedEntries, activeTypeFilters]);

  const toggleTypeFilter = (typeId: DenemeTypeId) => {
    setActiveTypeFilters((current) => {
      const next = new Set(current);
      if (next.has(typeId)) next.delete(typeId);
      else next.add(typeId);
      return next;
    });
  };

  const openCreate = () => {
    setMode('create');
    setEditingId(null);
    setExpandedId(null);
    setForm(toFormState());
    setFormError('');
  };

  const openEdit = (entry: DenemeEntry) => {
    setMode('edit');
    setEditingId(entry.id);
    setExpandedId(entry.id);
    setForm(toFormState(entry));
    setFormError('');
  };

  const cancelForm = () => {
    setMode('list');
    setEditingId(null);
    setFormError('');
  };

  const setTypeId = (typeId: DenemeTypeId) => {
    setForm((prev) => ({
      ...prev,
      typeId,
      scores: emptyScoresForType(typeId),
    }));
  };

  const setScore = (leafId: string, field: 'correct' | 'wrong', raw: string) => {
    const parsed = raw === '' ? 0 : Number(raw);
    const value = Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
    setForm((prev) => {
      const def = getDenemeType(prev.typeId);
      const leaf = def?.leaves.find((l) => l.id === leafId);
      const max = leaf?.questionCount ?? 0;
      const scores = prev.scores.map((s) => {
        if (s.leafId !== leafId) return s;
        const next = { ...s, [field]: value };
        if (next.correct + next.wrong > max) {
          if (field === 'correct') next.wrong = Math.max(0, max - next.correct);
          else next.correct = Math.max(0, max - next.wrong);
        }
        return next;
      });
      return { ...prev, scores };
    });
  };

  const addTopic = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setForm((prev) => ({
      ...prev,
      topics: [...prev.topics, trimmed],
      topicDraft: '',
    }));
  };

  const removeTopic = (index: number) => {
    setForm((prev) => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    const name = form.name.trim();
    if (!name) {
      setFormError('Deneme adı gerekli.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.denemeDate)) {
      setFormError('Geçerli bir tarih seç.');
      return;
    }
    const scoreError = validateDenemeScores(form.typeId, form.scores);
    if (scoreError) {
      setFormError(scoreError);
      return;
    }

    const input: DenemeEntryInput = {
      denemeDate: form.denemeDate,
      name,
      duration: form.duration.trim(),
      typeId: form.typeId,
      scores: form.scores,
      topics: form.topics,
    };

    setIsSaving(true);
    setFormError('');
    try {
      if (mode === 'edit' && editingId) {
        await onUpdate(editingId, input);
      } else {
        await onCreate(input);
      }
      setMode('list');
      setEditingId(null);
    } catch {
      setFormError('Kayıt başarısız. Tekrar dene.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu denemeyi silmek istediğine emin misin?')) return;
    setIsSaving(true);
    try {
      await onDelete(id);
      if (editingId === id) cancelForm();
      if (expandedId === id) setExpandedId(null);
    } catch {
      setFormError('Silme başarısız.');
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === 'create' || mode === 'edit') {
    return (
      <Stack>
        <HeaderRow>
          <div>
            <ContentTitle>{mode === 'edit' ? 'Deneme düzenle' : 'Yeni deneme'}</ContentTitle>
            <ContentSub style={{ marginTop: 4 }}>
              {mode === 'edit' ? 'Kaydı güncelle' : 'Yeni kayıt ekle'}
            </ContentSub>
          </div>
          <GhostButton type="button" onClick={cancelForm} disabled={isSaving}>
            Vazgeç
          </GhostButton>
        </HeaderRow>

        <FieldLabel>
          Tarih
          <FieldInput
            type="date"
            value={form.denemeDate}
            onChange={(e) => setForm((p) => ({ ...p, denemeDate: e.target.value }))}
          />
        </FieldLabel>

        <FieldLabel>
          Ad
          <FieldInput
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Örn. TYT Fen #3"
          />
        </FieldLabel>

        <FieldLabel>
          Süre
          <FieldInput
            value={form.duration}
            onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
            placeholder="Örn. 45 dk"
          />
        </FieldLabel>

        <FieldLabel>
          Tür
          <FieldSelect
            value={form.typeId}
            onChange={(e) => setTypeId(e.target.value as DenemeTypeId)}
          >
            {DENEME_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </FieldSelect>
        </FieldLabel>

        <ScoreBlock>
          <ScoreHead>
            <span>Skorlar</span>
            <NetBadge>Net {liveNet}</NetBadge>
          </ScoreHead>
          {typeDef ? (
            <LeafList>
              {typeDef.leaves.map((leaf, index) => {
                const prevGroup = index > 0 ? typeDef.leaves[index - 1]?.group : undefined;
                const showGroup = leaf.group && leaf.group !== prevGroup;
                const score = form.scores.find((s) => s.leafId === leaf.id) ?? {
                  leafId: leaf.id,
                  correct: 0,
                  wrong: 0,
                };
                const empty = leafEmptyCount(leaf.questionCount, score.correct, score.wrong);
                return (
                  <div key={`${leaf.group ?? ''}-${leaf.id}`}>
                    {showGroup ? <GroupLabel>{leaf.group}</GroupLabel> : null}
                    <LeafRow>
                      <LeafMeta>
                        <strong>{leaf.label}</strong>
                        <span>
                          {leaf.questionCount} soru · boş {empty}
                        </span>
                      </LeafMeta>
                      <ScoreInputs>
                        <MiniField>
                          D
                          <MiniInput
                            type="number"
                            min={0}
                            max={leaf.questionCount}
                            value={score.correct}
                            onChange={(e) => setScore(leaf.id, 'correct', e.target.value)}
                          />
                        </MiniField>
                        <MiniField>
                          Y
                          <MiniInput
                            type="number"
                            min={0}
                            max={leaf.questionCount}
                            value={score.wrong}
                            onChange={(e) => setScore(leaf.id, 'wrong', e.target.value)}
                          />
                        </MiniField>
                      </ScoreInputs>
                    </LeafRow>
                  </div>
                );
              })}
            </LeafList>
          ) : null}
        </ScoreBlock>

        <TopicBlock>
          <ContentSub>Yanlış / boş konular</ContentSub>
          {typeDef && typeDef.topicPresets.length > 0 ? (
            <PresetWrap>
              {typeDef.topicPresets.map((preset) => (
                <PresetChip key={preset} type="button" onClick={() => addTopic(preset)}>
                  + {preset}
                </PresetChip>
              ))}
            </PresetWrap>
          ) : (
            <ContentSub style={{ marginTop: 4 }}>Bu tür için şimdilik serbest metin.</ContentSub>
          )}
          <TopicAddRow>
            <FieldInput
              value={form.topicDraft}
              onChange={(e) => setForm((p) => ({ ...p, topicDraft: e.target.value }))}
              placeholder="Konu ekle"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTopic(form.topicDraft);
                }
              }}
            />
            <GhostButton type="button" onClick={() => addTopic(form.topicDraft)}>
              Ekle
            </GhostButton>
          </TopicAddRow>
          {form.topics.length > 0 ? (
            <TopicList>
              {form.topics.map((topic, index) => (
                <TopicChip key={`${topic}-${index}`}>
                  {topic}
                  <TopicRemove type="button" onClick={() => removeTopic(index)} aria-label="Kaldır">
                    ×
                  </TopicRemove>
                </TopicChip>
              ))}
            </TopicList>
          ) : null}
        </TopicBlock>

        {formError ? <ErrorText>{formError}</ErrorText> : null}

        <AccentButton type="button" onClick={() => void handleSubmit()} disabled={isSaving}>
          {isSaving ? 'Kaydediliyor…' : 'Kaydet'}
        </AccentButton>
      </Stack>
    );
  }

  return (
    <Stack>
      <ListHeaderRow>
        <FilterRow>
          {DENEME_TYPES.map((type) => {
            const active = activeTypeFilters.has(type.id);
            return (
              <FilterPill
                key={type.id}
                type="button"
                $active={active}
                onClick={() => toggleTypeFilter(type.id)}
              >
                {type.label}
              </FilterPill>
            );
          })}
          {activeTypeFilters.size > 0 ? (
            <ClearFilters type="button" onClick={() => setActiveTypeFilters(new Set())}>
              Tümü
            </ClearFilters>
          ) : null}
        </FilterRow>
        <AddIconButton type="button" onClick={openCreate} aria-label="Deneme ekle" title="Deneme ekle">
          <Plus size={20} strokeWidth={2.5} />
        </AddIconButton>
      </ListHeaderRow>

      {filteredEntries.length === 0 ? (
        <EmptyState>
          {entries.length === 0 ? 'Henüz deneme yok.' : 'Seçili filtrelere uygun deneme yok.'}
        </EmptyState>
      ) : (
        <CardList>
          {filteredEntries.map((entry) => {
            const def = getDenemeType(entry.typeId);
            const net = formatDenemeNet(computeDenemeNet(entry.typeId, entry.scores));
            const open = expandedId === entry.id;
            const durationLabel = entry.duration.trim() || '—';
            return (
              <Card key={entry.id}>
                <CardMain type="button" onClick={() => setExpandedId(open ? null : entry.id)}>
                  <CardLeft>
                    <CardName>{entry.name}</CardName>
                    <TopicPreviewRow>
                      {entry.topics.length > 0
                        ? topicPreviewList(entry.topics).map((topic, i) => (
                            <WrongTopicPill key={`${entry.id}-preview-${i}`}>
                              ❌ {topic}
                            </WrongTopicPill>
                          ))
                        : null}
                    </TopicPreviewRow>
                    <CardTopMeta>
                      <CardDateRow>
                        <CalendarDays size={15} strokeWidth={2.25} aria-hidden />
                        <span>{formatDenemeDate(entry.denemeDate)}</span>
                      </CardDateRow>
                    </CardTopMeta>
                  </CardLeft>

                  <CardRight>
                    <NetBox>
                      <NetValue>{net}</NetValue>
                      <NetLabel>Net</NetLabel>
                    </NetBox>
                    <DurationRow>
                      <Clock3 size={14} strokeWidth={2.4} aria-hidden />
                      <span>{durationLabel}</span>
                    </DurationRow>
                  </CardRight>
                </CardMain>

                {open ? (
                  <CardDetail>
                    {def ? (
                      <DetailScores>
                        <DetailTypeLabel>{def.label}</DetailTypeLabel>
                        {def.leaves.length === 1 ? (
                          (() => {
                            const leaf = def.leaves[0];
                            const score = entry.scores.find((s) => s.leafId === leaf.id);
                            const correct = score?.correct ?? 0;
                            const wrong = score?.wrong ?? 0;
                            const empty = leafEmptyCount(leaf.questionCount, correct, wrong);
                            return (
                              <BigScoreRow>
                                <BigScoreBox $tone="correct">
                                  <BigScoreValue>{correct}</BigScoreValue>
                                  <BigScoreLabel>Doğru</BigScoreLabel>
                                </BigScoreBox>
                                <BigScoreBox $tone="wrong">
                                  <BigScoreValue>{wrong}</BigScoreValue>
                                  <BigScoreLabel>Yanlış</BigScoreLabel>
                                </BigScoreBox>
                                <BigScoreBox $tone="empty">
                                  <BigScoreValue>{empty}</BigScoreValue>
                                  <BigScoreLabel>Boş</BigScoreLabel>
                                </BigScoreBox>
                              </BigScoreRow>
                            );
                          })()
                        ) : def.id === 'tyt_genel' ? (
                          (() => {
                            const groups = groupLeaves(def.leaves);
                            const summaryGroups = orderGroupsByTitles(
                              groups,
                              TYT_GENEL_SUMMARY_ORDER,
                            );
                            const breakdownGroups = orderGroupsByTitles(
                              groups,
                              TYT_GENEL_BREAKDOWN_ORDER,
                            );
                            return (
                              <GenelDetailStack>
                                <GenelEqualRow $cols={4}>
                                  {summaryGroups.map((group) => {
                                    const agg = aggregateGroupScores(group, entry.scores);
                                    return (
                                      <GenelSummaryCard key={`summary-${group.title}`}>
                                        <GenelCardTitle>
                                          {TYT_GENEL_SHORT_LABEL[group.title] ?? group.title}
                                        </GenelCardTitle>
                                        <GenelSummaryNet>
                                          {formatDenemeNet(agg.net)}
                                        </GenelSummaryNet>
                                        <MiniScoreRow>
                                          <MiniScore $tone="correct">{agg.correct}</MiniScore>
                                          <MiniScore $tone="wrong">{agg.wrong}</MiniScore>
                                          <MiniScore $tone="empty">{agg.empty}</MiniScore>
                                        </MiniScoreRow>
                                        <MiniScoreLegend>
                                          <span>D</span>
                                          <span>Y</span>
                                          <span>B</span>
                                        </MiniScoreLegend>
                                      </GenelSummaryCard>
                                    );
                                  })}
                                </GenelEqualRow>

                                <GenelEqualRow $cols={3}>
                                  {breakdownGroups.map((group) => (
                                    <GenelBreakdownCard key={`break-${group.title}`}>
                                      <GenelCardTitle>
                                        {TYT_GENEL_SHORT_LABEL[group.title] ?? group.title}
                                      </GenelCardTitle>
                                      <GenelLeafRows>
                                        {group.leaves.map((leaf) => {
                                          const score = entry.scores.find(
                                            (s) => s.leafId === leaf.id,
                                          );
                                          const correct = score?.correct ?? 0;
                                          const wrong = score?.wrong ?? 0;
                                          const empty = leafEmptyCount(
                                            leaf.questionCount,
                                            correct,
                                            wrong,
                                          );
                                          return (
                                            <GenelLeafRow key={`${group.title}-${leaf.id}`}>
                                              <GenelLeafName>{leaf.label}</GenelLeafName>
                                              <MiniScoreRow>
                                                <MiniScore $tone="correct">{correct}</MiniScore>
                                                <MiniScore $tone="wrong">{wrong}</MiniScore>
                                                <MiniScore $tone="empty">{empty}</MiniScore>
                                              </MiniScoreRow>
                                            </GenelLeafRow>
                                          );
                                        })}
                                      </GenelLeafRows>
                                    </GenelBreakdownCard>
                                  ))}
                                </GenelEqualRow>
                              </GenelDetailStack>
                            );
                          })()
                        ) : (
                          <BranchStack>
                            {groupLeaves(def.leaves).map((group) => (
                              <BranchSection key={group.title}>
                                {group.showTitle ? (
                                  <BranchTitle>{group.title}</BranchTitle>
                                ) : null}
                                <LeafGrid $compact={def.leaves.length > 4}>
                                  {group.leaves.map((leaf) => {
                                    const score = entry.scores.find((s) => s.leafId === leaf.id);
                                    const correct = score?.correct ?? 0;
                                    const wrong = score?.wrong ?? 0;
                                    const empty = leafEmptyCount(
                                      leaf.questionCount,
                                      correct,
                                      wrong,
                                    );
                                    return (
                                      <LeafScoreCard
                                        key={`${group.title}-${leaf.id}`}
                                        leaf={leaf}
                                        correct={correct}
                                        wrong={wrong}
                                        empty={empty}
                                      />
                                    );
                                  })}
                                </LeafGrid>
                              </BranchSection>
                            ))}
                          </BranchStack>
                        )}
                      </DetailScores>
                    ) : null}
                    {entry.topics.length > 0 ? (
                      <DetailTopics>
                        {entry.topics.map((topic, i) => (
                          <TopicChip key={`${entry.id}-t-${i}`}>❌ {topic}</TopicChip>
                        ))}
                      </DetailTopics>
                    ) : null}
                    <DetailActions>
                      <GhostButton type="button" onClick={() => openEdit(entry)} disabled={isSaving}>
                        Düzenle
                      </GhostButton>
                      <DangerButton
                        type="button"
                        onClick={() => void handleDelete(entry.id)}
                        disabled={isSaving}
                      >
                        Sil
                      </DangerButton>
                    </DetailActions>
                  </CardDetail>
                ) : null}
              </Card>
            );
          })}
        </CardList>
      )}
    </Stack>
  );
}

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  overflow-x: clip;
  overflow-y: auto;
  padding-right: 2px;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const ListHeaderRow = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 4px;
  background: ${t.panel};

  @media (max-width: 560px) {
    align-items: flex-start;
    gap: 8px;
  }
`;

const AddIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 12px;
  border: 1px solid ${t.accentBorder};
  background: ${t.accentSoft};
  color: ${t.text};
  cursor: pointer;

  &:hover {
    background: rgba(199, 44, 121, 0.28);
  }
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
`;

const FilterPill = styled.button<{ $active: boolean }>`
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid ${(p) => (p.$active ? t.accentBorder : t.border)};
  background: ${(p) => (p.$active ? t.accentSoft : t.panel2)};
  color: ${(p) => (p.$active ? t.text : t.muted)};

  &:hover {
    color: ${t.text};
    border-color: ${t.borderStrong};
  }
`;

const ClearFilters = styled.button`
  border: 0;
  background: transparent;
  color: ${t.muted};
  font-size: 0.78rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  padding: 7px 4px;

  &:hover {
    color: ${t.text};
  }
`;

const FieldLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${t.muted};
`;

const fieldStyles = `
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font-size: 0.92rem;
  font-family: inherit;
  outline: none;
  color-scheme: dark;

  &:focus {
    border-color: rgba(96, 165, 250, 0.55);
  }

  &::placeholder {
    color: ${t.mutedSoft};
  }
`;

const FieldInput = styled.input`
  ${fieldStyles}
`;

const FieldSelect = styled.select`
  ${fieldStyles}
`;

const ScoreBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.border};
  background: rgba(15, 23, 42, 0.55);
`;

const ScoreHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${t.text};
`;

const NetBadge = styled.span`
  font-size: 0.8rem;
  font-weight: 800;
  color: ${t.success};
  background: ${t.successSoft};
  border-radius: 999px;
  padding: 4px 10px;
`;

const LeafList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const GroupLabel = styled.div`
  margin-top: 6px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${t.accent};
`;

const LeafRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
`;

const LeafMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  strong {
    color: ${t.text};
    font-size: 0.9rem;
  }

  span {
    color: ${t.muted};
    font-size: 0.75rem;
  }
`;

const ScoreInputs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
`;

const MiniField = styled.label`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${t.muted};
  min-width: 0;
`;

const MiniInput = styled.input`
  width: 56px;
  max-width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font-family: inherit;
  font-size: 0.9rem;
`;

const TopicBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PresetWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 120px;
  overflow: auto;
`;

const PresetChip = styled.button`
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.muted};
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 0.75rem;
  font-family: inherit;
  cursor: pointer;

  &:hover {
    color: ${t.text};
    border-color: ${t.borderStrong};
  }
`;

const TopicAddRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
`;

const TopicList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TopicChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  background: ${t.accentSoft};
  border: 1px solid ${t.accentBorder};
  color: ${t.text};
  font-size: 0.78rem;
  font-weight: 650;
`;

const TopicRemove = styled.button`
  border: 0;
  background: transparent;
  color: ${t.muted};
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
`;

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Card = styled.div`
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.border};
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.88));
  overflow: hidden;
`;

const CardMain = styled.button`
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  color: inherit;
  padding: 16px 18px;
  min-height: 124px;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 16px;

  &:hover {
    background: rgba(148, 163, 184, 0.06);
  }

  @media (max-width: 560px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 14px;
    min-height: 0;
  }
`;

const CardLeft = styled.div`
  display: grid;
  grid-template-rows: auto auto 1fr;
  align-items: start;
  gap: 8px;
  min-width: 0;
  flex: 1;
  min-height: 100%;
`;

const CardName = styled.div`
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.15;
  color: ${t.text};
  word-break: break-word;

  @media (max-width: 560px) {
    font-size: 1.2rem;
  }
`;

const CardTopMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: flex-start;
  align-self: end;
  gap: 8px;
`;

const TopicPreviewRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 6px;
  min-height: 1.6rem;
`;

const CardDateRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #93c5fd;
  font-size: 0.95rem;
  font-weight: 700;

  svg {
    flex-shrink: 0;
    color: #60a5fa;
  }
`;

const WrongTopicPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fecaca;
  background: rgba(248, 113, 113, 0.16);
  border: 1px solid rgba(248, 113, 113, 0.4);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
  width: 108px;

  @media (max-width: 560px) {
    flex-direction: row;
    width: 100%;
  }
`;

const NetBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 78px;
  aspect-ratio: 1 / 0.92;
  padding: 10px 8px;
  border-radius: 14px;
  background: rgba(52, 211, 153, 0.14);
  border: 1px solid rgba(52, 211, 153, 0.4);

  @media (max-width: 560px) {
    flex: 1;
    aspect-ratio: auto;
    min-height: 64px;
  }
`;

const NetValue = styled.div`
  font-size: 1.7rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.03em;
  color: ${t.success};
`;

const NetLabel = styled.div`
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(52, 211, 153, 0.85);
`;

const DurationRow = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 8px;
  border-radius: 10px;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.35);
  color: ${t.warn};
  font-size: 0.88rem;
  font-weight: 800;
  white-space: nowrap;

  svg {
    flex-shrink: 0;
  }

  @media (max-width: 560px) {
    flex: 1;
  }
`;

const CardDetail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 14px 14px;
  border-top: 1px solid ${t.border};
  padding-top: 12px;
`;

const DetailScores = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DetailTypeLabel = styled.div`
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${t.muted};
`;

const BigScoreRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
`;

const BigScoreBox = styled.div<{ $tone: 'correct' | 'wrong' | 'empty' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 72px;
  padding: 10px 8px;
  border-radius: 14px;
  background: ${(p) =>
    p.$tone === 'correct'
      ? 'rgba(52, 211, 153, 0.16)'
      : p.$tone === 'wrong'
        ? 'rgba(248, 113, 113, 0.16)'
        : 'rgba(148, 163, 184, 0.14)'};
  border: 1px solid
    ${(p) =>
      p.$tone === 'correct'
        ? 'rgba(52, 211, 153, 0.4)'
        : p.$tone === 'wrong'
          ? 'rgba(248, 113, 113, 0.4)'
          : 'rgba(148, 163, 184, 0.35)'};
  color: ${(p) =>
    p.$tone === 'correct' ? t.success : p.$tone === 'wrong' ? t.danger : t.muted};
`;

const BigScoreValue = styled.div`
  font-size: 1.7rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.03em;
`;

const BigScoreLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0.9;
`;

const BranchStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const GenelDetailStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const GenelEqualRow = styled.div<{ $cols: number }>`
  display: grid;
  grid-template-columns: repeat(${(p) => p.$cols}, minmax(0, 1fr));
  gap: 8px;
  align-items: stretch;

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const GenelSummaryCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid ${t.border};
  min-width: 0;
`;

const GenelBreakdownCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 8px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid ${t.border};
  min-width: 0;
  min-height: 180px;
`;

const GenelCardTitle = styled.div`
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #a5b4fc;
  text-align: center;
`;

const GenelSummaryNet = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 42px;
  font-size: 1.45rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
  color: ${t.success};
`;

const GenelLeafRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
`;

const GenelLeafRow = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  flex: 1;
  min-height: 0;
  padding: 6px 8px;
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.75);
  border: 1px solid ${t.border};
`;

const GenelLeafName = styled.div`
  font-size: 0.72rem;
  font-weight: 800;
  color: ${t.text};
  line-height: 1.2;
`;

const BranchSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid ${t.border};
  min-width: 0;
`;

const BranchTitle = styled.div`
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #a5b4fc;
  padding: 0 2px 2px;
`;

const LeafGrid = styled.div<{ $compact?: boolean }>`
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(min(100%, ${(p) => (p.$compact ? '84px' : '110px')}), 1fr)
  );
  gap: ${(p) => (p.$compact ? '6px' : '8px')};
  min-width: 0;
  width: 100%;
`;

const LeafCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px;
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.75);
  border: 1px solid ${t.border};
`;

const LeafCardName = styled.div`
  font-size: 0.72rem;
  font-weight: 800;
  color: ${t.text};
  line-height: 1.2;
  min-height: 1.7em;
`;

const MiniScoreRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
`;

const MiniScore = styled.div<{ $tone: 'correct' | 'wrong' | 'empty' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  border-radius: 7px;
  font-size: 0.88rem;
  font-weight: 900;
  background: ${(p) =>
    p.$tone === 'correct'
      ? 'rgba(52, 211, 153, 0.18)'
      : p.$tone === 'wrong'
        ? 'rgba(248, 113, 113, 0.18)'
        : 'rgba(148, 163, 184, 0.16)'};
  color: ${(p) =>
    p.$tone === 'correct' ? t.success : p.$tone === 'wrong' ? t.danger : t.muted};
`;

const MiniScoreLegend = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-align: center;
  color: ${t.mutedSoft};
`;

const DetailTopics = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const DetailActions = styled.div`
  display: flex;
  gap: 8px;
`;

const DangerButton = styled(GhostButton)`
  color: ${t.danger};
  border-color: rgba(248, 113, 113, 0.35);

  &:hover:not(:disabled) {
    background: ${t.dangerSoft};
  }
`;
