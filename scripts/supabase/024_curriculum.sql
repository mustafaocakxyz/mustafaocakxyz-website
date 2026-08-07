-- =============================================================================
-- Konu & Materyal: catalog, student enrollment, topic progress, task links
-- Run in Supabase SQL Editor after 023_deneme_entries.sql
-- =============================================================================

-- Topic status: none | current | completed_warn | completed_ok
-- Subject topics: status only (no score %).
-- Material topics: status + correct_count / question_count → correct %.

create table if not exists public.curriculum_subjects (
  id text primary key,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint curriculum_subjects_label_not_blank check (length(trim(label)) > 0)
);

create table if not exists public.curriculum_subject_topics (
  id text primary key,
  subject_id text not null references public.curriculum_subjects (id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  constraint curriculum_subject_topics_label_not_blank check (length(trim(label)) > 0)
);

create index if not exists curriculum_subject_topics_subject_idx
  on public.curriculum_subject_topics (subject_id, sort_order);

create table if not exists public.curriculum_materials (
  id text primary key,
  subject_id text not null references public.curriculum_subjects (id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint curriculum_materials_label_not_blank check (length(trim(label)) > 0)
);

create index if not exists curriculum_materials_subject_idx
  on public.curriculum_materials (subject_id, sort_order);

create table if not exists public.curriculum_material_topics (
  id text primary key,
  material_id text not null references public.curriculum_materials (id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  constraint curriculum_material_topics_label_not_blank check (length(trim(label)) > 0)
);

create index if not exists curriculum_material_topics_material_idx
  on public.curriculum_material_topics (material_id, sort_order);

-- Student enrollments ---------------------------------------------------------

create table if not exists public.student_subjects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  subject_id text not null references public.curriculum_subjects (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint student_subjects_unique unique (student_id, subject_id)
);

create index if not exists student_subjects_student_idx
  on public.student_subjects (student_id);

create table if not exists public.student_materials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  material_id text not null references public.curriculum_materials (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint student_materials_unique unique (student_id, material_id)
);

create index if not exists student_materials_student_idx
  on public.student_materials (student_id);

-- Progress --------------------------------------------------------------------

create table if not exists public.subject_topic_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  subject_id text not null references public.curriculum_subjects (id) on delete cascade,
  topic_id text not null references public.curriculum_subject_topics (id) on delete cascade,
  status text not null default 'none',
  updated_at timestamptz not null default now(),
  constraint subject_topic_progress_unique unique (student_id, topic_id),
  constraint subject_topic_progress_status_check check (
    status in ('none', 'current', 'completed_warn', 'completed_ok')
  )
);

create index if not exists subject_topic_progress_student_subject_idx
  on public.subject_topic_progress (student_id, subject_id);

create table if not exists public.material_topic_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  material_id text not null references public.curriculum_materials (id) on delete cascade,
  topic_id text not null references public.curriculum_material_topics (id) on delete cascade,
  status text not null default 'none',
  correct_count integer,
  question_count integer,
  updated_at timestamptz not null default now(),
  constraint material_topic_progress_unique unique (student_id, topic_id),
  constraint material_topic_progress_status_check check (
    status in ('none', 'current', 'completed_warn', 'completed_ok')
  ),
  constraint material_topic_progress_counts_check check (
    (correct_count is null and question_count is null)
    or (
      correct_count is not null
      and question_count is not null
      and correct_count >= 0
      and question_count > 0
      and correct_count <= question_count
    )
  )
);

create index if not exists material_topic_progress_student_material_idx
  on public.material_topic_progress (student_id, material_id);

-- Task → topic auto-complete links --------------------------------------------
-- JSON array: [{ "scope": "subject"|"material", "topicId": "..." }, ...]

alter table public.daily_tasks
  add column if not exists topic_links jsonb not null default '[]'::jsonb;

alter table public.daily_tasks
  drop constraint if exists daily_tasks_topic_links_is_array;

alter table public.daily_tasks
  add constraint daily_tasks_topic_links_is_array
  check (jsonb_typeof(topic_links) = 'array');

comment on column public.daily_tasks.topic_links is
  'Optional links for auto-complete: [{ scope: subject|material, topicId }].';

-- Students still may only toggle completed (not topic_links)
create or replace function public.enforce_student_task_update()
returns trigger
language plpgsql
as $$
declare
  v_role public.app_role;
begin
  select role into v_role from public.profiles where id = auth.uid();

  if v_role = 'student' then
    if new.label is distinct from old.label
      or new.duration_label is distinct from old.duration_label
      or new.sort_order is distinct from old.sort_order
      or new.task_date is distinct from old.task_date
      or new.student_id is distinct from old.student_id
      or new.organization_id is distinct from old.organization_id
      or new.topic_links is distinct from old.topic_links
    then
      raise exception 'Students can only update task completion status';
    end if;
  end if;

  return new;
end;
$$;

-- Triggers --------------------------------------------------------------------

drop trigger if exists student_subjects_set_organization on public.student_subjects;
create trigger student_subjects_set_organization
before insert or update of student_id on public.student_subjects
for each row execute function public.set_row_organization_from_student();

drop trigger if exists student_materials_set_organization on public.student_materials;
create trigger student_materials_set_organization
before insert or update of student_id on public.student_materials
for each row execute function public.set_row_organization_from_student();

drop trigger if exists subject_topic_progress_set_organization on public.subject_topic_progress;
create trigger subject_topic_progress_set_organization
before insert or update of student_id on public.subject_topic_progress
for each row execute function public.set_row_organization_from_student();

drop trigger if exists material_topic_progress_set_organization on public.material_topic_progress;
create trigger material_topic_progress_set_organization
before insert or update of student_id on public.material_topic_progress
for each row execute function public.set_row_organization_from_student();

drop trigger if exists subject_topic_progress_set_updated_at on public.subject_topic_progress;
create trigger subject_topic_progress_set_updated_at
before update on public.subject_topic_progress
for each row execute function public.set_updated_at();

drop trigger if exists material_topic_progress_set_updated_at on public.material_topic_progress;
create trigger material_topic_progress_set_updated_at
before update on public.material_topic_progress
for each row execute function public.set_updated_at();

-- RLS -------------------------------------------------------------------------

alter table public.curriculum_subjects enable row level security;
alter table public.curriculum_subject_topics enable row level security;
alter table public.curriculum_materials enable row level security;
alter table public.curriculum_material_topics enable row level security;
alter table public.student_subjects enable row level security;
alter table public.student_materials enable row level security;
alter table public.subject_topic_progress enable row level security;
alter table public.material_topic_progress enable row level security;

-- Catalog: all authenticated org members can read; only admins write
drop policy if exists "members can read curriculum subjects" on public.curriculum_subjects;
create policy "members can read curriculum subjects"
on public.curriculum_subjects for select to authenticated using (true);

drop policy if exists "admins can write curriculum subjects" on public.curriculum_subjects;
create policy "admins can write curriculum subjects"
on public.curriculum_subjects for all to authenticated
using (public.auth_is_admin())
with check (public.auth_is_admin());

drop policy if exists "members can read curriculum subject topics" on public.curriculum_subject_topics;
create policy "members can read curriculum subject topics"
on public.curriculum_subject_topics for select to authenticated using (true);

drop policy if exists "admins can write curriculum subject topics" on public.curriculum_subject_topics;
create policy "admins can write curriculum subject topics"
on public.curriculum_subject_topics for all to authenticated
using (public.auth_is_admin())
with check (public.auth_is_admin());

drop policy if exists "members can read curriculum materials" on public.curriculum_materials;
create policy "members can read curriculum materials"
on public.curriculum_materials for select to authenticated using (true);

drop policy if exists "admins can write curriculum materials" on public.curriculum_materials;
create policy "admins can write curriculum materials"
on public.curriculum_materials for all to authenticated
using (public.auth_is_admin())
with check (public.auth_is_admin());

drop policy if exists "members can read curriculum material topics" on public.curriculum_material_topics;
create policy "members can read curriculum material topics"
on public.curriculum_material_topics for select to authenticated using (true);

drop policy if exists "admins can write curriculum material topics" on public.curriculum_material_topics;
create policy "admins can write curriculum material topics"
on public.curriculum_material_topics for all to authenticated
using (public.auth_is_admin())
with check (public.auth_is_admin());

-- Enrollments: students read own; admins full CRUD in org
drop policy if exists "students can read own subject enrollments" on public.student_subjects;
create policy "students can read own subject enrollments"
on public.student_subjects for select to authenticated
using (student_id = auth.uid());

drop policy if exists "admins can read org subject enrollments" on public.student_subjects;
create policy "admins can read org subject enrollments"
on public.student_subjects for select to authenticated
using (organization_id = public.auth_organization_id() and public.auth_is_admin());

drop policy if exists "admins can insert org subject enrollments" on public.student_subjects;
create policy "admins can insert org subject enrollments"
on public.student_subjects for insert to authenticated
with check (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
  and exists (
    select 1 from public.profiles p
    where p.id = student_id
      and p.organization_id = public.auth_organization_id()
      and p.role = 'student'
  )
);

drop policy if exists "admins can delete org subject enrollments" on public.student_subjects;
create policy "admins can delete org subject enrollments"
on public.student_subjects for delete to authenticated
using (organization_id = public.auth_organization_id() and public.auth_is_admin());

drop policy if exists "students can read own material enrollments" on public.student_materials;
create policy "students can read own material enrollments"
on public.student_materials for select to authenticated
using (student_id = auth.uid());

drop policy if exists "admins can read org material enrollments" on public.student_materials;
create policy "admins can read org material enrollments"
on public.student_materials for select to authenticated
using (organization_id = public.auth_organization_id() and public.auth_is_admin());

drop policy if exists "admins can insert org material enrollments" on public.student_materials;
create policy "admins can insert org material enrollments"
on public.student_materials for insert to authenticated
with check (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
  and exists (
    select 1 from public.profiles p
    where p.id = student_id
      and p.organization_id = public.auth_organization_id()
      and p.role = 'student'
  )
);

drop policy if exists "admins can delete org material enrollments" on public.student_materials;
create policy "admins can delete org material enrollments"
on public.student_materials for delete to authenticated
using (organization_id = public.auth_organization_id() and public.auth_is_admin());

-- Progress: student own CRUD + admin org CRUD
drop policy if exists "students can read own subject topic progress" on public.subject_topic_progress;
create policy "students can read own subject topic progress"
on public.subject_topic_progress for select to authenticated
using (student_id = auth.uid());

drop policy if exists "students can upsert own subject topic progress" on public.subject_topic_progress;
create policy "students can upsert own subject topic progress"
on public.subject_topic_progress for insert to authenticated
with check (student_id = auth.uid());

drop policy if exists "students can update own subject topic progress" on public.subject_topic_progress;
create policy "students can update own subject topic progress"
on public.subject_topic_progress for update to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

drop policy if exists "admins can read org subject topic progress" on public.subject_topic_progress;
create policy "admins can read org subject topic progress"
on public.subject_topic_progress for select to authenticated
using (organization_id = public.auth_organization_id() and public.auth_is_admin());

drop policy if exists "admins can insert org subject topic progress" on public.subject_topic_progress;
create policy "admins can insert org subject topic progress"
on public.subject_topic_progress for insert to authenticated
with check (organization_id = public.auth_organization_id() and public.auth_is_admin());

drop policy if exists "admins can update org subject topic progress" on public.subject_topic_progress;
create policy "admins can update org subject topic progress"
on public.subject_topic_progress for update to authenticated
using (organization_id = public.auth_organization_id() and public.auth_is_admin())
with check (organization_id = public.auth_organization_id() and public.auth_is_admin());

drop policy if exists "students can read own material topic progress" on public.material_topic_progress;
create policy "students can read own material topic progress"
on public.material_topic_progress for select to authenticated
using (student_id = auth.uid());

drop policy if exists "students can upsert own material topic progress" on public.material_topic_progress;
create policy "students can upsert own material topic progress"
on public.material_topic_progress for insert to authenticated
with check (student_id = auth.uid());

drop policy if exists "students can update own material topic progress" on public.material_topic_progress;
create policy "students can update own material topic progress"
on public.material_topic_progress for update to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

drop policy if exists "admins can read org material topic progress" on public.material_topic_progress;
create policy "admins can read org material topic progress"
on public.material_topic_progress for select to authenticated
using (organization_id = public.auth_organization_id() and public.auth_is_admin());

drop policy if exists "admins can insert org material topic progress" on public.material_topic_progress;
create policy "admins can insert org material topic progress"
on public.material_topic_progress for insert to authenticated
with check (organization_id = public.auth_organization_id() and public.auth_is_admin());

drop policy if exists "admins can update org material topic progress" on public.material_topic_progress;
create policy "admins can update org material topic progress"
on public.material_topic_progress for update to authenticated
using (organization_id = public.auth_organization_id() and public.auth_is_admin())
with check (organization_id = public.auth_organization_id() and public.auth_is_admin());

grant select on public.curriculum_subjects to authenticated, anon;
grant select on public.curriculum_subject_topics to authenticated, anon;
grant select on public.curriculum_materials to authenticated, anon;
grant select on public.curriculum_material_topics to authenticated, anon;
grant select, insert, update, delete on public.curriculum_subjects to authenticated;
grant select, insert, update, delete on public.curriculum_subject_topics to authenticated;
grant select, insert, update, delete on public.curriculum_materials to authenticated;
grant select, insert, update, delete on public.curriculum_material_topics to authenticated;

grant select, insert, delete on public.student_subjects to authenticated;
grant select, insert, delete on public.student_materials to authenticated;
grant select, insert, update on public.subject_topic_progress to authenticated;
grant select, insert, update on public.material_topic_progress to authenticated;

comment on table public.curriculum_subjects is
  'Global subject catalog. Assign to students via student_subjects.';
comment on table public.curriculum_materials is
  'Materials always belong to one subject. Assign via student_materials.';
comment on table public.subject_topic_progress is
  'Per-student subject topic status (no correct %).';
comment on table public.material_topic_progress is
  'Per-student material topic status + correct_count/question_count.';
