import styled from 'styled-components';

/** Orange duration badge for daily tasks. */
export const TaskDurationPill = styled.span<{ $muted?: boolean }>`
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 138, 101, 0.5);
  background: rgba(230, 74, 25, 0.22);
  color: ${({ $muted }) =>
    $muted ? 'rgba(255, 204, 188, 0.55)' : 'rgba(255, 204, 188, 0.98)'};
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
`;
