-- =============================================================================
-- OPTIONAL sample catalog — replace with your real subjects / materials.
-- Run after 024_curriculum.sql
-- =============================================================================

insert into public.curriculum_subjects (id, label, sort_order)
values ('tyt_matematik', 'TYT Matematik', 10)
on conflict (id) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.curriculum_subject_topics (id, subject_id, label, sort_order) values
  ('tyt_matematik__temel_kavramlar', 'tyt_matematik', 'Temel Kavramlar', 10),
  ('tyt_matematik__basamak', 'tyt_matematik', 'Basamak Kavramı', 20),
  ('tyt_matematik__oran_oranti', 'tyt_matematik', 'Oran Orantı', 30),
  ('tyt_matematik__sayi_problemleri', 'tyt_matematik', 'Sayı Problemleri', 40),
  ('tyt_matematik__fonksiyonlar', 'tyt_matematik', 'Fonksiyonlar', 50)
on conflict (id) do update
set label = excluded.label, sort_order = excluded.sort_order, subject_id = excluded.subject_id;

insert into public.curriculum_materials (id, subject_id, label, sort_order)
values ('tyt_mat__ornek_kaynak', 'tyt_matematik', 'Örnek Kaynak', 10)
on conflict (id) do update
set label = excluded.label, sort_order = excluded.sort_order, subject_id = excluded.subject_id;

insert into public.curriculum_material_topics (id, material_id, label, sort_order) values
  ('tyt_mat__ornek_kaynak__bolum1', 'tyt_mat__ornek_kaynak', 'Bölüm 1', 10),
  ('tyt_mat__ornek_kaynak__bolum2', 'tyt_mat__ornek_kaynak', 'Bölüm 2', 20),
  ('tyt_mat__ornek_kaynak__bolum3', 'tyt_mat__ornek_kaynak', 'Bölüm 3', 30)
on conflict (id) do update
set label = excluded.label, sort_order = excluded.sort_order, material_id = excluded.material_id;
