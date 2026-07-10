import { toDateKey } from '../utils/dates';

export type StudentTask = {
  id: string;
  label: string;
  completed: boolean;
};

export type DailySubmission = {
  uykuUyanma: string;
  gunlukCalisma: string;
  ekranSuresi: string;
  notlar: string;
};

const emptySubmission = (): DailySubmission => ({
  uykuUyanma: '',
  gunlukCalisma: '',
  ekranSuresi: '',
  notlar: '',
});

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

type MockStudentStoreOptions = {
  studentId?: string;
  taskTemplates?: string[];
};

export function createMockStudentStore(options: MockStudentStoreOptions = {}) {
  const studentId = options.studentId ?? 'student';
  const templates = options.taskTemplates ?? DEFAULT_TASK_TEMPLATES;
  const tasksByDate: Record<string, StudentTask[]> = {};
  const submissionsByDate: Record<string, DailySubmission> = {};

  const today = new Date();
  for (let offset = -1; offset <= 5; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const dateKey = toDateKey(date);
    tasksByDate[dateKey] = createInitialTasks(dateKey, studentId, templates);
    submissionsByDate[dateKey] = emptySubmission();
  }

  return { tasksByDate, submissionsByDate };
}

export const emptyDailySubmission = emptySubmission;
