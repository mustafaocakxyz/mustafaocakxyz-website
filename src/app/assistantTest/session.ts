import {
  CONTROL_QUESTIONS,
  HABIT_QUESTIONS,
  PROGRAM_STUDENTS,
  SPECIAL_QUESTIONS,
  YKS_QUESTIONS,
  type SectionId,
} from './content';

const STORAGE_KEY = 'mo-assistant-test-session-v1';

export type SectionStatus = 'untouched' | 'progress' | 'complete';

export type PlannedTask = {
  id: string;
  label: string;
};

export type TextAnswers = Record<string, string>;

export type AssistantTestAnswers = {
  yks: TextAnswers;
  habits: TextAnswers;
  control: TextAnswers;
  special: TextAnswers;
  program: Record<string, PlannedTask[]>;
};

export type AssistantTestSession = {
  id: string;
  accessToken: string;
  firstName: string;
  lastName: string;
  startedAt: string;
  updatedAt: string;
  submittedAt: string | null;
  answers: AssistantTestAnswers;
};

export function normalizeStoredAnswers(raw: unknown): AssistantTestAnswers {
  if (!isRecord(raw)) return emptyAnswers();
  return {
    yks: readTextBag(raw.yks),
    habits: readTextBag(raw.habits),
    control: readTextBag(raw.control),
    special: readTextBag(raw.special),
    program: readProgram(raw.program),
  };
}

export function emptyAnswers(): AssistantTestAnswers {
  return {
    yks: {},
    habits: {},
    control: {},
    special: {},
    program: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readTextBag(value: unknown): TextAnswers {
  if (!isRecord(value)) return {};
  const bag: TextAnswers = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') bag[key] = entry;
  }
  return bag;
}

function readProgram(value: unknown): Record<string, PlannedTask[]> {
  if (!isRecord(value)) return {};
  const program: Record<string, PlannedTask[]> = {};
  for (const [studentId, tasks] of Object.entries(value)) {
    if (!Array.isArray(tasks)) continue;
    program[studentId] = tasks.flatMap((task) => {
      if (!isRecord(task) || typeof task.id !== 'string' || typeof task.label !== 'string') {
        return [];
      }
      return [{ id: task.id, label: task.label }];
    });
  }
  return program;
}

export function loadSession(): AssistantTestSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (typeof parsed.id !== 'string' || typeof parsed.accessToken !== 'string') return null;
    if (!parsed.accessToken) return null;
    if (typeof parsed.firstName !== 'string' || typeof parsed.lastName !== 'string') return null;
    if (!isRecord(parsed.answers)) return null;

    return {
      id: parsed.id,
      accessToken: parsed.accessToken,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : new Date().toISOString(),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      submittedAt: typeof parsed.submittedAt === 'string' ? parsed.submittedAt : null,
      answers: {
        yks: readTextBag(parsed.answers.yks),
        habits: readTextBag(parsed.answers.habits),
        control: readTextBag(parsed.answers.control),
        special: readTextBag(parsed.answers.special),
        program: readProgram(parsed.answers.program),
      },
    };
  } catch {
    return null;
  }
}

export function saveSession(session: AssistantTestSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

function filled(value: string | undefined) {
  return Boolean(value?.trim());
}

function textStatus(questions: { id: string }[], bag: TextAnswers): SectionStatus {
  const done = questions.filter((question) => filled(bag[question.id])).length;
  if (done === 0) return 'untouched';
  if (done === questions.length) return 'complete';
  return 'progress';
}

export function programRows(stored: PlannedTask[] | undefined): PlannedTask[] {
  return (stored ?? []).filter((task) => task.label.trim());
}

function programStatus(program: Record<string, PlannedTask[]>): SectionStatus {
  const done = PROGRAM_STUDENTS.filter((student) =>
    (program[student.id] ?? []).some((task) => filled(task.label)),
  ).length;
  if (done === 0) return 'untouched';
  if (done === PROGRAM_STUDENTS.length) return 'complete';
  return 'progress';
}

export function sectionStatus(
  sectionId: SectionId,
  answers: AssistantTestAnswers,
): SectionStatus {
  if (sectionId === 'yks') return textStatus(YKS_QUESTIONS, answers.yks);
  if (sectionId === 'habits') return textStatus(HABIT_QUESTIONS, answers.habits);
  if (sectionId === 'control') return textStatus(CONTROL_QUESTIONS, answers.control);
  if (sectionId === 'special') return textStatus(SPECIAL_QUESTIONS, answers.special);
  return programStatus(answers.program);
}

export function sectionStatuses(answers: AssistantTestAnswers): Record<SectionId, SectionStatus> {
  return {
    yks: sectionStatus('yks', answers),
    habits: sectionStatus('habits', answers),
    program: sectionStatus('program', answers),
    control: sectionStatus('control', answers),
    special: sectionStatus('special', answers),
  };
}

export const STATUS_LABEL: Record<SectionStatus, string> = {
  untouched: 'Boş',
  progress: 'Devam',
  complete: 'Tamam',
};
