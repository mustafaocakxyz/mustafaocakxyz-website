import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import styled from 'styled-components';
import { getFormAccent } from '../../styles/formTheme';
import type { StudentTask } from '../types';

const accent = getFormAccent('blue');

type AdminEditableTaskListProps = {
  tasks: StudentTask[];
  onAdd: (label: string) => void;
  onEdit: (taskId: string, label: string) => void;
  onDelete: (taskId: string) => void;
};

const TaskStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TaskRow = styled.div<{ $completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(66, 165, 245, 0.2);
  background: rgba(255, 255, 255, 0.04);
`;

const StatusIndicator = styled.span<{ $checked: boolean }>`
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
`;

const TaskLabel = styled.span<{ $completed: boolean }>`
  flex: 1;
  min-width: 0;
  font-size: 0.95rem;
  line-height: 1.4;
  color: ${({ $completed }) =>
    $completed ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.9)'};
  text-decoration: ${({ $completed }) => ($completed ? 'line-through' : 'none')};
`;

const TaskInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid ${accent.inputBorderFocus};
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.92rem;
  font-family: inherit;
  outline: none;
`;

const IconButton = styled.button<{ $danger?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: 1px solid
    ${({ $danger }) =>
      $danger ? 'rgba(255, 138, 128, 0.35)' : 'rgba(66, 165, 245, 0.25)'};
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: ${({ $danger }) => ($danger ? '#ff8a80' : 'rgba(144, 202, 249, 0.95)')};
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: ${({ $danger }) =>
      $danger ? 'rgba(255, 138, 128, 0.6)' : 'rgba(66, 165, 245, 0.5)'};
    background: rgba(255, 255, 255, 0.08);
  }
`;

const AddRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 4px;
`;

const AddInput = styled.input`
  flex: 1;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid ${accent.inputBorder};
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.92rem;
  font-family: inherit;
  outline: none;

  &:focus {
    border-color: ${accent.inputBorderFocus};
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  border: none;
  border-radius: 14px;
  background: ${accent.buttonGradient};
  color: white;
  font-size: 0.88rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 6px 18px rgba(21, 101, 192, 0.25);

  &:hover {
    opacity: 0.95;
  }
`;

const EmptyState = styled.p`
  margin: 0;
  padding: 8px 4px 4px;
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.45);
`;

export function AdminEditableTaskList({
  tasks,
  onAdd,
  onEdit,
  onDelete,
}: AdminEditableTaskListProps) {
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  const startEditing = (task: StudentTask) => {
    setEditingTaskId(task.id);
    setEditingLabel(task.label);
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingLabel('');
  };

  const saveEditing = () => {
    if (!editingTaskId) return;
    const trimmed = editingLabel.trim();
    if (!trimmed) return;
    onEdit(editingTaskId, trimmed);
    cancelEditing();
  };

  const handleAdd = () => {
    const trimmed = newTaskLabel.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewTaskLabel('');
  };

  return (
    <>
      {tasks.length === 0 ? <EmptyState>Bu gün için görev yok.</EmptyState> : null}

      <TaskStack>
        {tasks.map((task) => {
          const isEditing = editingTaskId === task.id;

          return (
            <TaskRow key={task.id} $completed={task.completed}>
              <StatusIndicator $checked={task.completed}>
                {task.completed ? <Check size={14} strokeWidth={3} /> : null}
              </StatusIndicator>

              {isEditing ? (
                <TaskInput
                  value={editingLabel}
                  autoFocus
                  onChange={(event) => setEditingLabel(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') saveEditing();
                    if (event.key === 'Escape') cancelEditing();
                  }}
                />
              ) : (
                <TaskLabel $completed={task.completed}>{task.label}</TaskLabel>
              )}

              {isEditing ? (
                <>
                  <IconButton type="button" aria-label="Kaydet" onClick={saveEditing}>
                    <Check size={15} />
                  </IconButton>
                  <IconButton type="button" aria-label="İptal" onClick={cancelEditing}>
                    <X size={15} />
                  </IconButton>
                </>
              ) : (
                <>
                  <IconButton
                    type="button"
                    aria-label="Düzenle"
                    onClick={() => startEditing(task)}
                  >
                    <Pencil size={15} />
                  </IconButton>
                  <IconButton
                    type="button"
                    aria-label="Sil"
                    $danger
                    onClick={() => onDelete(task.id)}
                  >
                    <Trash2 size={15} />
                  </IconButton>
                </>
              )}
            </TaskRow>
          );
        })}
      </TaskStack>

      <AddRow>
        <AddInput
          placeholder="Yeni görev ekle..."
          value={newTaskLabel}
          onChange={(event) => setNewTaskLabel(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleAdd();
          }}
        />
        <AddButton type="button" onClick={handleAdd}>
          <Plus size={16} />
          Ekle
        </AddButton>
      </AddRow>
    </>
  );
}
