/** Extensible deneme type catalog. UI edits leaf nodes only. */

export type DenemeTypeId =
  | 'sayilar'
  | 'problemler'
  | 'tyt_geometri'
  | 'tyt_matematik'
  | 'tyt_fen'
  | 'tyt_sosyal'
  | 'tyt_genel';

/** How D/Y/B are entered for a leaf. Future types use one of these. */
export type DenemeEntryMode = 'capped' | 'flexible';

export type DenemeLeafDef = {
  id: string;
  label: string;
  /**
   * capped: fixed questionCount; enter D+Y, B derived.
   * flexible: no cap; enter D+Y+B explicitly.
   */
  entryMode: DenemeEntryMode;
  /** Required when entryMode is capped. */
  questionCount?: number;
  /** Optional group header for nested types (e.g. TYT Genel). */
  group?: string;
};

export type DenemeTypeDef = {
  id: DenemeTypeId;
  label: string;
  leaves: DenemeLeafDef[];
  topicPresets: string[];
};

const SAYILAR_TOPICS = [
  'Temel Kavramlar',
  'Basamak Kavramı',
  'Tek ve Çift Sayılar',
  'Bölme ve Bölünebilme',
  'Faktöriyel',
  'Asal Sayılar',
  'Ardışık Sayılar',
  'EBOB – EKOK',
  'Rasyonel Sayılar',
  'Denklemler',
  'Eşitsizlikler',
  'Mutlak Değer',
  'Üslü Sayılar',
  'Köklü Sayılar',
  'Çarpanlara Ayırma',
] as const;

const PROBLEMLER_TOPICS = [
  'Oran Orantı',
  'Sayı Problemleri',
  'Kesir Problemleri',
  'Yaş Problemleri',
  'Hareket Hız Problemleri',
  'İşçi Emek Problemleri',
  'Yüzde Problemleri',
  'Kar Zarar Problemleri',
  'Karışım Problemleri',
  'Grafik Problemleri',
  'Rutin Olmayan Problemler',
] as const;

const TYT_MATEMATIK_EXTRA_TOPICS = [
  'Kümeler – Kartezyen Çarpım',
  'Mantık',
  'Fonksiyonlar',
  'Polinomlar',
  '2.Dereceden Denklemler',
  'Permütasyon ve Kombinasyon',
  'Olasılık',
  'Veri – İstatistik',
] as const;

export const DENEME_TYPES: DenemeTypeDef[] = [
  {
    id: 'sayilar',
    label: 'Sayılar',
    leaves: [{ id: 'sayilar', label: 'Sayılar', entryMode: 'flexible' }],
    topicPresets: [...SAYILAR_TOPICS],
  },
  {
    id: 'problemler',
    label: 'Problemler',
    leaves: [{ id: 'problemler', label: 'Problemler', entryMode: 'flexible' }],
    topicPresets: [...PROBLEMLER_TOPICS],
  },
  {
    id: 'tyt_geometri',
    label: 'TYT Geometri',
    leaves: [{ id: 'tyt_geometri', label: 'TYT Geometri', entryMode: 'capped', questionCount: 10 }],
    topicPresets: [],
  },
  {
    id: 'tyt_matematik',
    label: 'TYT Matematik',
    leaves: [
      { id: 'matematik', label: 'Matematik', entryMode: 'capped', questionCount: 30 },
      { id: 'geometri', label: 'Geometri', entryMode: 'capped', questionCount: 10 },
    ],
    topicPresets: [...SAYILAR_TOPICS, ...PROBLEMLER_TOPICS, ...TYT_MATEMATIK_EXTRA_TOPICS],
  },
  {
    id: 'tyt_fen',
    label: 'TYT Fen',
    leaves: [
      { id: 'fizik', label: 'Fizik', entryMode: 'capped', questionCount: 7 },
      { id: 'kimya', label: 'Kimya', entryMode: 'capped', questionCount: 7 },
      { id: 'biyoloji', label: 'Biyoloji', entryMode: 'capped', questionCount: 6 },
    ],
    topicPresets: [],
  },
  {
    id: 'tyt_sosyal',
    label: 'TYT Sosyal',
    leaves: [
      { id: 'tarih', label: 'Tarih', entryMode: 'capped', questionCount: 5 },
      { id: 'cografya', label: 'Coğrafya', entryMode: 'capped', questionCount: 5 },
      { id: 'felsefe', label: 'Felsefe', entryMode: 'capped', questionCount: 5 },
      { id: 'din', label: 'Din', entryMode: 'capped', questionCount: 5 },
    ],
    topicPresets: [],
  },
  {
    id: 'tyt_genel',
    label: 'TYT Genel',
    leaves: [
      { id: 'turkce', label: 'TYT Türkçe', entryMode: 'capped', questionCount: 40, group: 'TYT Türkçe' },
      { id: 'tarih', label: 'Tarih', entryMode: 'capped', questionCount: 5, group: 'TYT Sosyal' },
      { id: 'cografya', label: 'Coğrafya', entryMode: 'capped', questionCount: 5, group: 'TYT Sosyal' },
      { id: 'felsefe', label: 'Felsefe', entryMode: 'capped', questionCount: 5, group: 'TYT Sosyal' },
      { id: 'din', label: 'Din', entryMode: 'capped', questionCount: 5, group: 'TYT Sosyal' },
      { id: 'matematik', label: 'Matematik', entryMode: 'capped', questionCount: 30, group: 'TYT Matematik' },
      { id: 'geometri', label: 'Geometri', entryMode: 'capped', questionCount: 10, group: 'TYT Matematik' },
      { id: 'fizik', label: 'Fizik', entryMode: 'capped', questionCount: 7, group: 'TYT Fen' },
      { id: 'kimya', label: 'Kimya', entryMode: 'capped', questionCount: 7, group: 'TYT Fen' },
      { id: 'biyoloji', label: 'Biyoloji', entryMode: 'capped', questionCount: 6, group: 'TYT Fen' },
    ],
    topicPresets: [],
  },
];

