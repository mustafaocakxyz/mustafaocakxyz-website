import styled from 'styled-components';
import { preview as t } from '../preview/adminPreviewTheme';

type TaskDurationAccent = 'blue' | 'orange';

const durationAccents = {
  blue: {
    border: t.border,
    background: 'rgba(59, 130, 246, 0.12)',
    color: 'rgba(191, 219, 254, 0.95)',
    muted: 'rgba(191, 219, 254, 0.55)',
  },
  orange: {
    border: 'rgba(255, 171, 145, 0.45)',
    background: 'rgba(244, 81, 30, 0.22)',
    color: 'rgba(255, 204, 188, 0.98)',
    muted: 'rgba(255, 204, 188, 0.55)',
  },
} as const;

/** Duration badge for daily tasks. */
export const TaskDurationPill = styled.span<{
  $muted?: boolean;
  $accent?: TaskDurationAccent;
}>`
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid
    ${({ $accent = 'blue' }) => durationAccents[$accent].border};
  background: ${({ $accent = 'blue' }) => durationAccents[$accent].background};
  color: ${({ $muted, $accent = 'blue' }) =>
    $muted ? durationAccents[$accent].muted : durationAccents[$accent].color};
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
`;
