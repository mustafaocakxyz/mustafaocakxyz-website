import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { AlertTriangle, BookOpen, Check, ChevronLeft, Library, Minus, Plus, Search, Settings2, Trash2, X } from 'lucide-react';
import { formatDenemeNet } from '../data/denemeTypes';
import { averageSubjectDenemeNet } from '../data/subjectDenemeSources';
import { preview as t } from '../preview/adminPreviewTheme';
import {
  ProgressFill,
  ProgressTrack,
  SectionPill,
  SectionPillRow,
} from '../preview/AdminPreviewUi';
import type {
  CurriculumCatalog,
  CurriculumMaterial,
  CurriculumSubject,
  DenemeEntry,
  MaterialTopicProgress,
  StudentCurriculumState,
  SubjectTopicProgress,
  TopicStatus,
} from '../types';
import { isTopicCompleted, materialCorrectPercent, TOPIC_STATUS_LABEL } from '../types';

type TabId = 'dersler' | 'materyaller';
type PickerMode = 'subject' | 'material' | null;

type PickerItem = {
  id: string;
  title: string;
  subtitle?: string;
};

type KonuMateryalPanelProps = {
  catalog: CurriculumCatalog;
  state: StudentCurriculumState;
  denemes: DenemeEntry[];
  canEnroll: boolean;
  onEnrollSubject: (subjectId: string) => Promise<void>;
  onUnenrollSubject: (subjectId: string) => Promise<void>;
  onEnrollMaterial: (materialId: string) => Promise<void>;
  onUnenrollMaterial: (materialId: string) => Promise<void>;
  onUpdateSubjectTopic: (topicId: string, status: TopicStatus) => Promise<void>;
  onUpdateMaterialTopic: (
    topicId: string,
    input: {
      status: TopicStatus;
      correctCount: number | null;
      questionCount: number | null;
    },
  ) => Promise<void>;
};

function completionPct(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((100 * completed) / total);
}

function subjectProgressMap(rows: SubjectTopicProgress[]) {
  return new Map(rows.map((r) => [r.topicId, r]));
}

function materialProgressMap(rows: MaterialTopicProgress[]) {
  return new Map(rows.map((r) => [r.topicId, r]));
}

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR');
}

