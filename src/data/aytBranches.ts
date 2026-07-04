export type Alan = 'SAY' | 'EA' | 'SÖZ' | 'DİL';

export const AYT_BRANCHES: Record<Alan, readonly string[]> = {
  SAY: ['Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji'],
  EA: ['Matematik', 'Geometri', 'Edebiyat', 'Tarih', 'Coğrafya'],
  SÖZ: ['Edebiyat', 'Tarih', 'Coğrafya', 'Felsefe Grubu', 'Din'],
  DİL: ['Dil'],
};

export function isAlan(value: string): value is Alan {
  return value in AYT_BRANCHES;
}

export function getAytBranches(alan: string): readonly string[] {
  return isAlan(alan) ? AYT_BRANCHES[alan] : [];
}

export function branchFieldId(prefix: string, branch: string): string {
  return `${prefix}-${branch.replace(/\s+/g, '-')}`;
}
