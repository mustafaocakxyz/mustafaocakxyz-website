-- =============================================================================
-- Per-student coach notes (admin Notlar tab)
-- Run in Supabase SQL Editor after 035_show_in_admin_chat.sql
-- =============================================================================

create table if not exists public.student_coach_notes (
  student_id uuid primary key references public.profiles (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  grade text,
  coach_notes text not null default '',
  current_step text not null default '',
  -- [{ "id": "uuid", "subject": "TYT Matematik", "dateLabel": "18 Ağustos" }, ...]
  finished_steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_coach_notes_grade_check check (
    grade is null or grade in ('9', '10', '11', '12', 'mezun')
  ),
  constraint student_coach_notes_finished_steps_is_array check (
    jsonb_typeof(finished_steps) = 'array'
  )
);

create index if not exists student_coach_notes_org_idx
  on public.student_coach_notes (organization_id);

drop trigger if exists student_coach_notes_set_organization on public.student_coach_notes;
create trigger student_coach_notes_set_organization
before insert or update of student_id on public.student_coach_notes
for each row execute function public.set_row_organization_from_student();

drop trigger if exists student_coach_notes_set_updated_at on public.student_coach_notes;
create trigger student_coach_notes_set_updated_at
before update on public.student_coach_notes
for each row execute function public.set_updated_at();

alter table public.student_coach_notes enable row level security;

drop policy if exists "admins can read organization coach notes" on public.student_coach_notes;
create policy "admins can read organization coach notes"
on public.student_coach_notes
for select
to authenticated
using (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
);

drop policy if exists "admins can insert organization coach notes" on public.student_coach_notes;
create policy "admins can insert organization coach notes"
on public.student_coach_notes
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

drop policy if exists "admins can update organization coach notes" on public.student_coach_notes;
create policy "admins can update organization coach notes"
on public.student_coach_notes
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

grant select, insert, update on public.student_coach_notes to authenticated;

comment on table public.student_coach_notes is
  'Admin-only per-student snapshot: grade, coach notes, current step, finished steps.';