export function KonuMateryalPanel({
  catalog,
  state,
  denemes,
  canEnroll,
  onEnrollSubject,
  onUnenrollSubject,
  onEnrollMaterial,
  onUnenrollMaterial,
  onUpdateSubjectTopic,
  onUpdateMaterialTopic,
}: KonuMateryalPanelProps) {
  const [tab, setTab] = useState<TabId>('dersler');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [pickerQuery, setPickerQuery] = useState('');

  const enrolledSubjects = useMemo(
    () => catalog.subjects.filter((s) => state.subjectIds.includes(s.id)),
    [catalog.subjects, state.subjectIds],
  );

  const availableSubjects = useMemo(
    () => catalog.subjects.filter((s) => !state.subjectIds.includes(s.id)),
    [catalog.subjects, state.subjectIds],
  );

  const enrolledMaterials = useMemo(
    () => catalog.materials.filter((m) => state.materialIds.includes(m.id)),
    [catalog.materials, state.materialIds],
  );

  const availableMaterials = useMemo(
    () => catalog.materials.filter((m) => !state.materialIds.includes(m.id)),
    [catalog.materials, state.materialIds],
  );

  const subjectProg = useMemo(
    () => subjectProgressMap(state.subjectProgress),
    [state.subjectProgress],
  );
  const materialProg = useMemo(
    () => materialProgressMap(state.materialProgress),
    [state.materialProgress],
  );

  const materialsBySubject = useMemo(() => {
    const map = new Map<string, CurriculumMaterial[]>();
    for (const material of enrolledMaterials) {
      const list = map.get(material.subjectId) ?? [];
      list.push(material);
      map.set(material.subjectId, list);
    }
    return map;
  }, [enrolledMaterials]);

  const pickerItems: PickerItem[] = useMemo(() => {
    if (pickerMode === 'subject') {
      return availableSubjects.map((s) => ({ id: s.id, title: s.label }));
    }
    if (pickerMode === 'material') {
      return availableMaterials.map((m) => {
        const subjectLabel =
          catalog.subjects.find((s) => s.id === m.subjectId)?.label ?? m.subjectId;
        return { id: m.id, title: m.label, subtitle: subjectLabel };
      });
    }
    return [];
  }, [pickerMode, availableSubjects, availableMaterials, catalog.subjects]);

  const filteredPickerItems = useMemo(() => {
    const q = normalizeSearch(pickerQuery);
    if (!q) return pickerItems;
    return pickerItems.filter((item) => {
      const hay = normalizeSearch(`${item.title} ${item.subtitle ?? ''}`);
      return hay.includes(q);
    });
  }, [pickerItems, pickerQuery]);

  useEffect(() => {
    if (tab !== 'dersler') setSelectedSubjectId(null);
    if (tab !== 'materyaller') setSelectedMaterialId(null);
  }, [tab]);

  useEffect(() => {
    if (!pickerMode) setPickerQuery('');
  }, [pickerMode]);

  const selectedSubject = useMemo(
    () => enrolledSubjects.find((s) => s.id === selectedSubjectId) ?? null,
    [enrolledSubjects, selectedSubjectId],
  );

  const selectedMaterial = useMemo(
    () => enrolledMaterials.find((m) => m.id === selectedMaterialId) ?? null,
    [enrolledMaterials, selectedMaterialId],
  );

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch {
      setError('İşlem kaydedilemedi.');
    } finally {
      setBusy(false);
    }
  };

  const closePicker = () => setPickerMode(null);

  const handlePick = (id: string) => {
    if (pickerMode === 'subject') {
      void run(async () => {
        await onEnrollSubject(id);
        closePicker();
      });
      return;
    }
    if (pickerMode === 'material') {
      void run(async () => {
        const material = catalog.materials.find((m) => m.id === id);
        if (material && !state.subjectIds.includes(material.subjectId)) {
          await onEnrollSubject(material.subjectId);
        }
        await onEnrollMaterial(id);
        closePicker();
      });
    }
  };

  return (
    <Stack>
      <OuterPanel>
        <SectionPillRow>
          <SectionPill type="button" $active={tab === 'dersler'} onClick={() => setTab('dersler')}>
            Dersler
          </SectionPill>
          <SectionPill
            type="button"
            $active={tab === 'materyaller'}
            onClick={() => setTab('materyaller')}
          >
            Materyaller
          </SectionPill>
        </SectionPillRow>

        {error ? <ErrorNote>{error}</ErrorNote> : null}

        {tab === 'dersler' ? (
          selectedSubject ? (
            <SubjectDetailView
              subject={selectedSubject}
              progress={subjectProg}
              denemeAvg={averageSubjectDenemeNet(selectedSubject.id, denemes)}
              canEnroll={canEnroll}
              busy={busy}
              onBack={() => setSelectedSubjectId(null)}
              onUnenroll={() =>
                void run(async () => {
                  await onUnenrollSubject(selectedSubject.id);
                  setSelectedSubjectId(null);
                })
              }
              onUpdateTopic={(topicId, status) =>
                void run(() => onUpdateSubjectTopic(topicId, status))
              }
            />
          ) : enrolledSubjects.length === 0 ? (
            <Empty>Henüz ders atanmadı.</Empty>
          ) : (
            <SubjectStack>
              {enrolledSubjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  materials={catalog.materials.filter(
                    (m) => m.subjectId === subject.id && state.materialIds.includes(m.id),
                  )}
                  progress={subjectProg}
                  materialProgress={materialProg}
                  denemeAvg={averageSubjectDenemeNet(subject.id, denemes)}
                  onOpen={() => setSelectedSubjectId(subject.id)}
                />
              ))}
            </SubjectStack>
          )
        ) : selectedMaterial ? (
          <MaterialDetailView
            material={selectedMaterial}
            subjectLabel={
              catalog.subjects.find((s) => s.id === selectedMaterial.subjectId)?.label ?? null
            }
            progress={materialProg}
            canEnroll={canEnroll}
            busy={busy}
            onBack={() => setSelectedMaterialId(null)}
            onUnenroll={() =>
              void run(async () => {
                await onUnenrollMaterial(selectedMaterial.id);
                setSelectedMaterialId(null);
              })
            }
            onUpdateTopic={(topicId, input) =>
              void run(() => onUpdateMaterialTopic(topicId, input))
            }
          />
        ) : enrolledMaterials.length === 0 ? (
          <Empty>Henüz materyal atanmadı.</Empty>
        ) : (
          <MaterialGroups>
            {enrolledSubjects
              .filter((s) => (materialsBySubject.get(s.id) ?? []).length > 0)
              .map((subject) => (
                <MaterialGroup key={subject.id}>
                  <GroupTitle>{subject.label}</GroupTitle>
                  <CardGrid>
                    {(materialsBySubject.get(subject.id) ?? []).map((material) => (
                      <MaterialCardView
                        key={material.id}
                        material={material}
                        progress={materialProg}
                        onOpen={() => setSelectedMaterialId(material.id)}
                      />
                    ))}
                  </CardGrid>
                </MaterialGroup>
              ))}
            {enrolledMaterials
              .filter((m) => !state.subjectIds.includes(m.subjectId))
              .map((material) => (
                <MaterialCardView
                  key={material.id}
                  material={material}
                  progress={materialProg}
                  onOpen={() => setSelectedMaterialId(material.id)}
                />
              ))}
          </MaterialGroups>
        )}
      </OuterPanel>

      {canEnroll && !selectedSubject && !selectedMaterial ? (
        <OuterPanel>
          {tab === 'dersler' ? (
            <AddBox>
              <AddBoxCopy>
                <AddBoxTitle>Ders ekle</AddBoxTitle>
                <AddBoxSub>
                  {availableSubjects.length === 0
                    ? 'Eklenebilecek ders kalmadı.'
                    : 'Havuzdan ders seçip öğrenciye ata.'}
                </AddBoxSub>
              </AddBoxCopy>
              <AddBoxButton
                type="button"
                disabled={busy || availableSubjects.length === 0}
                onClick={() => setPickerMode('subject')}
              >
                <Plus size={16} />
                Ekle
              </AddBoxButton>
            </AddBox>
          ) : (
            <AddBox>
              <AddBoxCopy>
                <AddBoxTitle>Materyal ekle</AddBoxTitle>
                <AddBoxSub>
                  {availableMaterials.length === 0
                    ? 'Eklenebilecek materyal kalmadı.'
                    : 'Havuzdan materyal seçip öğrenciye ata.'}
                </AddBoxSub>
              </AddBoxCopy>
              <AddBoxButton
                type="button"
                disabled={busy || availableMaterials.length === 0}
                onClick={() => setPickerMode('material')}
              >
                <Plus size={16} />
                Ekle
              </AddBoxButton>
            </AddBox>
          )}
        </OuterPanel>
      ) : null}

      {pickerMode ? (
        <PickerOverlay
          role="dialog"
          aria-modal="true"
          aria-label={pickerMode === 'subject' ? 'Ders seç' : 'Materyal seç'}
          onClick={closePicker}
        >
          <PickerModal onClick={(e) => e.stopPropagation()}>
            <PickerHead>
              <div>
                <PickerTitle>{pickerMode === 'subject' ? 'Ders seç' : 'Materyal seç'}</PickerTitle>
                <PickerSub>Ara ve listeden ekle.</PickerSub>
              </div>
              <PickerClose type="button" onClick={closePicker} aria-label="Kapat">
                <X size={18} />
              </PickerClose>
            </PickerHead>

            <SearchWrap>
              <Search size={16} />
              <SearchInput
                autoFocus
                value={pickerQuery}
                placeholder={
                  pickerMode === 'subject' ? 'Ders ara…' : 'Materyal veya ders ara…'
                }
                onChange={(e) => setPickerQuery(e.target.value)}
              />
            </SearchWrap>

            <PickerList>
              {filteredPickerItems.length === 0 ? (
                <PickerEmpty>Sonuç yok.</PickerEmpty>
              ) : (
                filteredPickerItems.map((item) => (
                  <PickerItemButton
                    key={item.id}
                    type="button"
                    disabled={busy}
                    onClick={() => handlePick(item.id)}
                  >
                    <PickerItemTitle>{item.title}</PickerItemTitle>
                    {item.subtitle ? <PickerItemSub>{item.subtitle}</PickerItemSub> : null}
                  </PickerItemButton>
                ))
              )}
            </PickerList>
          </PickerModal>
        </PickerOverlay>
      ) : null}
    </Stack>
  );
}

