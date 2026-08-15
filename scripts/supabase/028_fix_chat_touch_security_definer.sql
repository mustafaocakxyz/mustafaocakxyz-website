-- =============================================================================
-- Fix: chat_messages_touch_thread must bypass RLS so student inserts update
-- preview + unread on chat_threads.
--
-- Bug: trigger ran as the inserting user. Admins can UPDATE chat_threads;
-- students cannot. Student message inserts succeeded, but the thread row was
-- not updated (0 rows) → inbox preview stuck on last admin message and
-- admin_unread_count never incremented.
--
-- Run in: Supabase Dashboard → SQL Editor → paste → Run
-- After 027_chat_inbox.sql.
-- =============================================================================

create or replace function public.chat_messages_touch_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
begin
  select student_id into v_student_id
  from public.chat_threads
  where id = new.thread_id;

  update public.chat_threads
  set
    last_message_at = new.created_at,
    last_message_preview = public.chat_message_preview_text(new.message_type, new.body),
    last_message_type = new.message_type,
    last_sender_id = new.sender_id,
    admin_unread_count = case
      when new.message_type = 'system' then admin_unread_count
      when new.sender_id is not distinct from v_student_id then admin_unread_count + 1
      else admin_unread_count
    end,
    updated_at = now()
  where id = new.thread_id;

  return new;
end;
$$;

revoke all on function public.chat_messages_touch_thread() from public;

-- Re-sync inbox fields from the true latest message per thread.
with latest as (
  select distinct on (m.thread_id)
    m.thread_id,
    m.created_at,
    m.message_type,
    m.body,
    m.sender_id
  from public.chat_messages m
  order by m.thread_id, m.created_at desc
),
unread as (
  select
    t.id as thread_id,
    count(*)::integer as unread_count
  from public.chat_threads t
  join public.chat_messages m on m.thread_id = t.id
  where m.sender_id is not distinct from t.student_id
    and m.message_type is distinct from 'system'
    and (
      t.admin_last_read_at is null
      or m.created_at > t.admin_last_read_at
    )
  group by t.id
)
update public.chat_threads t
set
  last_message_at = latest.created_at,
  last_message_preview = public.chat_message_preview_text(latest.message_type, latest.body),
  last_message_type = latest.message_type,
  last_sender_id = latest.sender_id,
  admin_unread_count = coalesce(unread.unread_count, 0),
  updated_at = now()
from latest
left join unread on unread.thread_id = latest.thread_id
where t.id = latest.thread_id;
