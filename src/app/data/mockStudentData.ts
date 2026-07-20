import { toDateKey } from '../utils/dates';
import type { DailySubmission, StudentTask } from '../types';
import { emptyDailySubmission } from '../types';

const DEFAULT_TASK_TEMPLATES = [
  'Matematik tekrar seti',
  'Fizik konu özeti',
  'Deneme analizi',
  'Paragraf çalışması',
];

function createInitialTasks(
  dateKey: string,
  studentId: string,
  templates: string[],
): StudentTask[] {
  return templates.map((label, index) => ({
    id: `${studentId}-${dateKey}-task-${index}`,
    label,
    completed: index === 0 && dateKey === toDateKey(new Date()),
  }));
}

export function createMockStudentStore(options: {
  studentId: string;
  taskTemplates?: string[];
}) {
  const templates = options.taskTemplates ?? DEFAULT_TASK_TEMPLATES;
  const today = new Date();
  const tasksByDate: Record<string, StudentTask[]> = {};
  const submissionsByDate: Record<string, DailySubmission> = {};

  for (let offset = -1; offset <= 5; offset += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() + offset);
    const dateKey = toDateKey(day);
    tasksByDate[dateKey] = createInitialTasks(dateKey, options.studentId, templates);
  }

  return { tasksByDate, submissionsByDate };
}

export { emptyDailySubmission };
export type { DailySubmission, StudentTask };