function SubjectCard({
  subject,
  materials,
  progress,
  materialProgress,
  denemeAvg,
  onOpen,
}: {
  subject: CurriculumSubject;
  materials: CurriculumMaterial[];
  progress: Map<string, SubjectTopicProgress>;
  materialProgress: Map<string, MaterialTopicProgress>;
  denemeAvg: number | null;
  onOpen: () => void;
}) {
  const completed = subject.topics.filter((topic) =>
    isTopicCompleted(progress.get(topic.id)?.status ?? 'none'),
  ).length;
  const topicPct = completionPct(completed, subject.topics.length);
  const denemeLabel = denemeAvg == null ? '—' : formatDenemeNet(denemeAvg);
  const denemePct =
    denemeAvg == null ? 0 : Math.max(0, Math.min(100, (denemeAvg / 40) * 100));

  return (
    <Tile>
      <TileMain type="button" onClick={onOpen}>
        <TileTop>
          <SubjectTileName>{subject.label}</SubjectTileName>
          <MaterialIcons>
            {materials.length === 0 ? (
              <MutedTiny>Materyal yok</MutedTiny>
            ) : (
              materials.map((m) => {
                const done = m.topics.filter((topic) =>
                  isTopicCompleted(materialProgress.get(topic.id)?.status ?? 'none'),
                ).length;
                const pct = completionPct(done, m.topics.length);
                return (
                  <MaterialChip key={m.id} title={`${m.label}: %${pct}`}>
                    <Library size={14} />
                    <MaterialChipName>{m.label}</MaterialChipName>
                    <span>%{pct}</span>
                  </MaterialChip>
                );
              })
            )}
          </MaterialIcons>
        </TileTop>

        <BarBlock>
          <BarLabelRow>
            <span>Konu</span>
            <strong>
              {completed}/{subject.topics.length || 0} · %{topicPct}
            </strong>
          </BarLabelRow>
          <SubjectProgressTrack>
            <ProgressFill $pct={topicPct} />
          </SubjectProgressTrack>
        </BarBlock>

        <BarBlock>
          <BarLabelRow>
            <span>Deneme ort. (son 4)</span>
            <strong>{denemeLabel}</strong>
          </BarLabelRow>
          <SubjectProgressTrack>
            <ProgressFill $pct={denemeAvg == null ? 0 : denemePct} />
          </SubjectProgressTrack>
        </BarBlock>
      </TileMain>
    </Tile>
  );
}

