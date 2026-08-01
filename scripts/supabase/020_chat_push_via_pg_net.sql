-- =============================================================================
-- Server-side chat push (fixes browser CORS blocking Expo Push from admin web)
-- Run in: Supabase Dashboard → SQL Editor → paste → Run
-- After 018_push_and_auto_messages.sql
-- =============================================================================

create extension if not exists pg_net with schema extensions;

create or replace function public.chat_messages_notify_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_student_id uuid;
  v_body text;
  v_payload jsonb;
begin
  -- Only notify for non-system messages (auto-messages push via Apps Script)
  if new.message_type = 'system' then
    return new;
  end if;

  select t.student_id into v_student_id
  from public.chat_threads t
  where t.id = new.thread_id;

  if v_student_id is null then
    return new;
  end if;

  -- Student outbound messages: no self-notify
  if new.sender_id is not null and new.sender_id = v_student_id then
    return new;
  end if;

  v_body := case new.message_type
    when 'image' then 'Yeni bir görsel'
    when 'document' then 'Yeni bir belge'
    when 'voice' then 'Yeni bir sesli mesaj'
    else nullif(left(trim(coalesce(new.body, '')), 120), '')
  end;
  if v_body is null then
    v_body := 'Yeni bir mesajın var.';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'to', pt.token,
      'title', 'Gelişim',
      'body', v_body,
      'sound', 'default',
      'channelId', 'chat',
      'priority', 'high',
      'data', jsonb_build_object('type', 'chat', 'studentId', v_student_id::text)
    )
  )
  into v_payload
  from public.push_tokens pt
  where pt.user_id = v_student_id
    and pt.token like 'ExponentPushToken%';

  if v_payload is null or jsonb_array_length(v_payload) = 0 then
    return new;
  end if;

  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Accept', 'application/json'
    ),
    body := v_payload
  );

  return new;
end;
$$;

drop trigger if exists chat_messages_notify_push on public.chat_messages;
create trigger chat_messages_notify_push
after insert on public.chat_messages
for each row
execute function public.chat_messages_notify_push();

comment on function public.chat_messages_notify_push() is
  'After admin (or non-student) chat insert, POST Expo push via pg_net. Avoids browser CORS.';
