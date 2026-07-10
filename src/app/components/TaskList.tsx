import styled from 'styled-components';
import { Check } from 'lucide-react';
import type { StudentTask } from '../types';

type TaskListProps = {
  tasks: StudentTask[];
  onToggle: (taskId: string) => void;
};

const TaskStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TaskRow = styled.label<{ $completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(66, 165, 245, 0.2);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: rgba(66, 165, 245, 0.4);
    background: rgba(255, 255, 255, 0.06);
  }
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
  border-radius: 7px;
  border: 1px solid
    ${({ $checked }) => ($checked ? 'rgba(66, 165, 245, 0.8)' : 'rgba(66, 165, 245, 0.35)')};
  background: ${({ $checked }) =>
    $checked ? 'rgba(33, 150, 243, 0.35)' : 'rgba(255, 255, 255, 0.04)'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: background 0.2s ease, border-color 0.2s ease;
`;

const TaskLabel = styled.span<{ $completed: boolean }>`
  font-size: 0.95rem;
  line-height: 1.4;
  color: ${({ $completed }) =>
    $completed ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.9)'};
  text-decoration: ${({ $completed }) => ($completed ? 'line-through' : 'none')};
`;

const EmptyState = styled.p`
  margin: 0;
  padding: 12px 4px;
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.45);
`;

export function TaskList({ tasks, onToggle }: TaskListProps) {
  if (tasks.length === 0) {
    return <EmptyState>Bu gün için görev yok.</EmptyState>;
  }

  return (
    <TaskStack>
      {tasks.map((task) => (
        <TaskRow key={task.id} $completed={task.completed}>
          <HiddenCheckbox
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id)}
          />
          <CheckboxVisual $checked={task.completed}>
            {task.completed ? <Check size={14} strokeWidth={3} /> : null}
          </CheckboxVisual>
          <TaskLabel $completed={task.completed}>{task.label}</TaskLabel>
        </TaskRow>
      ))}
    </TaskStack>
  );
}