function MaterialCardView({
  material,
  progress,
  onOpen,
}: {
  material: CurriculumMaterial;
  progress: Map<string, MaterialTopicProgress>;
  onOpen: () => void;
}) {
  const completed = material.topics.filter((topic) =>
    isTopicCompleted(progress.get(topic.id)?.status ?? 'none'),
  ).length;
  const pct = completionPct(completed, material.topics.length);

  return (
    <Tile>
      <TileMain type="button" onClick={onOpen}>
        <TileTop>
          <TileName>
            <BookOpen size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
            {material.label}
          </TileName>
          <strong>%{pct}</strong>
        </TileTop>
        <BarBlock>
          <BarLabelRow>
            <span>Konu tamamlanma</span>
            <strong>
              {completed}/{material.topics.length || 0}
            </strong>
          </BarLabelRow>
          <ProgressTrack>
            <ProgressFill $pct={pct} />
          </ProgressTrack>
        </BarBlock>
      </TileMain>
    </Tile>
  );
}

function correctPctTone(pct: number | null): 'ok' | 'warn' | 'bad' | 'muted' {
  if (pct == null) return 'muted';
  if (pct > 85) return 'ok';
  if (pct >= 60) return 'warn';
  return 'bad';
}

const STATUS_ORDER: TopicStatus[] = ['none', 'current', 'completed_warn', 'completed_ok'];

const STATUS_ICON = {
  none: Minus,
  current: Settings2,
  completed_warn: AlertTriangle,
  completed_ok: Check,
} as const;

function TopicStatusPills({
  status,
  busy,
  onSelect,
}: {
  status: TopicStatus;
  busy: boolean;
  onSelect: (status: TopicStatus) => void;
}) {
  return (
    <>
      {STATUS_ORDER.map((key) => {
        const Icon = STATUS_ICON[key];
        return (
          <StatusChip
            key={key}
            type="button"
            $status={key}
            $active={status === key}
            disabled={busy}
            aria-label={TOPIC_STATUS_LABEL[key]}
            title={TOPIC_STATUS_LABEL[key]}
            onClick={() => onSelect(key)}
          >
            <Icon size={15} strokeWidth={2.4} />
          </StatusChip>
        );
      })}
    </>
  );
}

