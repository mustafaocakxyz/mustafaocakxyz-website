import type { LucideIcon } from 'lucide-react';

export type ProgramItem = {
  text: string;
  subtext: string;
};

export type ProgramIconItem = ProgramItem & {
  icon: LucideIcon;
};
