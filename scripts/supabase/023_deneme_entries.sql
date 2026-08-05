-- =============================================================================
-- Deneme entries (student + admin CRUD, per student + date)
-- Run in Supabase SQL Editor after prior migrations.
-- =============================================================================

create table if not exists public.deneme_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  deneme_date date not null,
  name text not null,
  duration text not null default '',
  type_id text not null,
  -- [{ "leafId": "fizik", "correct": 5, "wrong": 1 }, ...]
  scores jsonb not null default '[]'::jsonb,
  -- ["Temel Kavramlar", "özel konu", ...]
  topics jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deneme_entries_name_not_blank check (length(trim(name)) > 0),
  constraint deneme_entries_scores_is_array check (jsonb_typeof(scores) = 'array'),
  constraint deneme_entries_topics_is_array check (jsonb_typeof(topics) = 'array')
);

create index if not exists deneme_entries_student_date_idx
  on public.deneme_entries (student_id, deneme_date);

create index if not exists deneme_entries_org_student_date_idx
  on public.deneme_entries (organization_id, student_id, deneme_date);

create index if not exists deneme_entries_type_idx
  on public.deneme_entries (type_id);

drop trigger if exists deneme_entries_set_organization on public.deneme_entries;
create trigger deneme_entries_set_organization
before insert or update of student_id on public.deneme_entries
for each row execute function public.set_row_organization_from_student();

drop trigger if exists deneme_entries_set_updated_at on public.deneme_entries;
create trigger deneme_entries_set_updated_at
before update on public.deneme_entries
for each row execute function public.set_updated_at();

alter table public.deneme_entries enable row level security;

-- Students: full CRUD on own rows
drop policy if exists "students can read own deneme entries" on public.deneme_entries;
create policy "students can read own deneme entries"
on public.deneme_entries
for select
to authenticated
using (student_id = auth.uid());

drop policy if exists "students can insert own deneme entries" on public.deneme_entries;
create policy "students can insert own deneme entries"
on public.deneme_entries
for insert
to authenticated
with check (
  student_id = auth.uid()
  and (created_by is null or created_by = auth.uid())
);

drop policy if exists "students can update own deneme entries" on public.deneme_entries;
create policy "students can update own deneme entries"
on public.deneme_entries
for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

drop policy if exists "students can delete own deneme entries" on public.deneme_entries;
create policy "students can delete own deneme entries"
on public.deneme_entries
for delete
to authenticated
using (student_id = auth.uid());

-- Admins: full CRUD on organization students
drop policy if exists "admins can read organization deneme entries" on public.deneme_entries;
create policy "admins can read organization deneme entries"
on public.deneme_entries
for select
to authenticated
using (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
);

drop policy if exists "admins can insert organization deneme entries" on public.deneme_entries;
create policy "admins can insert organization deneme entries"
on public.deneme_entries
for insert
to authenticated
with check (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
  and exists (
    select 1
    from public.profiles p
    where p.id = student_id
      and p.organization_id = public.auth_organization_id()
      and p.role = 'student'
  )
);

drop policy if exists "admins can update organization deneme entries" on public.deneme_entries;
create policy "admins can update organization deneme entries"
on public.deneme_entries
for update
to authenticated
using (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
)
with check (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
);

drop policy if exists "admins can delete organization deneme entries" on public.deneme_entries;
create policy "admins can delete organization deneme entries"
on public.deneme_entries
for delete
to authenticated
using (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
);

grant select, insert, update, delete on public.deneme_entries to authenticated;
grant select on public.deneme_entries to anon;

comment on table public.deneme_entries is
  'Practice exam (deneme) logs. Type tree + validation live in app catalog; scores/topics are JSON.';
comment on column public.deneme_entries.scores is
  'JSON array of { leafId, correct, wrong }. Empty = questionCount - correct - wrong.';
comment on column public.deneme_entries.topics is
  'JSON string array of wrong/empty topics (preset labels and/or free text).';
