-- =============================================================================
-- Time-weighted completion % for status digest emails
-- Run after 014_task_duration_label.sql
-- =============================================================================

-- Minutes from texts like "1.5 saat", "(30 dak)", "4 saat"
create or replace function public.task_estimate_minutes(p_text text)
returns numeric
language plpgsql
immutable
as $$
declare
  v_raw text := lower(trim(coalesce(p_text, '')));
  v_num text;
  v_unit text;
  v_amount numeric;
begin
  if v_raw = '' then
    return null;
  end if;

  if left(v_raw, 1) = '(' and right(v_raw, 1) = ')' then
    v_raw := trim(both from substring(v_raw from 2 for char_length(v_raw) - 2));
  end if;

  if v_raw !~ '^[0-9]+([.,][0-9]+)?\s*(saat|sa|dak|dk|dakika)$' then
    return null;
  end if;

  v_num := regexp_replace(v_raw, '^([0-9]+([.,][0-9]+)?)\s*.*$', '\1');
  v_unit := regexp_replace(v_raw, '^[0-9]+([.,][0-9]+)?\s*', '');
  v_amount := replace(v_num, ',', '.')::numeric;

  if v_unit in ('saat', 'sa') then
    return v_amount * 60;
  end if;

  if v_unit in ('dak', 'dk', 'dakika') then
    return v_amount;
  end if;

  return null;
exception when others then
  return null;
end;
$$;

-- Prefer duration_label; else last "| …" segment of label (legacy rows).
create or replace function public.task_duration_minutes(
  p_duration_label text,
  p_label text
)
returns numeric
language plpgsql
immutable
as $$
declare
  v_from_col numeric;
  v_pos int;
  v_tail text;
begin
  v_from_col := public.task_estimate_minutes(p_duration_label);
  if v_from_col is not null and v_from_col > 0 then
    return v_from_col;
  end if;

  v_pos := position('|' in reverse(coalesce(p_label, '')));
  if coalesce(v_pos, 0) = 0 then
    return null;
  end if;

  v_tail := trim(both from right(p_label, v_pos - 1));
  return public.task_estimate_minutes(v_tail);
end;
$$;

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
          'total', coalesce(today_stats.task_total, 0),
          'completed', coalesce(today_stats.task_completed, 0),
          'totalMinutes', round(coalesce(today_stats.minutes_total, 0))::int,
          'completedMinutes', round(coalesce(today_stats.minutes_completed, 0))::int,
          'percent', case
            when coalesce(today_stats.task_total, 0) = 0 then null
            when coalesce(today_stats.minutes_total, 0) > 0 then
              round(
                100.0 * today_stats.minutes_completed / today_stats.minutes_total
              )::int
            else
              round(
                100.0 * today_stats.task_completed / today_stats.task_total
              )::int
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
      count(*)::int as task_total,
      count(*) filter (where t.completed)::int as task_completed,
      coalesce(sum(mins.m) filter (where mins.m is not null and mins.m > 0), 0)
        as minutes_total,
      coalesce(
        sum(mins.m) filter (where t.completed and mins.m is not null and mins.m > 0),
        0
      ) as minutes_completed
    from public.daily_tasks t
    cross join lateral (
      select public.task_duration_minutes(t.duration_label, t.label) as m
    ) mins
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

grant execute on function public.task_estimate_minutes(text) to authenticated, service_role;
grant execute on function public.task_duration_minutes(text, text) to authenticated, service_role;
