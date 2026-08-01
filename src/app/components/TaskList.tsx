import styled from 'styled-components';
import { Check } from 'lucide-react';
import type { StudentTask } from '../types';
import { preview as t } from '../preview/adminPreviewTheme';
import { TaskDurationPill } from './TaskDurationPill';

type TaskListProps = {
  tasks: StudentTask[];
  onToggle?: (taskId: string) => void;
  readOnly?: boolean;
};

const TaskStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TaskRow = styled.label<{ $completed: boolean; $readOnly?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  cursor: ${({ $readOnly }) => ($readOnly ? 'default' : 'pointer')};
  opacity: ${({ $completed }) => ($completed ? 0.72 : 1)};
  transition: border-color 0.15s ease, background 0.15s ease;

  ${({ $readOnly }) =>
    !$readOnly &&
    `
    &:hover {
      border-color: ${t.borderStrong};
      background: rgba(30, 41, 59, 0.92);
    }
  `}
`;

const HiddenCheckbox = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

const CheckboxVisual = styled.span<{ $checked: boolean }>`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid
    ${({ $checked }) => ($checked ? 'rgba(96, 165, 250, 0.7)' : t.borderStrong)};
  background: ${({ $checked }) =>
    $checked ? 'rgba(59, 130, 246, 0.28)' : 'rgba(15, 23, 42, 0.5)'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${t.text};
`;

const TaskLabel = styled.span<{ $completed: boolean }>`
  flex: 1;
  min-width: 0;
  font-size: 0.94rem;
  line-height: 1.4;
  color: ${({ $completed }) => ($completed ? t.mutedSoft : t.text)};
  text-decoration: ${({ $completed }) => ($completed ? 'line-through' : 'none')};
`;

const EmptyState = styled.p`
  margin: 0;
  padding: 12px 4px;
  font-size: 0.9rem;
  color: ${t.muted};
`;

export function TaskList({ tasks, onToggle, readOnly = false }: TaskListProps) {
  if (tasks.length === 0) {
    return <EmptyState>Bu gün için görev yok.</EmptyState>;
  }

  return (
    <TaskStack>
      {tasks.map((task) => (
        <TaskRow key={task.id} $completed={task.completed} $readOnly={readOnly}>
          <HiddenCheckbox
            type="checkbox"
            checked={task.completed}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={() => {
              if (!readOnly && onToggle) onToggle(task.id);
            }}
          />
          <CheckboxVisual $checked={task.completed}>
            {task.completed ? <Check size={14} strokeWidth={3} /> : null}
          </CheckboxVisual>
          <TaskLabel $completed={task.completed}>{task.label}</TaskLabel>
          {task.durationLabel ? (
            <TaskDurationPill $muted={task.completed}>{task.durationLabel}</TaskDurationPill>
          ) : null}
        </TaskRow>
      ))}
    </TaskStack>
  );
}
