import { supabase } from './supabase';

/** Active students in the Gelişim org — same filter as the admin dashboard list. */
export async function fetchPublicActiveStudentCount(): Promise<number> {
  const { data, error } = await supabase.rpc('public_active_student_count');

  if (error) throw error;

  const count = typeof data === 'number' ? data : Number(data);
  return Number.isFinite(count) ? count : 0;
}
