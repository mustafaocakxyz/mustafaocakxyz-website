import { supabase } from './supabase';

export type AdminResetPasswordResult = {
  ok: boolean;
  error?: string;
};

export async function adminResetStudentPassword(input: {
  studentId: string;
  newPassword: string;
  requestId?: string | null;
}): Promise<AdminResetPasswordResult> {
  const { data, error } = await supabase.rpc('admin_reset_student_password', {
    p_student_id: input.studentId,
    p_new_password: input.newPassword,
    p_request_id: input.requestId ?? null,
  });

  if (error) {
    throw new Error(error.message || 'Şifre güncellenemedi.');
  }

  const result = (data ?? {}) as AdminResetPasswordResult;
  if (!result.ok) {
    throw new Error(result.error || 'Şifre güncellenemedi.');
  }

  return result;
}
