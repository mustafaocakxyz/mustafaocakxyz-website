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
  show_on_admin_dashboard?: boolean;
  show_on_ogrenciler?: boolean;
  show_in_admin_chat?: boolean;
  count_in_earnings?: boolean;
  earnings_contribution?: number;
  day_count_active?: boolean;
  day_count_frozen_days?: number | null;
  day_count_start_date?: string | null;
  created_at?: string;
};

export type DbDailyTask = {
  id: string;
  student_id: string;
  task_date: string;
  label: string;
  duration_label?: string;
  completed: boolean;
  sort_order: number;
  topic_links?: unknown;
};

export type DbDailySubmission = {
  id: string;
  student_id: string;
  submission_date: string;
  uyku_uyanma: string;
  gunluk_calisma: string;
  ekran_suresi: string;
  uyuma_saati: string | null;
  uyanma_saati: string | null;
  gunluk_calisma_saat: number | null;
  ekran_suresi_saat: number | null;
  notlar: string;
};

export type DbDailyAdminNote = {
  id: string;
  student_id: string;
  note_date: string;
  body: string;
};

export type DbStudentMeeting = {
  id: string;
  student_id: string;
  meeting_date: string;
  meeting_time: string;
  meeting_link: string;
};

export type DbChatThread = {
  id: string;
  organization_id: string;
  student_id: string;
  last_message_at: string | null;
  last_message_preview?: string | null;
  last_message_type?: 'text' | 'image' | 'document' | 'voice' | 'system' | null;
  last_sender_id?: string | null;
  admin_last_read_at?: string | null;
  admin_unread_count?: number;
  created_at: string;
  updated_at: string;
};

export type DbChatMessage = {
  id: string;
  organization_id: string;
  thread_id: string;
  sender_id: string | null;
  body: string;
  message_type: 'text' | 'image' | 'document' | 'voice' | 'system';
  attachment_path: string | null;
  created_at: string;
};

export type DbDenemeLeafScore = {
  leafId: string;
  correct: number;
  wrong: number;
  empty?: number;
};

export type DbDenemeEntry = {
  id: string;
  organization_id: string;
  student_id: string;
  deneme_date: string;
  name: string;
  duration: string;
  type_id: string;
  scores: DbDenemeLeafScore[] | unknown;
  topics: string[] | unknown;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DbCurriculumSubject = {
  id: string;
  label: string;
  sort_order: number;
};

export type DbCurriculumSubjectTopic = {
  id: string;
  subject_id: string;
  label: string;
  sort_order: number;
};

export type DbCurriculumMaterial = {
  id: string;
  subject_id: string;
  label: string;
  sort_order: number;
};

export type DbCurriculumMaterialTopic = {
  id: string;
  material_id: string;
  label: string;
  sort_order: number;
};

export type DbStudentSubject = {
  id: string;
  student_id: string;
  subject_id: string;
};

export type DbStudentMaterial = {
  id: string;
  student_id: string;
  material_id: string;
};

export type DbSubjectTopicProgress = {
  id: string;
  student_id: string;
  subject_id: string;
  topic_id: string;
  status: string;
};

export type DbMaterialTopicProgress = {
  id: string;
  student_id: string;
  material_id: string;
  topic_id: string;
  status: string;
  correct_count: number | null;
  question_count: number | null;
};
