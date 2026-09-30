import { supabase } from '../../lib/supabase';
import { normalizeStoredAnswers, type AssistantTestAnswers } from './session';

export type AssistantTestListItem = {
  id: string;
  firstName: string;
  lastName: string;
  startedAt: string;
  updatedAt: string;
  submittedAt: string;
};

export type AssistantTestDetail = {
  id: string;
  firstName: string;
  lastName: string;
  answers: AssistantTestAnswers;
  startedAt: string;
  updatedAt: string;
  submittedAt: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export async function fetchSubmittedAssistantTests(): Promise<AssistantTestListItem[]> {
  const { data, error } = await supabase.rpc('assistant_test_admin_list');
  if (error) throw error;

  const payload = asRecord(data);
  if (!payload || payload.ok !== true) {
    throw new Error(readString(payload?.error) || 'Liste alınamadı.');
  }

  const rows = Array.isArray(payload.submissions) ? payload.submissions : [];
  return rows.flatMap((row) => {
    const record = asRecord(row);
    if (!record || typeof record.submitted_at !== 'string' || typeof record.id !== 'string') {
      return [];
    }
    return [
      {
        id: record.id,
        firstName: readString(record.first_name),
        lastName: readString(record.last_name),
        startedAt: readString(record.started_at),
        updatedAt: readString(record.updated_at),
        submittedAt: record.submitted_at,
      },
    ];
  });
}

export async function fetchAssistantTestDetail(id: string): Promise<AssistantTestDetail> {
  const { data, error } = await supabase.rpc('assistant_test_admin_get', { p_id: id });
  if (error) throw error;

  const payload = asRecord(data);
  if (!payload || payload.ok !== true || typeof payload.id !== 'string') {
    throw new Error(readString(payload?.error) || 'Kayıt alınamadı.');
  }

  return {
    id: payload.id,
    firstName: readString(payload.firstName),
    lastName: readString(payload.lastName),
    answers: normalizeStoredAnswers(payload.answers),
    startedAt: readString(payload.startedAt),
    updatedAt: readString(payload.updatedAt),
    submittedAt: typeof payload.submittedAt === 'string' ? payload.submittedAt : null,
  };
}
