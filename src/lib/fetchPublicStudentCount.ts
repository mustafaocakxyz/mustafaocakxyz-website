import { supabase } from './supabase';

/** Students visible on public /ogrenciler (is_active + show_on_ogrenciler). */
export async function fetchPublicActiveStudentCount(): Promise<number> {
  const { data, error } = await supabase.rpc('public_active_student_count');

  if (error) throw error;

  const count = typeof data === 'number' ? data : Number(data);
  const raw = Number.isFinite(count) ? count : 0;
  return Math.max(0, raw);
}