function SubjectDetailView({
  subject,
  progress,
  denemeAvg,
  canEnroll,
  busy,
  onBack,
  onUnenroll,
  onUpdateTopic,
}: {
  subject: CurriculumSubject;
  progress: Map<string, SubjectTopicProgress>;
  denemeAvg: number | null;
  canEnroll: boolean;
  busy: boolean;
  onBack: () => void;
  onUnenroll: () => void;
  onUpdateTopic: (topicId: string, status: TopicStatus) => void;
}) {
  const completed = subject.topics.filter((topic) =>
    isTopicCompleted(progress.get(topic.id)?.status ?? 'none'),
  ).length;
  const pct = completionPct(completed, subject.topics.length);
  const denemeLabel = denemeAvg == null ? '—' : formatDenemeNet(denemeAvg);

  return (
    <DetailStack>
      <DetailTopBar>
        <BackButton type="button" onClick={onBack}>
          <ChevronLeft size={18} />
          Derslere dön
        </BackButton>
        {canEnroll ? (
          <TrashIconButton
            type="button"
            disabled={busy}
            onClick={onUnenroll}
            aria-label="Dersi kaldır"
            title="Dersi kaldır"
          >
            <Trash2 size={18} />
          </TrashIconButton>
        ) : null}
      </DetailTopBar>

      <DetailHeader>
        <DetailTitle>
          <Library size={22} />
          <div>
            <DetailName>{subject.label}</DetailName>
            <DetailMeta>
              {completed}/{subject.topics.length || 0} konu · Deneme ort. {denemeLabel}
            </DetailMeta>
          </div>
        </DetailTitle>
        <DetailBarWrap>
          <ThickProgressTrack>
            <ProgressFill $pct={pct} />
          </ThickProgressTrack>
        </DetailBarWrap>
        <DetailPct>%{pct}</DetailPct>
      </DetailHeader>

      {subject.topics.length === 0 ? (
        <Empty>Bu ders için konu listesi yok.</Empty>
      ) : (
        <DetailTopicList>
          {subject.topics.map((topic) => (
            <SubjectTopicDetailRow
              key={topic.id}
              label={topic.label}
              status={progress.get(topic.id)?.status ?? 'none'}
              busy={busy}
              onUpdateStatus={(status) => onUpdateTopic(topic.id, status)}
            />
          ))}
        </DetailTopicList>
      )}
    </DetailStack>
  );
}

function SubjectTopicDetailRow({
  label,
  status,
  busy,
  onUpdateStatus,
}: {
  label: string;
  status: TopicStatus;
  busy: boolean;
  onUpdateStatus: (status: TopicStatus) => void;
}) {
  return (
    <SubjectTopicRow>
      <SubjectTopicName>{label}</SubjectTopicName>
      <SubjectStatusRow>
        <TopicStatusPills status={status} busy={busy} onSelect={onUpdateStatus} />
      </SubjectStatusRow>
    </SubjectTopicRow>
  );
}

function MaterialDetailView({
  material,
  subjectLabel,
  progress,
  canEnroll,
  busy,
  onBack,
  onUnenroll,
  onUpdateTopic,
}: {
  material: CurriculumMaterial;
  subjectLabel: string | null;
  progress: Map<string, MaterialTopicProgress>;
  canEnroll: boolean;
  busy: boolean;
  onBack: () => void;
  onUnenroll: () => void;
  onUpdateTopic: (
    topicId: string,
    input: {
      status: TopicStatus;
      correctCount: number | null;
      questionCount: number | null;
    },
  ) => void;
}) {
  const completed = material.topics.filter((topic) =>
    isTopicCompleted(progress.get(topic.id)?.status ?? 'none'),
  ).length;
  const pct = completionPct(completed, material.topics.length);

  return (
    <DetailStack>
      <DetailTopBar>
        <BackButton type="button" onClick={onBack}>
          <ChevronLeft size={18} />
          Materyallere dön
        </BackButton>
        {canEnroll ? (
          <TrashIconButton
            type="button"
            disabled={busy}
            onClick={onUnenroll}
            aria-label="Materyali kaldır"
            title="Materyali kaldır"
          >
            <Trash2 size={18} />
          </TrashIconButton>
        ) : null}
      </DetailTopBar>

      <DetailHeader>
        <DetailTitle>
          <BookOpen size={22} />
          <div>
            <DetailName>{material.label}</DetailName>
            {subjectLabel ? <DetailSubject>{subjectLabel}</DetailSubject> : null}
            <DetailMeta>
              {completed}/{material.topics.length || 0} konu
            </DetailMeta>
          </div>
        </DetailTitle>
        <DetailBarWrap>
          <ThickProgressTrack>
            <ProgressFill $pct={pct} />
          </ThickProgressTrack>
        </DetailBarWrap>
        <DetailPct>%{pct}</DetailPct>
      </DetailHeader>

      {material.topics.length === 0 ? (
        <Empty>Bu materyal için konu listesi yok.</Empty>
      ) : (
        <DetailTopicList>
          {material.topics.map((topic) => (
            <MaterialTopicDetailRow
              key={topic.id}
              topicId={topic.id}
              label={topic.label}
              row={progress.get(topic.id)}
              busy={busy}
              onUpdateTopic={onUpdateTopic}
            />
          ))}
        </DetailTopicList>
      )}
    </DetailStack>
  );
}

