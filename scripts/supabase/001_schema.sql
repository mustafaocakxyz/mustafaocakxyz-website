-- =============================================================================
-- Gelişim App — Supabase schema
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('admin', 'student');

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.organizations is
  'Top-level tenant. Export JSON can cover one organization at a time.';

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role public.app_role not null,
  display_name text not null,
  login_username text not null,
  auth_email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_login_username_org_unique unique (organization_id, login_username)
);

comment on table public.profiles is
  'App users (admin + student). id matches auth.users.id.';

comment on column public.profiles.auth_email is
  'Supabase Auth email. App login uses login_username, then maps to this email.';

create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  task_date date not null,
  label text not null,
  completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index daily_tasks_student_date_idx
  on public.daily_tasks (student_id, task_date);

create index daily_tasks_org_student_date_idx
  on public.daily_tasks (organization_id, student_id, task_date);

create table public.daily_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  submission_date date not null,
  uyku_uyanma text not null default '',
  gunluk_calisma text not null default '',
  ekran_suresi text not null default '',
  notlar text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_submissions_student_date_unique unique (student_id, submission_date)
);

create index daily_submissions_student_date_idx
  on public.daily_submissions (student_id, submission_date);

create index daily_submissions_org_date_idx
  on public.daily_submissions (organization_id, submission_date);

-- Keep organization_id in sync with the student's profile
create or replace function public.set_row_organization_from_student()
returns trigger
language plpgsql
as $$
declare
  v_org_id uuid;
begin
  select organization_id
  into v_org_id
  from public.profiles
  where id = new.student_id;

  if v_org_id is null then
    raise exception 'Student profile not found for id %', new.student_id;
  end if;

  new.organization_id := v_org_id;
  return new;
end;
$$;

create trigger daily_tasks_set_organization
before insert or update of student_id on public.daily_tasks
for each row execute function public.set_row_organization_from_student();

create trigger daily_submissions_set_organization
before insert or update of student_id on public.daily_submissions
for each row execute function public.set_row_organization_from_student();

-- Students may only toggle completion, not edit task text/metadata
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
      or new.sort_order is distinct from old.sort_order
      or new.task_date is distinct from old.task_date
      or new.student_id is distinct from old.student_id
      or new.organization_id is distinct from old.organization_id
    then
      raise exception 'Students can only update task completion status';
    end if;
  end if;

  return new;
end;
$$;

create trigger daily_tasks_enforce_student_update
before update on public.daily_tasks
for each row execute function public.enforce_student_task_update();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger daily_tasks_set_updated_at
before update on public.daily_tasks
for each row execute function public.set_updated_at();

create trigger daily_submissions_set_updated_at
before update on public.daily_submissions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth helpers (security definer — safe for RLS)
-- ---------------------------------------------------------------------------

create or replace function public.auth_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

create or replace function public.auth_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.auth_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

