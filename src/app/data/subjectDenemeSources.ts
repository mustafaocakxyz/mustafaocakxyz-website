import type { DenemeTypeId } from './denemeTypes';
import { computeDenemeNet, getDenemeType } from './denemeTypes';
import type { DenemeEntry, DenemeLeafScore } from '../types';

/** How a subject pulls net from deneme records. Defined in code; rarely changes. */
export type SubjectDenemeSource = {
  typeId: DenemeTypeId;
  /** If set, only these leaves contribute to the subject net. */
  leafIds?: string[];
};

/**
 * Subject id → deneme sources.
 * Example: TYT Matematik uses branş TYT Matematik + TYT Genel matematik leaves.
 */
export const SUBJECT_DENEME_SOURCES: Record<string, SubjectDenemeSource[]> = {
  tyt_matematik: [
    { typeId: 'tyt_matematik' },
    { typeId: 'tyt_genel', leafIds: ['matematik', 'geometri'] },
  ],
  tyt_geometri: [
    { typeId: 'tyt_geometri' },
    { typeId: 'tyt_matematik', leafIds: ['geometri'] },
    { typeId: 'tyt_genel', leafIds: ['geometri'] },
  ],
  tyt_fen: [
    { typeId: 'tyt_fen' },
    { typeId: 'tyt_genel', leafIds: ['fizik', 'kimya', 'biyoloji'] },
  ],
  sayilar: [{ typeId: 'sayilar' }],
  problemler: [{ typeId: 'problemler' }],
};

const LAST_N = 4;

function netFromScores(
  typeId: string,
  scores: DenemeLeafScore[],
  leafIds?: string[],
): number {
  if (!leafIds || leafIds.length === 0) {
    return computeDenemeNet(typeId, scores);
  }
  const def = getDenemeType(typeId);
  if (!def) return 0;
  let net = 0;
  for (const leafId of leafIds) {
    const leaf = def.leaves.find((l) => l.id === leafId);
    if (!leaf) continue;
    const score = scores.find((s) => s.leafId === leafId);
    const correct = score?.correct ?? 0;
    const wrong = score?.wrong ?? 0;
    net += correct - wrong / 4;
  }
  return net;
}

function entryMatchesSubject(entry: DenemeEntry, sources: SubjectDenemeSource[]): boolean {
  return sources.some((src) => src.typeId === entry.typeId);
}

function netForSubjectEntry(entry: DenemeEntry, sources: SubjectDenemeSource[]): number | null {
  const src = sources.find((s) => s.typeId === entry.typeId);
  if (!src) return null;
  return netFromScores(entry.typeId, entry.scores, src.leafIds);
}

/** Average of last N matching denemes (newest first). null if none. */
export function averageSubjectDenemeNet(
  subjectId: string,
  denemes: DenemeEntry[],
  lastN: number = LAST_N,
): number | null {
  const sources = SUBJECT_DENEME_SOURCES[subjectId];
  if (!sources?.length) return null;

  const matched = denemes
    .filter((entry) => entryMatchesSubject(entry, sources))
    .sort((a, b) => {
      if (a.denemeDate !== b.denemeDate) return a.denemeDate < b.denemeDate ? 1 : -1;
      return a.createdAt < b.createdAt ? 1 : -1;
    })
    .slice(0, lastN);

  if (matched.length === 0) return null;

  let sum = 0;
  let count = 0;
  for (const entry of matched) {
    const net = netForSubjectEntry(entry, sources);
    if (net == null) continue;
    sum += net;
    count += 1;
  }
  if (count === 0) return null;
  return sum / count;
}
