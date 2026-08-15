-- =============================================================================
-- Chat inbox: last-message preview + admin unread (WhatsApp-style list)
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- After 016–020 (chat).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Columns on chat_threads
-- ---------------------------------------------------------------------------

alter table public.chat_threads
  add column if not exists last_message_preview text,
  add column if not exists last_message_type text,
  add column if not exists last_sender_id uuid references public.profiles (id) on delete set null,
  add column if not exists admin_last_read_at timestamptz,
  add column if not exists admin_unread_count integer not null default 0;

alter table public.chat_threads
  drop constraint if exists chat_threads_last_message_type_check;

alter table public.chat_threads
  add constraint chat_threads_last_message_type_check
  check (
    last_message_type is null
    or last_message_type in ('text', 'image', 'document', 'voice', 'system')
  );

alter table public.chat_threads
  drop constraint if exists chat_threads_admin_unread_nonneg;

alter table public.chat_threads
  add constraint chat_threads_admin_unread_nonneg
  check (admin_unread_count >= 0);

-- ---------------------------------------------------------------------------
-- Preview helper + touch trigger (preview + unread increment)
-- ---------------------------------------------------------------------------

create or replace function public.chat_message_preview_text(
  p_type text,
  p_body text
)
returns text
language plpgsql
immutable
as $$
declare
  v_body text := trim(coalesce(p_body, ''));
begin
  if p_type = 'image' then
    return case when v_body <> '' then v_body else 'Fotoğraf' end;
  elsif p_type = 'document' then
    return case when v_body <> '' then v_body else 'Belge' end;
  elsif p_type = 'voice' then
    return 'Sesli mesaj';
  elsif p_type = 'system' then
    return case when v_body <> '' then left(v_body, 120) else 'Sistem' end;
  else
    return left(v_body, 120);
  end if;
end;
$$;

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

drop trigger if exists chat_messages_touch_thread on public.chat_messages;
create trigger chat_messages_touch_thread
after insert on public.chat_messages
for each row execute function public.chat_messages_touch_thread();

-- ---------------------------------------------------------------------------
-- Mark thread read (admin opens conversation)
-- ---------------------------------------------------------------------------

create or replace function public.mark_chat_thread_read(p_thread_id uuid)
returns public.chat_threads
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread public.chat_threads;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.auth_is_admin() then
    raise exception 'Only admins can mark chat threads read';
  end if;

  update public.chat_threads
  set
    admin_last_read_at = now(),
    admin_unread_count = 0,
    updated_at = now()
  where id = p_thread_id
    and organization_id = public.auth_organization_id()
  returning * into v_thread;

  if v_thread.id is null then
    raise exception 'Chat thread not found';
  end if;

  return v_thread;
end;
$$;

revoke all on function public.mark_chat_thread_read(uuid) from public;
grant execute on function public.mark_chat_thread_read(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Admin can update read fields (fallback; prefer RPC)
-- ---------------------------------------------------------------------------

drop policy if exists "admins can update organization chat threads" on public.chat_threads;
create policy "admins can update organization chat threads"
on public.chat_threads
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

grant update on public.chat_threads to authenticated;

-- ---------------------------------------------------------------------------
-- Backfill preview from latest message; start unread at 0 for existing history
-- ---------------------------------------------------------------------------

with latest as (
  select distinct on (m.thread_id)
    m.thread_id,
    m.created_at,
    m.message_type,
    m.body,
    m.sender_id
  from public.chat_messages m
  order by m.thread_id, m.created_at desc
)
update public.chat_threads t
set
  last_message_at = coalesce(t.last_message_at, latest.created_at),
  last_message_preview = public.chat_message_preview_text(latest.message_type, latest.body),
  last_message_type = latest.message_type,
  last_sender_id = latest.sender_id,
  admin_last_read_at = coalesce(t.admin_last_read_at, coalesce(t.last_message_at, latest.created_at, now())),
  admin_unread_count = 0
from latest
where t.id = latest.thread_id;

update public.chat_threads
set admin_last_read_at = coalesce(admin_last_read_at, now())
where admin_last_read_at is null;

-- ---------------------------------------------------------------------------
-- Realtime: thread updates so admin inbox stays live
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.chat_threads;
exception
  when duplicate_object then null;
end;
$$;

comment on column public.chat_threads.last_message_preview is
  'Short preview for admin/student inbox list.';
comment on column public.chat_threads.admin_unread_count is
  'Unread student messages for admin inbox; cleared by mark_chat_thread_read.';
