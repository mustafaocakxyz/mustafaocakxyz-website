-- =============================================================================
-- Public: today's tasks for one showcase student (label + completion only)
-- =============================================================================

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