function MaterialTopicDetailRow({
  topicId,
  label,
  row,
  busy,
  onUpdateTopic,
}: {
  topicId: string;
  label: string;
  row: MaterialTopicProgress | undefined;
  busy: boolean;
  onUpdateTopic: (
    topicId: string,
    input: {
      status: TopicStatus;
      correctCount: number | null;
      questionCount: number | null;
    },
  ) => void;
}) {
  const status = row?.status ?? 'none';
  const [correctDraft, setCorrectDraft] = useState(
    row?.correctCount == null ? '' : String(row.correctCount),
  );
  const [totalDraft, setTotalDraft] = useState(
    row?.questionCount == null ? '' : String(row.questionCount),
  );

  useEffect(() => {
    setCorrectDraft(row?.correctCount == null ? '' : String(row.correctCount));
    setTotalDraft(row?.questionCount == null ? '' : String(row.questionCount));
  }, [row?.correctCount, row?.questionCount, topicId]);

  const correctPct = materialCorrectPercent(
    correctDraft === '' ? null : Number(correctDraft),
    totalDraft === '' ? null : Number(totalDraft),
  );
  const tone = correctPctTone(correctPct);

  const parseCounts = () => {
    const correctCount = correctDraft === '' ? null : Math.max(0, Number(correctDraft));
    const questionCount = totalDraft === '' ? null : Math.max(1, Number(totalDraft));
    if (
      (correctCount == null && questionCount != null) ||
      (correctCount != null && questionCount == null) ||
      (correctCount != null && questionCount != null && correctCount > questionCount)
    ) {
      return { correctCount: null as number | null, questionCount: null as number | null };
    }
    return { correctCount, questionCount };
  };

  const commitScores = () => {
    const counts = parseCounts();
    if (correctDraft !== '' && totalDraft !== '' && counts.correctCount == null) return;
    onUpdateTopic(topicId, { status, ...counts });
  };

  const setStatus = (nextStatus: TopicStatus) => {
    const counts = parseCounts();
    onUpdateTopic(topicId, {
      status: nextStatus,
      correctCount: counts.correctCount,
      questionCount: counts.questionCount,
    });
  };

  return (
    <DetailTopicCard>
      <DetailTopicName>{label}</DetailTopicName>

      <DetailCountRow>
        <MiniField>
          Doğru
          <MiniInput
            type="number"
            min={0}
            disabled={busy}
            value={correctDraft}
            onChange={(e) => setCorrectDraft(e.target.value)}
            onBlur={commitScores}
          />
        </MiniField>
        <MiniField>
          Toplam
          <MiniInput
            type="number"
            min={1}
            disabled={busy}
            value={totalDraft}
            onChange={(e) => setTotalDraft(e.target.value)}
            onBlur={commitScores}
          />
        </MiniField>
      </DetailCountRow>

      <StatusRow>
        <TopicStatusPills status={status} busy={busy} onSelect={setStatus} />
      </StatusRow>

      <CorrectPctBig $tone={tone}>
        {correctPct == null ? '—%' : `%${correctPct}`}
      </CorrectPctBig>
    </DetailTopicCard>
  );
}

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  width: 100%;
`;

const OuterPanel = styled.section`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 16px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.border};
  background: ${t.panel};
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-x: clip;
`;

const ErrorNote = styled.p`
  margin: 0;
  color: ${t.danger};
  font-size: 0.86rem;
  font-weight: 700;
`;

const Empty = styled.p`
  margin: 0;
  padding: 18px 12px;
  text-align: center;
  color: ${t.muted};
  font-size: 0.9rem;
  border: 1px dashed ${t.border};
  border-radius: ${t.radiusMd};
`;


const AddBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
`;

const AddBoxCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const AddBoxTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${t.text};
`;

const AddBoxSub = styled.div`
  font-size: 0.8rem;
  color: ${t.muted};
  line-height: 1.35;
