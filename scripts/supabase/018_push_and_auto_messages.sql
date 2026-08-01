-- =============================================================================
-- Push tokens + scheduled chat auto-messages
-- Run after 016_chat.sql (and 014/015 for duration helpers).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Push tokens (Expo)
-- ---------------------------------------------------------------------------

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  platform text not null default 'unknown',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint push_tokens_token_unique unique (token)
);

create index if not exists push_tokens_user_id_idx on public.push_tokens (user_id);

drop trigger if exists push_tokens_set_updated_at on public.push_tokens;
create trigger push_tokens_set_updated_at
before update on public.push_tokens
for each row execute function public.set_updated_at();

alter table public.push_tokens enable row level security;

drop policy if exists "users can read own push tokens" on public.push_tokens;
create policy "users can read own push tokens"
on public.push_tokens for select to authenticated
using (user_id = auth.uid());

drop policy if exists "users can upsert own push tokens" on public.push_tokens;
create policy "users can upsert own push tokens"
on public.push_tokens for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "users can update own push tokens" on public.push_tokens;
create policy "users can update own push tokens"
on public.push_tokens for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users can delete own push tokens" on public.push_tokens;
create policy "users can delete own push tokens"
on public.push_tokens for delete to authenticated
using (user_id = auth.uid());

drop policy if exists "admins can read org push tokens" on public.push_tokens;
create policy "admins can read org push tokens"
on public.push_tokens for select to authenticated
using (
  public.auth_is_admin()
  and exists (
    select 1 from public.profiles p
    where p.id = push_tokens.user_id
      and p.organization_id = public.auth_organization_id()
  )
);

grant select, insert, update, delete on public.push_tokens to authenticated;

create or replace function public.upsert_push_token(p_token text, p_platform text default 'unknown')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if trim(coalesce(p_token, '')) = '' then
    raise exception 'Token required';
  end if;

  insert into public.push_tokens (user_id, token, platform)
  values (auth.uid(), trim(p_token), coalesce(nullif(trim(p_platform), ''), 'unknown'))
  on conflict (token) do update
  set user_id = excluded.user_id,
      platform = excluded.platform,
      updated_at = now();
end;
$$;

revoke all on function public.upsert_push_token(text, text) from public;
grant execute on function public.upsert_push_token(text, text) to authenticated;

