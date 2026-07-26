-- =============================================================================
-- Task duration label (parsed from trailing "| 2 saat" / "| (30 dak)")
-- Run in Supabase SQL Editor after 001–013.
-- =============================================================================

alter table public.daily_tasks
  add column if not exists duration_label text not null default '';

comment on column public.daily_tasks.duration_label is
  'Parsed time estimate shown as a pill (e.g. "2 saat", "30 dak").';

-- Students must not change duration_label either
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
    then
      raise exception 'Students can only update task completion status';
    end if;
  end if;

  return new;
end;
$$;

-- Public today tasks: include durationLabel
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
