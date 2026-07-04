export const TYT_BRANCHES = [
  'Türkçe',
  'Sosyal',
  'Matematik',
  'Geometri',
  'Fen',
] as const;

export type TytBranch = (typeof TYT_BRANCHES)[number];

export function getTytBranches(): readonly TytBranch[] {
  return TYT_BRANCHES;
}
