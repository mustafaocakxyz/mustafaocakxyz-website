/** Extensible deneme type catalog. UI edits leaf nodes only. */

export type DenemeTypeId =
  | 'sayilar'
  | 'problemler'
  | 'tyt_geometri'
  | 'tyt_matematik'
  | 'tyt_fen'
  | 'tyt_genel';

export type DenemeLeafDef = {
  id: string;
  label: string;
  questionCount: number;
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
    leaves: [{ id: 'sayilar', label: 'Sayılar', questionCount: 10 }],
    topicPresets: [...SAYILAR_TOPICS],
  },
  {
    id: 'problemler',
    label: 'Problemler',
    leaves: [{ id: 'problemler', label: 'Problemler', questionCount: 10 }],
    topicPresets: [...PROBLEMLER_TOPICS],
  },
  {
    id: 'tyt_geometri',
    label: 'TYT Geometri',
    leaves: [{ id: 'tyt_geometri', label: 'TYT Geometri', questionCount: 10 }],
    topicPresets: [],
  },
  {
    id: 'tyt_matematik',
    label: 'TYT Matematik',
    leaves: [
      { id: 'matematik', label: 'Matematik', questionCount: 30 },
      { id: 'geometri', label: 'Geometri', questionCount: 10 },
    ],
    topicPresets: [...SAYILAR_TOPICS, ...PROBLEMLER_TOPICS, ...TYT_MATEMATIK_EXTRA_TOPICS],
  },
  {
    id: 'tyt_fen',
    label: 'TYT Fen',
    leaves: [
      { id: 'fizik', label: 'Fizik', questionCount: 7 },
      { id: 'kimya', label: 'Kimya', questionCount: 7 },
      { id: 'biyoloji', label: 'Biyoloji', questionCount: 6 },
    ],
    topicPresets: [],
  },
  {
    id: 'tyt_genel',
    label: 'TYT Genel',
    leaves: [
      { id: 'turkce', label: 'TYT Türkçe', questionCount: 40, group: 'TYT Türkçe' },
      { id: 'tarih', label: 'Tarih', questionCount: 5, group: 'TYT Sosyal' },
      { id: 'cografya', label: 'Coğrafya', questionCount: 5, group: 'TYT Sosyal' },
      { id: 'felsefe', label: 'Felsefe', questionCount: 5, group: 'TYT Sosyal' },
      { id: 'din', label: 'Din', questionCount: 5, group: 'TYT Sosyal' },
      { id: 'matematik', label: 'Matematik', questionCount: 30, group: 'TYT Matematik' },
      { id: 'geometri', label: 'Geometri', questionCount: 10, group: 'TYT Matematik' },
      { id: 'fizik', label: 'Fizik', questionCount: 7, group: 'TYT Fen' },
      { id: 'kimya', label: 'Kimya', questionCount: 7, group: 'TYT Fen' },
      { id: 'biyoloji', label: 'Biyoloji', questionCount: 6, group: 'TYT Fen' },
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

export type DenemeLeafScore = {
  leafId: string;
  correct: number;
  wrong: number;
};

export function emptyScoresForType(typeId: DenemeTypeId): DenemeLeafScore[] {
  const def = getDenemeType(typeId);
  if (!def) return [];
  return def.leaves.map((leaf) => ({ leafId: leaf.id, correct: 0, wrong: 0 }));
}

export function leafEmptyCount(questionCount: number, correct: number, wrong: number): number {
  return Math.max(0, questionCount - correct - wrong);
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
  questionCount: number,
  correct: number,
  wrong: number,
): string | null {
  if (!Number.isInteger(correct) || !Number.isInteger(wrong)) {
    return 'Doğru ve yanlış tam sayı olmalı.';
  }
  if (correct < 0 || wrong < 0) {
    return 'Negatif değer girilemez.';
  }
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
    };
    const err = validateLeafScore(leaf.questionCount, score.correct, score.wrong);
    if (err) return `${leaf.label}: ${err}`;
  }
  return null;
}
