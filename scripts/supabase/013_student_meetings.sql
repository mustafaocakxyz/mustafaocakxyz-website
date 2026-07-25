-- =============================================================================
-- Student meetings (admin-scheduled calls)
-- Admin write / student read own. Run in Supabase SQL Editor after 001–012.
-- =============================================================================

create table if not exists public.student_meetings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  meeting_date date not null,
  meeting_time time not null,
  meeting_link text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_meetings_student_date_unique unique (student_id, meeting_date)
);

create index if not exists student_meetings_student_date_idx
  on public.student_meetings (student_id, meeting_date);

create index if not exists student_meetings_org_date_idx
  on public.student_meetings (organization_id, meeting_date);

drop trigger if exists student_meetings_set_organization on public.student_meetings;
create trigger student_meetings_set_organization
before insert or update of student_id on public.student_meetings
for each row execute function public.set_row_organization_from_student();

drop trigger if exists student_meetings_set_updated_at on public.student_meetings;
create trigger student_meetings_set_updated_at
before update on public.student_meetings
for each row execute function public.set_updated_at();

alter table public.student_meetings enable row level security;

drop policy if exists "students can read own meetings" on public.student_meetings;
create policy "students can read own meetings"
on public.student_meetings
for select
to authenticated
using (student_id = auth.uid());

drop policy if exists "admins can read organization meetings" on public.student_meetings;
create policy "admins can read organization meetings"
on public.student_meetings
for select
to authenticated
using (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
);

drop policy if exists "admins can insert organization meetings" on public.student_meetings;
create policy "admins can insert organization meetings"
on public.student_meetings
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

drop policy if exists "admins can update organization meetings" on public.student_meetings;
create policy "admins can update organization meetings"
on public.student_meetings
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

drop policy if exists "admins can delete organization meetings" on public.student_meetings;
create policy "admins can delete organization meetings"
on public.student_meetings
for delete
to authenticated
using (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
);

grant select, insert, update, delete on public.student_meetings to authenticated;
grant select on public.student_meetings to anon;

comment on table public.student_meetings is
  'Scheduled student calls. Admin CRUD; students read their own.';
