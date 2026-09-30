import { createClient } from '@supabase/supabase-js';
import {
  emptyAnswers,
  normalizeStoredAnswers,
  type AssistantTestAnswers,
  type AssistantTestSession,
} from './session';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

/** Anon role only, so a signed-in student or admin session cannot be used here. */
const applicantDb = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export type ApplicantResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; missing?: boolean };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function transportMessage(error: { message?: string } | null, fallback: string) {
  const message = error?.message ?? '';
  if (/failed to fetch|network|load failed|networkerror/i.test(message)) {
    return 'Bağlantı kurulamadı. Biraz sonra tekrar dene.';
  }
  return fallback;
}

function fromPayload<T>(
  data: unknown,
  error: { message?: string } | null,
  fallback: string,
  read: (payload: Record<string, unknown>) => T | null,
): ApplicantResult<T> {
  if (error) return { ok: false, error: transportMessage(error, fallback) };
  const payload = asRecord(data);
  if (!payload || payload.ok !== true) {
    const message = readString(payload?.error) || fallback;
    return { ok: false, error: message, missing: message.includes('bulunamadı') };
  }
  const value = read(payload);
  if (!value) return { ok: false, error: fallback };
  return { ok: true, data: value };
}

export async function startAssistantTest(
  firstName: string,
  lastName: string,
): Promise<ApplicantResult<AssistantTestSession>> {
  const { data, error } = await applicantDb.rpc('assistant_test_start', {
    p_first_name: firstName.trim(),
    p_last_name: lastName.trim(),
  });

  return fromPayload(data, error, 'Değerlendirme başlatılamadı.', (payload) => {
    if (typeof payload.id !== 'string' || typeof payload.accessToken !== 'string') return null;
    const startedAt = readString(payload.startedAt) || new Date().toISOString();
    return {
      id: payload.id,
      accessToken: payload.accessToken,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      startedAt,
      updatedAt: startedAt,
      submittedAt: null,
      answers: emptyAnswers(),
    };
  });
}

export async function loadAssistantTest(
  id: string,
  accessToken: string,
): Promise<ApplicantResult<AssistantTestSession>> {
  const { data, error } = await applicantDb.rpc('assistant_test_load', {
    p_id: id,
    p_access_token: accessToken,
  });

  return fromPayload(data, error, 'Kayıtlı değerlendirme açılamadı.', (payload) => ({
    id,
    accessToken,
    firstName: readString(payload.firstName),
    lastName: readString(payload.lastName),
    answers: normalizeStoredAnswers(payload.answers),
    startedAt: readString(payload.startedAt),
    updatedAt: readString(payload.updatedAt),
    submittedAt: typeof payload.submittedAt === 'string' ? payload.submittedAt : null,
  }));
}

export async function saveAssistantTest(
  session: Pick<AssistantTestSession, 'id' | 'accessToken' | 'answers'>,
): Promise<ApplicantResult<{ updatedAt: string }>> {
  const { data, error } = await applicantDb.rpc('assistant_test_save', {
    p_id: session.id,
    p_access_token: session.accessToken,
    p_answers: session.answers satisfies AssistantTestAnswers,
  });

  return fromPayload(data, error, 'Yanıtlar kaydedilemedi.', (payload) => ({
    updatedAt: readString(payload.updatedAt),
  }));
}

export async function submitAssistantTest(
  session: Pick<AssistantTestSession, 'id' | 'accessToken' | 'answers'>,
): Promise<ApplicantResult<{ submittedAt: string }>> {
  const { data, error } = await applicantDb.rpc('assistant_test_submit', {
    p_id: session.id,
    p_access_token: session.accessToken,
    p_answers: session.answers,
  });

  return fromPayload(data, error, 'Yanıtlar gönderilemedi.', (payload) => {
    if (typeof payload.submittedAt !== 'string') return null;
    return { submittedAt: payload.submittedAt };
  });
}

export function flushAssistantTestSave(
  session: Pick<AssistantTestSession, 'id' | 'accessToken' | 'answers'>,
) {
  void fetch(`${url}/rest/v1/rpc/assistant_test_save`, {
    method: 'POST',
    keepalive: true,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_id: session.id,
      p_access_token: session.accessToken,
      p_answers: session.answers,
    }),
  });
}
