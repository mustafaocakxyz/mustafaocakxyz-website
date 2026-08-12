-- =============================================================================
-- Per-student visibility / billing / day-count settings
-- Run in Supabase SQL Editor after 025_curriculum_sample_seed.sql
-- =============================================================================

alter table public.profiles
  add column if not exists show_on_admin_dashboard boolean not null default true;

alter table public.profiles
  add column if not exists show_on_ogrenciler boolean not null default true;

alter table public.profiles
  add column if not exists count_in_earnings boolean not null default true;

alter table public.profiles
  add column if not exists day_count_active boolean not null default true;

alter table public.profiles
  add column if not exists day_count_frozen_days integer;

alter table public.profiles
  add column if not exists day_count_start_date date;

comment on column public.profiles.show_on_admin_dashboard is
  'When false, student is hidden from the admin dashboard student list.';
comment on column public.profiles.show_on_ogrenciler is
  'When false, student is hidden from public /ogrenciler and related public counts.';
comment on column public.profiles.count_in_earnings is
  'When true, student is included in admin monthly earnings count.';
comment on column public.profiles.day_count_active is
  'When false, public days-in-program is frozen at day_count_frozen_days.';
comment on column public.profiles.day_count_frozen_days is
  'Frozen day count while day_count_active is false.';
comment on column public.profiles.day_count_start_date is
  'Basis date for days-in-program when day_count_active is true.';

-- Backfill start dates from created_at for existing students
update public.profiles
set day_count_start_date = (timezone('Europe/Istanbul', created_at))::date
where role = 'student'
  and day_count_start_date is null;

-- Optional: migrate known hardcoded public hide (safe if id missing)
update public.profiles
set show_on_ogrenciler = false
where id = 'bd318631-4c4c-4318-93cd-3aef4c39fbf9';

alter table public.profiles
  drop constraint if exists profiles_day_count_frozen_days_check;

alter table public.profiles
  add constraint profiles_day_count_frozen_days_check
  check (
    day_count_frozen_days is null
    or day_count_frozen_days >= 1
  );

-- Public /ogrenciler list: only show_on_ogrenciler students; include day-count fields
create or replace function public.public_student_showcase_summaries()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'displayName', p.display_name,
        'createdAt', p.created_at,
        'showcaseHighlights', to_jsonb(coalesce(p.showcase_highlight, '{}'::text[])),
        'dayCountActive', p.day_count_active,
        'dayCountFrozenDays', p.day_count_frozen_days,
        'dayCountStartDate', p.day_count_start_date
      )
      order by p.showcase_sort_order asc, p.display_name asc
    ),
    '[]'::jsonb
  )
  from public.profiles p
  inner join public.organizations o on o.id = p.organization_id
  where p.role = 'student'
    and p.is_active = true
    and p.show_on_ogrenciler = true
    and o.slug = 'gelisim';
$$;

revoke all on function public.public_student_showcase_summaries() from public;
grant execute on function public.public_student_showcase_summaries() to anon, authenticated;

-- Homepage teaser count: visible on /ogrenciler
create or replace function public.public_active_student_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.profiles p
  inner join public.organizations o on o.id = p.organization_id
  where p.role = 'student'
    and p.is_active = true
    and p.show_on_ogrenciler = true
    and o.slug = 'gelisim';
$$;

revoke all on function public.public_active_student_count() from public;
grant execute on function public.public_active_student_count() to anon, authenticated;

-- Detail today-tasks: require show_on_ogrenciler
create or replace function public.public_student_today_tasks(p_student_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('Europe/Istanbul', now()))::date;
  v_ok boolean;
  v_tasks jsonb;
begin
  select exists (
    select 1
    from public.profiles p
    inner join public.organizations o on o.id = p.organization_id
    where p.id = p_student_id
      and p.role = 'student'
      and p.is_active = true
      and p.show_on_ogrenciler = true
      and o.slug = 'gelisim'
  )
  into v_ok;

  if not v_ok then
    return '[]'::jsonb;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'label', t.label,
        'durationLabel', t.duration_label,
        'completed', t.completed,
        'sortOrder', t.sort_order
      )
      order by t.sort_order, t.created_at
    ),
    '[]'::jsonb
  )
  into v_tasks
  from public.daily_tasks t
  where t.student_id = p_student_id
    and t.task_date = v_today;

  return v_tasks;
end;
$$;

revoke all on function public.public_student_today_tasks(uuid) from public;
grant execute on function public.public_student_today_tasks(uuid) to anon, authenticated;