-- Admin (or service role) can list tokens for a student in same org
create or replace function public.list_student_push_tokens(p_student_id uuid)
returns table (token text, platform text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
  v_org uuid;
  v_student_org uuid;
begin
  -- service role / no JWT: allow
  if auth.uid() is null then
    return query
      select pt.token, pt.platform
      from public.push_tokens pt
      where pt.user_id = p_student_id;
    return;
  end if;

  select role, organization_id into v_role, v_org
  from public.profiles where id = auth.uid() and is_active;

  select organization_id into v_student_org
  from public.profiles where id = p_student_id;

  if v_role is distinct from 'admin' or v_org is distinct from v_student_org then
    raise exception 'Unauthorized';
  end if;

  return query
    select pt.token, pt.platform
    from public.push_tokens pt
    where pt.user_id = p_student_id;
end;
$$;

revoke all on function public.list_student_push_tokens(uuid) from public;
grant execute on function public.list_student_push_tokens(uuid) to authenticated;
grant execute on function public.list_student_push_tokens(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Completion % for a student on a date (mirrors app time-weighted logic)
-- ---------------------------------------------------------------------------

create or replace function public.student_day_completion_percent(
  p_student_id uuid,
  p_day date
)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_task_total int;
  v_task_completed int;
  v_minutes_total numeric;
  v_minutes_completed numeric;
begin
  select
    count(*)::int,
    count(*) filter (where t.completed)::int,
    coalesce(sum(public.task_duration_minutes(t.duration_label, t.label)), 0),
    coalesce(sum(public.task_duration_minutes(t.duration_label, t.label)) filter (where t.completed), 0)
  into v_task_total, v_task_completed, v_minutes_total, v_minutes_completed
  from public.daily_tasks t
  where t.student_id = p_student_id
    and t.task_date = p_day;

  if coalesce(v_task_total, 0) = 0 then
    return null;
  end if;

  if v_minutes_total > 0 then
    return round((v_minutes_completed / v_minutes_total) * 100)::int;
  end if;

  return round((v_task_completed::numeric / v_task_total::numeric) * 100)::int;
end;
$$;

-- ---------------------------------------------------------------------------
-- Auto-messages: slots midday | afternoon | evening
-- ---------------------------------------------------------------------------

create table if not exists public.chat_auto_message_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  slot text not null,
  run_date date not null,
  skipped_reason text,
  message_id uuid references public.chat_messages (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint chat_auto_message_log_unique unique (student_id, slot, run_date)
);

create index if not exists chat_auto_message_log_date_idx
  on public.chat_auto_message_log (run_date, slot);

alter table public.chat_auto_message_log enable row level security;

-- No client policies; service role / security definer only
grant select on public.chat_auto_message_log to service_role;

create or replace function public.chat_auto_message_body(
  p_slot text,
  p_percent integer
)
returns text
language plpgsql
immutable
as $$
begin
  if p_slot = 'midday' then
    if p_percent = 0 then
      return $m$%0'da görünüyoruz, ne durumdayız?$m$;
    elsif p_percent > 40 then
      return $m$Tebrik ederim, bugün %40 tamamlamışız. Akşama kadar bitirelim.$m$;
    else
      return $m$%40'ın altında görünüyoruz, gaza basalım.$m$;
    end if;
  elsif p_slot = 'afternoon' then
    if p_percent > 70 then
      return $m$Tebrik ederim, bugünü neredeyse tamamlamışız. Bitirdiğinde raporunu bekliyorum.$m$;
    elsif p_percent >= 40 then
      return $m$Akşama kadar mutlaka bitirmeye gayret edelim, raporunu bekliyorum.$m$;
    else
      return $m$Bugün epey az çalışmışız görünüyor, acilen oturup yapabildiğimiz kadar görev halledelim.$m$;
    end if;
  elsif p_slot = 'evening' then
    if p_percent = 100 then
      return $m$Tebrik ederim, bugünü tamamlamışız. Yarın aynı tempoda devam.$m$;
    elsif p_percent > 70 then
      return $m$Çok az görev kalmış görünüyor, inşallah tamamlayabiliriz. Yetişmezse yarın çok çalışıp telafi edeceğiz.$m$;
    else
      return $m$Bugün son durum nedir?$m$;
    end if;
  end if;

  return null;
end;
$$;

/**
 * Run one auto-message slot for all active students.
 * p_slot: 'midday' | 'afternoon' | 'evening'
 * Returns JSON: { slot, date, sent: [{ studentId, messageId, percent, tokens: [] }], skipped: [...] }
 * Intended for service_role (Apps Script) or pg_cron.
 */
create or replace function public.run_chat_auto_messages(p_slot text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot text := lower(trim(p_slot));
  v_today date := (timezone('Europe/Istanbul', now()))::date;
  v_student record;
  v_thread public.chat_threads;
  v_last_sender uuid;
  v_percent integer;
  v_body text;
  v_admin_id uuid;
  v_message_id uuid;
  v_sent jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
  v_tokens jsonb;
begin
  if v_slot not in ('midday', 'afternoon', 'evening') then
    raise exception 'Invalid slot: % (use midday, afternoon, evening)', p_slot;
  end if;

  for v_student in
    select p.id, p.organization_id, p.display_name
    from public.profiles p
    where p.role = 'student'
      and p.is_active = true
  loop
    -- Idempotency: already processed this slot today
    if exists (
      select 1 from public.chat_auto_message_log l
      where l.student_id = v_student.id
        and l.slot = v_slot
        and l.run_date = v_today
    ) then
      v_skipped := v_skipped || jsonb_build_array(jsonb_build_object(
        'studentId', v_student.id,
        'reason', 'already_ran'
      ));
      continue;
    end if;

    -- Ensure thread
    select * into v_thread from public.chat_threads where student_id = v_student.id;
    if v_thread.id is null then
      insert into public.chat_threads (student_id)
      values (v_student.id)
      returning * into v_thread;
    end if;

    -- 1) Student has the last word → skip
    select m.sender_id into v_last_sender
    from public.chat_messages m
    where m.thread_id = v_thread.id
    order by m.created_at desc
    limit 1;

    if v_last_sender is not null and v_last_sender = v_student.id then
      insert into public.chat_auto_message_log (student_id, slot, run_date, skipped_reason)
      values (v_student.id, v_slot, v_today, 'student_last_word')
      on conflict do nothing;
      v_skipped := v_skipped || jsonb_build_array(jsonb_build_object(
        'studentId', v_student.id,
        'reason', 'student_last_word'
      ));
      continue;
    end if;

    -- 2) No tasks today → skip
    v_percent := public.student_day_completion_percent(v_student.id, v_today);
    if v_percent is null then
      insert into public.chat_auto_message_log (student_id, slot, run_date, skipped_reason)
      values (v_student.id, v_slot, v_today, 'no_tasks')
      on conflict do nothing;
      v_skipped := v_skipped || jsonb_build_array(jsonb_build_object(
        'studentId', v_student.id,
        'reason', 'no_tasks'
      ));
      continue;
    end if;

    -- 3) Build + send
    v_body := public.chat_auto_message_body(v_slot, v_percent);
    if v_body is null then
      continue;
    end if;

    select p.id into v_admin_id
    from public.profiles p
    where p.organization_id = v_student.organization_id
      and p.role = 'admin'
      and p.is_active = true
    order by p.created_at
    limit 1;

    insert into public.chat_messages (
      thread_id,
      sender_id,
      body,
      message_type
    )
    values (
      v_thread.id,
      v_admin_id,
      v_body,
      'system'
    )
    returning id into v_message_id;

    insert into public.chat_auto_message_log (student_id, slot, run_date, message_id)
    values (v_student.id, v_slot, v_today, v_message_id)
    on conflict do nothing;

    select coalesce(jsonb_agg(pt.token), '[]'::jsonb) into v_tokens
    from public.push_tokens pt
    where pt.user_id = v_student.id;

    v_sent := v_sent || jsonb_build_array(jsonb_build_object(
      'studentId', v_student.id,
      'messageId', v_message_id,
      'percent', v_percent,
      'tokens', v_tokens
    ));
  end loop;

  return jsonb_build_object(
    'slot', v_slot,
    'date', v_today,
    'sent', v_sent,
    'skipped', v_skipped
  );
end;
$$;

revoke all on function public.run_chat_auto_messages(text) from public;
grant execute on function public.run_chat_auto_messages(text) to service_role;

comment on function public.run_chat_auto_messages(text) is
  'Scheduled auto chat messages. Slots: midday (12:30), afternoon (16:45), evening (21:00) Europe/Istanbul.';