`;

const AddBoxButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid ${t.accentBorder};
  background: ${t.accentSoft};
  color: ${t.text};
  font: inherit;
  font-size: 0.84rem;
  font-weight: 800;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(199, 44, 121, 0.28);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const PickerOverlay = styled.div`
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

const PickerModal = styled.div`
  width: min(520px, 100%);
  max-height: min(72vh, 640px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.borderStrong};
  background: ${t.panel};
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  min-width: 0;
`;

const PickerHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const PickerTitle = styled.div`
  font-size: 1.05rem;
  font-weight: 800;
  color: ${t.text};
`;

const PickerSub = styled.div`
  margin-top: 2px;
  font-size: 0.8rem;
  color: ${t.muted};
`;

const PickerClose = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.muted};
  cursor: pointer;

  &:hover {
    color: ${t.text};
    border-color: ${t.borderStrong};
  }
`;

const SearchWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.muted};
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: ${t.text};
  font: inherit;
  font-size: 0.92rem;

  &::placeholder {
    color: ${t.mutedSoft};
  }
`;

const PickerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  min-height: 0;
  padding-right: 2px;
`;

const PickerEmpty = styled.div`
  padding: 20px 10px;
  text-align: center;
  color: ${t.muted};
  font-size: 0.88rem;
`;

const PickerItemButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font: inherit;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: rgba(96, 165, 250, 0.55);
    background: rgba(59, 130, 246, 0.12);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const PickerItemTitle = styled.span`
  font-size: 0.92rem;
  font-weight: 800;
`;

const PickerItemSub = styled.span`
  font-size: 0.78rem;
  color: ${t.muted};
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: 12px;
  min-width: 0;
`;

const SubjectStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 0;
`;

const Tile = styled.div`
  width: 100%;
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.border};
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.88));
  overflow: hidden;
`;

const TileMain = styled.button`
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  color: inherit;
  padding: 14px;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &:hover {
    background: rgba(148, 163, 184, 0.06);
  }
`;

const TileTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
`;

const TileName = styled.div`
  font-size: 1.05rem;
  font-weight: 800;
  color: ${t.text};
  min-width: 0;
  overflow-wrap: anywhere;
`;

const SubjectTileName = styled.div`
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: ${t.text};
  min-width: 0;
  overflow-wrap: anywhere;
`;

const MaterialIcons = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  max-width: 58%;
`;

const MaterialChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: 100%;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid ${t.borderStrong};
  background: ${t.panel2};
  color: ${t.text};
  font-size: 0.84rem;
  font-weight: 800;
  min-width: 0;

  svg {
    flex-shrink: 0;
    color: ${t.muted};
  }
`;

const MaterialChipName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${t.muted};
  font-weight: 700;
`;

const MutedTiny = styled.span`
  font-size: 0.72rem;
  color: ${t.mutedSoft};
`;

const BarBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SubjectProgressTrack = styled.div`
  width: 100%;
  height: 14px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  overflow: hidden;
`;

const BarLabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.82rem;
  color: ${t.muted};

  strong {
    color: ${t.text};
    font-weight: 800;
  }
`;

const MaterialGroups = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const MaterialGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const GroupTitle = styled.h3`
  margin: 0;
  font-size: 0.92rem;
  font-weight: 800;
  color: #a5b4fc;
  letter-spacing: 0.02em;
`;

const DetailStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
`;

const DetailTopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: ${t.muted};
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: ${t.text};
  }
`;

const TrashIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(248, 113, 113, 0.35);
  background: ${t.dangerSoft};
  color: ${t.danger};
  cursor: pointer;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    border-color: rgba(248, 113, 113, 0.6);
    background: rgba(248, 113, 113, 0.24);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  padding: 4px 2px;

  @media (max-width: 700px) {
    flex-wrap: wrap;
  }
`;

const DetailTitle = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  flex: 0 1 220px;
  color: ${t.text};

  svg {
    flex-shrink: 0;
    margin-top: 3px;
  }

  @media (max-width: 700px) {
    flex: 1 1 100%;
  }
`;

const DetailName = styled.div`
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  overflow-wrap: anywhere;
`;

const DetailSubject = styled.div`
  margin-top: 4px;
  font-size: 0.82rem;
  font-weight: 700;
  color: ${t.muted};
`;

const DetailMeta = styled.div`
  margin-top: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${t.mutedSoft};
