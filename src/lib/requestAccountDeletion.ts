import { supabase } from './supabase';

export type AccountDeletionResult = {
  ok: boolean;
  message?: string;
  error?: string;
};

export async function requestAccountDeletion(input: {
  loginUsername: string;
  contactEmail?: string;
  note?: string;
}): Promise<AccountDeletionResult> {
  const { data, error } = await supabase.rpc('request_account_deletion', {
    p_login_username: input.loginUsername.trim(),
    p_contact_email: input.contactEmail?.trim() || null,
    p_note: input.note?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || 'Talep gönderilemedi.');
  }

  const result = (data ?? {}) as AccountDeletionResult;
  if (!result.ok) {
    throw new Error(result.error || 'Talep gönderilemedi.');
  }

  return result;
}
