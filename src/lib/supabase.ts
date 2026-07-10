import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type DbProfile = {
  id: string;
  organization_id: string;
  role: 'admin' | 'student';
  display_name: string;
  login_username: string;
  auth_email: string;
  is_active: boolean;
};

export type DbDailyTask = {
  id: string;
  student_id: string;
  task_date: string;
  label: string;
  completed: boolean;
  sort_order: number;
};

export type DbDailySubmission = {
  id: string;
  student_id: string;
  submission_date: string;
  uyku_uyanma: string;
  gunluk_calisma: string;
  ekran_suresi: string;
  notlar: string;
};
