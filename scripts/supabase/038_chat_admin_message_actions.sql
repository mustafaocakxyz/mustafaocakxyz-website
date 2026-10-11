-- =============================================================================
-- Admin chat: edit/delete own messages, mark a thread unread
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- After 037. Safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.chat_messages
  add column if not exists edited_at timestamptz;

comment on column public.chat_messages.edited_at is
  'Set when an admin edits the message body. Null until the first edit.';

alter table public.chat_threads
  add column if not exists admin_marked_unread boolean not null default false;

alter table public.chat_threads
  add column if not exists admin_read_revision bigint not null default 0;

comment on column public.chat_threads.admin_marked_unread is
  'Admin explicitly marked the thread unread. Cleared by mark_chat_thread_read.';

comment on column public.chat_threads.admin_read_revision is
  'Bumped by mark_chat_thread_unread so an in-flight mark-read cannot clear it.';

-- Realtime DELETE/UPDATE filters need thread_id on the old row.
alter table public.chat_messages replica identity full;

-- ---------------------------------------------------------------------------
-- Only the text body of a message may change
-- ---------------------------------------------------------------------------

create or replace function public.chat_messages_guard_own_edit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id
    or new.organization_id is distinct from old.organization_id
    or new.thread_id is distinct from old.thread_id
    or new.sender_id is distinct from old.sender_id
    or new.message_type is distinct from old.message_type
    or new.attachment_path is distinct from old.attachment_path
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Only message text can be edited';
  end if;

  if new.body is not distinct from old.body then
    new.edited_at := old.edited_at;
    return new;
  end if;

  new.edited_at := now();
  return new;
end;
$$;

drop trigger if exists chat_messages_guard_own_edit on public.chat_messages;
create trigger chat_messages_guard_own_edit
before update on public.chat_messages
for each row execute function public.chat_messages_guard_own_edit();

-- ---------------------------------------------------------------------------
-- Keep inbox preview in sync after an edit or delete
-- ---------------------------------------------------------------------------

create or replace function public.chat_threads_apply_latest_preview(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_latest public.chat_messages;
begin
  select *
  into v_latest
  from public.chat_messages
  where thread_id = p_thread_id
  order by created_at desc, id desc
  limit 1;

  if v_latest.id is null then
    update public.chat_threads
    set
      last_message_at = null,
      last_message_preview = null,
      last_message_type = null,
      last_sender_id = null,
      updated_at = now()
    where id = p_thread_id;
    return;
  end if;

  update public.chat_threads
  set
    last_message_at = v_latest.created_at,
    last_message_preview = public.chat_message_preview_text(v_latest.message_type, v_latest.body),
    last_message_type = v_latest.message_type,
    last_sender_id = v_latest.sender_id,
    updated_at = now()
  where id = p_thread_id;
end;
$$;

revoke all on function public.chat_threads_apply_latest_preview(uuid) from public, anon, authenticated;

create or replace function public.chat_messages_refresh_preview_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if exists (
      select 1
      from public.chat_messages
      where thread_id = new.thread_id
        and created_at > new.created_at
    ) then
      return null;
    end if;
    perform public.chat_threads_apply_latest_preview(new.thread_id);
    return null;
  end if;

  if tg_op = 'DELETE' then
    perform public.chat_threads_apply_latest_preview(old.thread_id);
  end if;

  return null;
end;
$$;

drop trigger if exists chat_messages_refresh_preview_on_update on public.chat_messages;
create trigger chat_messages_refresh_preview_on_update
after update of body on public.chat_messages
for each row
when (old.body is distinct from new.body)
execute function public.chat_messages_refresh_preview_after_change();

drop trigger if exists chat_messages_refresh_preview_on_delete on public.chat_messages;
create trigger chat_messages_refresh_preview_on_delete
after delete on public.chat_messages
for each row execute function public.chat_messages_refresh_preview_after_change();

-- ---------------------------------------------------------------------------
-- RLS: admins may edit or delete only their own non-system messages
-- ---------------------------------------------------------------------------

drop policy if exists "admins can update own chat messages" on public.chat_messages;
create policy "admins can update own chat messages"
on public.chat_messages
for update
to authenticated
using (
  sender_id = auth.uid()
  and message_type <> 'system'
  and public.auth_is_admin()
  and organization_id = public.auth_organization_id()
)
with check (
  sender_id = auth.uid()
  and message_type <> 'system'
  and public.auth_is_admin()
  and organization_id = public.auth_organization_id()
);

drop policy if exists "admins can delete own chat messages" on public.chat_messages;
create policy "admins can delete own chat messages"
on public.chat_messages
for delete
to authenticated
using (
  sender_id = auth.uid()
  and message_type <> 'system'
  and public.auth_is_admin()
  and organization_id = public.auth_organization_id()
);

grant update, delete on public.chat_messages to authenticated;

drop policy if exists "chat attachment delete for admins" on storage.objects;
create policy "chat attachment delete for admins"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'chat-attachments'
  and public.auth_is_admin()
  and exists (
    select 1
    from public.chat_threads t
    where t.id::text = (storage.foldername(name))[1]
      and t.organization_id = public.auth_organization_id()
  )
);

-- ---------------------------------------------------------------------------
-- Mark read clears a manual unread. Optional revision ignores stale reads.
-- ---------------------------------------------------------------------------

drop function if exists public.mark_chat_thread_read(uuid);

create or replace function public.mark_chat_thread_read(
  p_thread_id uuid,
  p_revision bigint default null
)
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
    admin_marked_unread = false,
    updated_at = now()
  where id = p_thread_id
    and organization_id = public.auth_organization_id()
    and (
      p_revision is null
      or admin_read_revision = p_revision
    )
  returning * into v_thread;

  if v_thread.id is null then
    select * into v_thread
    from public.chat_threads
    where id = p_thread_id
      and organization_id = public.auth_organization_id();

    if v_thread.id is null then
      raise exception 'Chat thread not found';
    end if;
  end if;

  return v_thread;
end;
$$;

revoke all on function public.mark_chat_thread_read(uuid, bigint) from public;
grant execute on function public.mark_chat_thread_read(uuid, bigint) to authenticated;

create or replace function public.mark_chat_thread_unread(p_thread_id uuid)
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
    raise exception 'Only admins can mark chat threads unread';
  end if;

  update public.chat_threads
  set
    admin_marked_unread = true,
    admin_read_revision = admin_read_revision + 1,
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

revoke all on function public.mark_chat_thread_unread(uuid) from public;
grant execute on function public.mark_chat_thread_unread(uuid) to authenticated;

notify pgrst, 'reload schema';