const TYPE_BY_ID = Object.fromEntries(DENEME_TYPES.map((t) => [t.id, t])) as Record<
  DenemeTypeId,
  DenemeTypeDef
>;

export function getDenemeType(typeId: string): DenemeTypeDef | null {
  return TYPE_BY_ID[typeId as DenemeTypeId] ?? null;
}

export function isDenemeTypeId(value: string): value is DenemeTypeId {
  return value in TYPE_BY_ID;
}

export function isFlexibleLeaf(leaf: DenemeLeafDef): boolean {
  return leaf.entryMode === 'flexible';
}

export type DenemeLeafScore = {
  leafId: string;
  correct: number;
  wrong: number;
  /** Explicit empty count for flexible leaves. Omitted/ignored for capped. */
  empty?: number;
};

export function emptyScoresForType(typeId: DenemeTypeId): DenemeLeafScore[] {
  const def = getDenemeType(typeId);
  if (!def) return [];
  return def.leaves.map((leaf) =>
    isFlexibleLeaf(leaf)
      ? { leafId: leaf.id, correct: 0, wrong: 0, empty: 0 }
      : { leafId: leaf.id, correct: 0, wrong: 0 },
  );
}

export function leafEmptyCount(questionCount: number, correct: number, wrong: number): number {
  return Math.max(0, questionCount - correct - wrong);
}

/** Resolve empty count for display/validation based on leaf entry mode. */
export function resolveLeafEmpty(
  leaf: DenemeLeafDef,
  score: Pick<DenemeLeafScore, 'correct' | 'wrong' | 'empty'> | undefined,
): number {
  const correct = score?.correct ?? 0;
  const wrong = score?.wrong ?? 0;
  if (isFlexibleLeaf(leaf)) {
    return Math.max(0, score?.empty ?? 0);
  }
  return leafEmptyCount(leaf.questionCount ?? 0, correct, wrong);
}

/** Net = sum over leaves of (doğru − yanlış / 4). */
export function computeDenemeNet(typeId: string, scores: DenemeLeafScore[]): number {
  const def = getDenemeType(typeId);
  if (!def) return 0;
  let net = 0;
  for (const leaf of def.leaves) {
    const score = scores.find((s) => s.leafId === leaf.id);
    const correct = score?.correct ?? 0;
    const wrong = score?.wrong ?? 0;
    net += correct - wrong / 4;
  }
  return net;
}

export function formatDenemeNet(net: number): string {
  const rounded = Math.round(net * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function validateLeafScore(
  leaf: DenemeLeafDef,
  correct: number,
  wrong: number,
  empty?: number,
): string | null {
  if (!Number.isInteger(correct) || !Number.isInteger(wrong)) {
    return 'Doğru ve yanlış tam sayı olmalı.';
  }
  if (correct < 0 || wrong < 0) {
    return 'Negatif değer girilemez.';
  }

  if (isFlexibleLeaf(leaf)) {
    const emptyCount = empty ?? 0;
    if (!Number.isInteger(emptyCount)) {
      return 'Boş tam sayı olmalı.';
    }
    if (emptyCount < 0) {
      return 'Negatif değer girilemez.';
    }
    return null;
  }

  const questionCount = leaf.questionCount ?? 0;
  if (correct + wrong > questionCount) {
    return `Toplam ${questionCount} soruyu aşamaz (doğru + yanlış).`;
  }
  return null;
}

export function validateDenemeScores(
  typeId: string,
  scores: DenemeLeafScore[],
): string | null {
  const def = getDenemeType(typeId);
  if (!def) return 'Geçersiz deneme türü.';
  for (const leaf of def.leaves) {
    const score = scores.find((s) => s.leafId === leaf.id) ?? {
      leafId: leaf.id,
      correct: 0,
      wrong: 0,
      empty: isFlexibleLeaf(leaf) ? 0 : undefined,
    };
    const err = validateLeafScore(leaf, score.correct, score.wrong, score.empty);
    if (err) return `${leaf.label}: ${err}`;
  }
  return null;
}
