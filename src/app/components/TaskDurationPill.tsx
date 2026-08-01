import styled from 'styled-components';
import { preview as t } from '../preview/adminPreviewTheme';

/** Duration badge for daily tasks. */
export const TaskDurationPill = styled.span<{ $muted?: boolean }>`
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid ${t.border};
  background: rgba(59, 130, 246, 0.12);
  color: ${({ $muted }) =>
    $muted ? 'rgba(191, 219, 254, 0.55)' : 'rgba(191, 219, 254, 0.95)'};
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
`;