`;

const DetailBarWrap = styled.div`
  flex: 1 1 140px;
  min-width: 0;
  display: flex;
  align-items: center;
`;

const ThickProgressTrack = styled.div`
  width: 100%;
  height: 16px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  overflow: hidden;
`;

const DetailPct = styled.div`
  flex-shrink: 0;
  min-width: 64px;
  text-align: right;
  font-size: 1.55rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: ${t.text};
`;

const DetailTopicList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DetailTopicCard = styled.div`
  display: grid;
  grid-template-columns: minmax(96px, 0.85fr) auto minmax(280px, 2fr) auto;
  align-items: center;
  gap: 12px 12px;
  padding: 12px 14px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.border};
  background: rgba(15, 23, 42, 0.45);
  min-width: 0;

  @media (max-width: 820px) {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'name pct'
      'counts counts'
      'status status';
  }
`;

const DetailTopicName = styled.div`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${t.text};
  overflow-wrap: anywhere;
  min-width: 0;

  @media (max-width: 820px) {
    grid-area: name;
  }
`;

const DetailCountRow = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-end;
  gap: 8px;

  @media (max-width: 820px) {
    grid-area: counts;
  }
`;

const CorrectPctBig = styled.div<{ $tone: 'ok' | 'warn' | 'bad' | 'muted' }>`
  flex-shrink: 0;
  min-width: 64px;
  text-align: right;
  font-size: 1.45rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
  color: ${({ $tone }) =>
    $tone === 'ok'
      ? t.success
      : $tone === 'warn'
        ? t.warn
        : $tone === 'bad'
          ? t.danger
          : t.mutedSoft};

  @media (max-width: 820px) {
    grid-area: pct;
  }
`;

const StatusChip = styled.button<{ $status: TopicStatus; $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  padding: 0;
  border-radius: 10px;
  border: 1px solid
    ${({ $status, $active }) => {
      if (!$active) return t.border;
      if ($status === 'none') return 'rgba(226, 232, 240, 0.45)';
      if ($status === 'current') return 'rgba(96, 165, 250, 0.65)';
      if ($status === 'completed_warn') return 'rgba(251, 191, 36, 0.65)';
      return 'rgba(52, 211, 153, 0.65)';
    }};
  background: ${({ $status }) => {
    if ($status === 'none') return 'rgba(226, 232, 240, 0.16)';
    if ($status === 'current') return 'rgba(96, 165, 250, 0.22)';
    if ($status === 'completed_warn') return 'rgba(251, 191, 36, 0.2)';
    return 'rgba(52, 211, 153, 0.2)';
  }};
  color: ${({ $status }) => {
    if ($status === 'none') return 'rgba(226, 232, 240, 0.88)';
    if ($status === 'current') return '#93C5FD';
    if ($status === 'completed_warn') return '#FBBF24';
    return '#34D399';
  }};
  opacity: ${({ $active }) => ($active ? 1 : 0.48)};
  cursor: pointer;
  transition:
    opacity 0.12s ease,
    border-color 0.12s ease,
    transform 0.12s ease,
    box-shadow 0.12s ease;
  box-shadow: ${({ $active, $status }) =>
    $active
      ? $status === 'none'
        ? '0 0 0 1px rgba(226, 232, 240, 0.18)'
        : $status === 'current'
          ? '0 0 0 1px rgba(96, 165, 250, 0.28)'
          : $status === 'completed_warn'
            ? '0 0 0 1px rgba(251, 191, 36, 0.28)'
            : '0 0 0 1px rgba(52, 211, 153, 0.28)'
      : 'none'};

  &:hover:not(:disabled) {
    opacity: 1;
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const StatusRow = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  min-width: 0;

  @media (max-width: 820px) {
    grid-area: status;
    justify-content: stretch;

    ${StatusChip} {
      flex: 1 1 0;
      width: auto;
    }
  }
`;

const SubjectTopicRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.border};
  background: rgba(15, 23, 42, 0.45);
  min-width: 0;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SubjectTopicName = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: ${t.text};
  overflow-wrap: anywhere;
  line-height: 1.35;
`;

const SubjectStatusRow = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;

  @media (max-width: 640px) {
    width: 100%;

    ${StatusChip} {
      flex: 1 1 0;
      width: auto;
    }
  }
`;

const MiniField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  color: ${t.muted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const MiniInput = styled.input`
  width: 64px;
  box-sizing: border-box;
  padding: 7px 8px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font: inherit;
  font-size: 0.86rem;
`;
