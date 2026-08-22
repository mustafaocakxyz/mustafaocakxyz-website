import { supabase } from './supabase';

export type PasswordResetRequestResult = {
  ok: boolean;
  message?: string;
  error?: string;
};

export async function requestPasswordReset(input: {
  loginUsername: string;
  note?: string;
}): Promise<PasswordResetRequestResult> {
  const { data, error } = await supabase.rpc('request_password_reset', {
    p_login_username: input.loginUsername.trim(),
    p_note: input.note?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || 'Talep gönderilemedi.');
  }

  const result = (data ?? {}) as PasswordResetRequestResult;
  if (!result.ok) {
    throw new Error(result.error || 'Talep gönderilemedi.');
  }

  return result;
}
