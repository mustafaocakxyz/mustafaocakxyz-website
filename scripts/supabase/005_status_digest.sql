-- =============================================================================
-- Student status digest for scheduled email reports
-- Run in Supabase SQL Editor after 001–004.
-- Called by Google Apps Script with the service_role key (bypasses RLS).
-- =============================================================================

create or replace function public.admin_student_status_digest()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('Europe/Istanbul', now()))::date;
  v_tomorrow date := v_today + 1;
  v_rows jsonb;
begin
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'displayName', p.display_name,
        'loginUsername', p.login_username,
        'today', jsonb_build_object(
          'total', coalesce(today_stats.total, 0),
          'completed', coalesce(today_stats.completed, 0),
          'percent', case
            when coalesce(today_stats.total, 0) = 0 then null
            else round(100.0 * today_stats.completed / today_stats.total)::int
          end
        ),
        'tomorrowReady', coalesce(tomorrow_stats.total, 0) > 0,
        'tomorrowTaskCount', coalesce(tomorrow_stats.total, 0)
      )
      order by p.display_name
    ),
    '[]'::jsonb
  )
  into v_rows
  from public.profiles p
  left join lateral (
    select
      count(*)::int as total,
      count(*) filter (where t.completed)::int as completed
    from public.daily_tasks t
    where t.student_id = p.id
      and t.task_date = v_today
  ) today_stats on true
  left join lateral (
    select count(*)::int as total
    from public.daily_tasks t
    where t.student_id = p.id
      and t.task_date = v_tomorrow
  ) tomorrow_stats on true
  where p.role = 'student'
    and p.is_active = true;

  return jsonb_build_object(
    'generatedAt', timezone('Europe/Istanbul', now()),
    'timezone', 'Europe/Istanbul',
    'today', to_char(v_today, 'YYYY-MM-DD'),
    'tomorrow', to_char(v_tomorrow, 'YYYY-MM-DD'),
    'students', v_rows
  );
end;
$$;

revoke all on function public.admin_student_status_digest() from public, anon, authenticated;
grant execute on function public.admin_student_status_digest() to service_role;