create or replace function public.resolve_auth_email(p_login_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select auth_email
  from public.profiles
  where lower(login_username) = lower(trim(p_login_username))
    and is_active = true
  limit 1;
$$;

grant execute on function public.resolve_auth_email(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.daily_submissions enable row level security;

-- organizations
create policy "members can read own organization"
on public.organizations
for select
to authenticated
using (id = public.auth_organization_id());

-- profiles
create policy "members can read profiles in own organization"
on public.profiles
for select
to authenticated
using (organization_id = public.auth_organization_id());

create policy "admins can update profiles in own organization"
on public.profiles
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

-- daily_tasks
create policy "students can read own tasks"
on public.daily_tasks
for select
to authenticated
using (student_id = auth.uid());

create policy "admins can read organization tasks"
on public.daily_tasks
for select
to authenticated
using (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
);

create policy "students can update own task completion"
on public.daily_tasks
for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

create policy "admins can insert organization tasks"
on public.daily_tasks
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

create policy "admins can update organization tasks"
on public.daily_tasks
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

create policy "admins can delete organization tasks"
on public.daily_tasks
for delete
to authenticated
using (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
);

-- daily_submissions
create policy "students can read own submissions"
on public.daily_submissions
for select
to authenticated
using (student_id = auth.uid());

create policy "admins can read organization submissions"
on public.daily_submissions
for select
to authenticated
using (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
);

create policy "students can insert own submissions"
on public.daily_submissions
for insert
to authenticated
with check (student_id = auth.uid());

create policy "students can update own submissions"
on public.daily_submissions
for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

-- ---------------------------------------------------------------------------
-- JSON export (admin only)
-- ---------------------------------------------------------------------------

create or replace function public.export_student_json(
  p_student_id uuid,
  p_from_date date default null,
  p_to_date date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org public.organizations;
  v_student public.profiles;
  v_days jsonb;
begin
  if not public.auth_is_admin() then
    raise exception 'Only admins can export data';
  end if;

  select p.*
  into v_student
  from public.profiles p
  where p.id = p_student_id
    and p.organization_id = public.auth_organization_id()
    and p.role = 'student';

  if v_student.id is null then
    raise exception 'Student not found in your organization';
  end if;

  select o.* into v_org from public.organizations o where o.id = v_student.organization_id;

  with date_spine as (
    select distinct d::date as day_date
    from (
      select task_date as d from public.daily_tasks where student_id = p_student_id
      union
      select submission_date as d from public.daily_submissions where student_id = p_student_id
    ) src
    where (p_from_date is null or d >= p_from_date)
      and (p_to_date is null or d <= p_to_date)
    order by d
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', to_char(ds.day_date, 'YYYY-MM-DD'),
        'tasks', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', t.id,
                'label', t.label,
                'completed', t.completed,
                'sortOrder', t.sort_order,
                'updatedAt', t.updated_at
              )
              order by t.sort_order, t.created_at
            )
            from public.daily_tasks t
            where t.student_id = p_student_id
              and t.task_date = ds.day_date
          ),
          '[]'::jsonb
        ),
        'submission', (
          select jsonb_build_object(
            'uykuUyanma', s.uyku_uyanma,
            'gunlukCalisma', s.gunluk_calisma,
            'ekranSuresi', s.ekran_suresi,
            'notlar', s.notlar,
            'updatedAt', s.updated_at
          )
          from public.daily_submissions s
          where s.student_id = p_student_id
            and s.submission_date = ds.day_date
        )
      )
      order by ds.day_date
    ),
    '[]'::jsonb
  )
  into v_days
  from date_spine ds;

  return jsonb_build_object(
    'version', 1,
    'exportedAt', now(),
    'scope', 'student',
    'organization', jsonb_build_object(
      'id', v_org.id,
      'name', v_org.name,
      'slug', v_org.slug
    ),
    'filters', jsonb_build_object(
      'fromDate', p_from_date,
      'toDate', p_to_date
    ),
    'student', jsonb_build_object(
      'id', v_student.id,
      'displayName', v_student.display_name,
      'loginUsername', v_student.login_username
    ),
    'days', v_days
  );
end;
$$;

create or replace function public.export_organization_json(
  p_from_date date default null,
  p_to_date date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org public.organizations;
  v_students jsonb;
begin
  if not public.auth_is_admin() then
    raise exception 'Only admins can export data';
  end if;

  select o.*
  into v_org
  from public.organizations o
  where o.id = public.auth_organization_id();

  select coalesce(
    jsonb_agg(
      public.export_student_json(p.id, p_from_date, p_to_date)
      - 'scope'
      - 'organization'
      - 'filters'
      order by p.display_name
    ),
    '[]'::jsonb
  )
  into v_students
  from public.profiles p
  where p.organization_id = v_org.id
    and p.role = 'student'
    and p.is_active = true;

  return jsonb_build_object(
    'version', 1,
    'exportedAt', now(),
    'scope', 'organization',
    'organization', jsonb_build_object(
      'id', v_org.id,
      'name', v_org.name,
      'slug', v_org.slug
    ),
    'filters', jsonb_build_object(
      'fromDate', p_from_date,
      'toDate', p_to_date
    ),
    'students', v_students
  );
end;
$$;

grant execute on function public.export_student_json(uuid, date, date) to authenticated;
grant execute on function public.export_organization_json(date, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Table grants (required for API access via anon/authenticated roles)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

grant usage, select on all sequences in schema public to authenticated;

grant execute on all functions in schema public to authenticated, anon;

alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
grant select on tables to anon;

alter default privileges in schema public
grant execute on functions to authenticated, anon;

alter default privileges in schema public
grant usage, select on sequences to authenticated;
