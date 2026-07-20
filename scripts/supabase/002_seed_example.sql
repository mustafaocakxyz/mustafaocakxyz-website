-- =============================================================================
-- Example seed — run AFTER 001_schema.sql
--
-- IMPORTANT: auth.users rows must be created in Supabase Auth first.
-- Dashboard → Authentication → Users → Add user → Create new user
--
-- Suggested users (passwords are examples — change in production):
--   admin@gelisim.mustafaocak.xyz     / admin123
--   ogrenci@gelisim.mustafaocak.xyz   / ogrenci123
--
-- After creating auth users, copy their UUIDs and replace the placeholders below.
-- =============================================================================

insert into public.organizations (id, name, slug)
values (
  '00000000-0000-4000-8000-000000000001',
  'Gelişim Programı',
  'gelisim'
)
on conflict (slug) do nothing;

-- Admin user
insert into public.profiles (
  id,
  organization_id,
  role,
  display_name,
  login_username,
  auth_email
)
values (
  '94fdb045-d832-44db-b817-fdf18ba967f7',
  '00000000-0000-4000-8000-000000000001',
  'admin',
  'Mustafa Ocak',
  'admin',
  'admin@gelisim.mustafaocak.xyz'
)
on conflict (id) do nothing;

-- Student user
insert into public.profiles (
  id,
  organization_id,
  role,
  display_name,
  login_username,
  auth_email
)
values (
  'a3a63cf9-25e8-4a30-bc9d-93a696280147',
  '00000000-0000-4000-8000-000000000001',
  'student',
  'Ayşe Yılmaz',
  'ogrenci',
  'ogrenci@gelisim.mustafaocak.xyz'
)
on conflict (id) do nothing;

-- Sample tasks for today (student)
insert into public.daily_tasks (organization_id, student_id, task_date, label, completed, sort_order)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'a3a63cf9-25e8-4a30-bc9d-93a696280147',
    current_date,
    'Matematik tekrar seti',
    true,
    0
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    'a3a63cf9-25e8-4a30-bc9d-93a696280147',
    current_date,
    'Fizik konu özeti',
    false,
    1
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    'a3a63cf9-25e8-4a30-bc9d-93a696280147',
    current_date,
    'Deneme analizi',
    false,
    2
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    'a3a63cf9-25e8-4a30-bc9d-93a696280147',
    current_date,
    'Paragraf çalışması',
    false,
    3
  );

insert into public.daily_submissions (
  organization_id,
  student_id,
  submission_date,
  uyku_uyanma,
  gunluk_calisma,
  ekran_suresi,
  uyuma_saati,
  uyanma_saati,
  gunluk_calisma_saat,
  ekran_suresi_saat,
  notlar
)
values (
  '00000000-0000-4000-8000-000000000001',
  'a3a63cf9-25e8-4a30-bc9d-93a696280147',
  current_date,
  '23:30 - 07:00',
  '5 saat',
  '1.5 saat',
  '23:30'::time,
  '07:00'::time,
  5,
  1.5,
  'Fizik tekrarında integral konusuna odaklandım.'
)
on conflict (student_id, submission_date) do update
set
  uyku_uyanma = excluded.uyku_uyanma,
  gunluk_calisma = excluded.gunluk_calisma,
  ekran_suresi = excluded.ekran_suresi,
  uyuma_saati = excluded.uyuma_saati,
  uyanma_saati = excluded.uyanma_saati,
  gunluk_calisma_saat = excluded.gunluk_calisma_saat,
  ekran_suresi_saat = excluded.ekran_suresi_saat,
  notlar = excluded.notlar;
