import styled from 'styled-components';
import { Check } from 'lucide-react';
import type { StudentTask } from '../types';
import { preview as t } from '../preview/adminPreviewTheme';
import { TaskDurationPill } from './TaskDurationPill';

export type TaskListAccent = 'blue' | 'orange';

type TaskListProps = {
  tasks: StudentTask[];
  onToggle?: (taskId: string) => void;
  readOnly?: boolean;
  /** Public /ogrenciler uses orange; admin/student app stays blue. */
  accent?: TaskListAccent;
};

const accents = {
  blue: {
    rowBorder: t.border,
    rowBg: t.panel2,
    rowHoverBorder: t.borderStrong,
    rowHoverBg: 'rgba(30, 41, 59, 0.92)',
    checkBorder: 'rgba(96, 165, 250, 0.7)',
    checkBg: 'rgba(59, 130, 246, 0.28)',
    checkIdleBorder: t.borderStrong,
    checkIdleBg: 'rgba(15, 23, 42, 0.5)',
    label: t.text,
    labelMuted: t.mutedSoft,
    badgeBorder: t.border,
    badgeBg: 'rgba(15, 23, 42, 0.45)',
    badgeColor: t.muted,
    empty: t.muted,
  },
  orange: {
    rowBorder: 'rgba(255, 138, 101, 0.35)',
    rowBg: 'rgba(255, 255, 255, 0.08)',
    rowHoverBorder: 'rgba(255, 138, 101, 0.55)',
    rowHoverBg: 'rgba(255, 138, 101, 0.12)',
    checkBorder: 'rgba(255, 171, 145, 0.85)',
    checkBg: 'rgba(244, 81, 30, 0.35)',
    checkIdleBorder: 'rgba(255, 171, 145, 0.45)',
    checkIdleBg: 'rgba(191, 54, 12, 0.28)',
    label: 'rgba(255, 255, 255, 0.92)',
    labelMuted: 'rgba(255, 204, 188, 0.65)',
    badgeBorder: 'rgba(255, 255, 255, 0.22)',
    badgeBg: 'rgba(255, 255, 255, 0.1)',
    badgeColor: 'rgba(255, 204, 188, 0.9)',
    empty: 'rgba(255, 255, 255, 0.55)',
  },
} as const;

const TaskStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TaskRow = styled.label<{
  $completed: boolean;
  $readOnly?: boolean;
  $accent: TaskListAccent;
}>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${({ $accent }) => accents[$accent].rowBorder};
  background: ${({ $accent }) => accents[$accent].rowBg};
  cursor: ${({ $readOnly }) => ($readOnly ? 'default' : 'pointer')};
  opacity: ${({ $completed }) => ($completed ? 0.72 : 1)};
  transition: border-color 0.15s ease, background 0.15s ease;

  ${({ $readOnly, $accent }) =>
    !$readOnly &&
    `
    &:hover {
      border-color: ${accents[$accent].rowHoverBorder};
      background: ${accents[$accent].rowHoverBg};
    }
  `}
`;

const HiddenCheckbox = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

const CheckboxVisual = styled.span<{ $checked: boolean; $accent: TaskListAccent }>`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid
    ${({ $checked, $accent }) =>
      $checked ? accents[$accent].checkBorder : accents[$accent].checkIdleBorder};
  background: ${({ $checked, $accent }) =>
    $checked ? accents[$accent].checkBg : accents[$accent].checkIdleBg};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ $accent }) => accents[$accent].label};
`;

const TaskLabel = styled.span<{ $completed: boolean; $accent: TaskListAccent }>`
  flex: 1;
  min-width: 0;
  font-size: 0.94rem;
  line-height: 1.4;
  color: ${({ $completed, $accent }) =>
    $completed ? accents[$accent].labelMuted : accents[$accent].label};
  text-decoration: ${({ $completed }) => ($completed ? 'line-through' : 'none')};
`;

const TopicLinkBadge = styled.span<{ $accent: TaskListAccent }>`
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid ${({ $accent }) => accents[$accent].badgeBorder};
  background: ${({ $accent }) => accents[$accent].badgeBg};
  color: ${({ $accent }) => accents[$accent].badgeColor};
  font-size: 0.72rem;
  font-weight: 700;
`;

const EmptyState = styled.p<{ $accent: TaskListAccent }>`
  margin: 0;
  padding: 12px 4px;
  font-size: 0.9rem;
  color: ${({ $accent }) => accents[$accent].empty};
`;

export function TaskList({
  tasks,
  onToggle,
  readOnly = false,
  accent = 'blue',
}: TaskListProps) {
  if (tasks.length === 0) {
    return <EmptyState $accent={accent}>Bu gün için görev yok.</EmptyState>;
  }

  return (
    <TaskStack>
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          $completed={task.completed}
          $readOnly={readOnly}
          $accent={accent}
        >
          <HiddenCheckbox
            type="checkbox"
            checked={task.completed}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={() => {
              if (!readOnly && onToggle) onToggle(task.id);
            }}
          />
          <CheckboxVisual $checked={task.completed} $accent={accent}>
            {task.completed ? <Check size={14} strokeWidth={3} /> : null}
          </CheckboxVisual>
          <TaskLabel $completed={task.completed} $accent={accent}>
            {task.label}
          </TaskLabel>
          {(task.topicLinks?.length ?? 0) > 0 ? (
            <TopicLinkBadge $accent={accent}>{task.topicLinks!.length} konu</TopicLinkBadge>
          ) : null}
          {task.durationLabel ? (
            <TaskDurationPill $muted={task.completed} $accent={accent}>
              {task.durationLabel}
            </TaskDurationPill>
          ) : null}
        </TaskRow>
      ))}
    </TaskStack>
  );
}
