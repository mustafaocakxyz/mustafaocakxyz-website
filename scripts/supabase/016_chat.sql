-- =============================================================================
-- Chat (student ↔ admin) — text foundation; attachments later (Steps 8–9)
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- After 001–015.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chat_threads_student_unique unique (student_id)
);

create index if not exists chat_threads_org_last_message_idx
  on public.chat_threads (organization_id, last_message_at desc nulls last);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  thread_id uuid not null references public.chat_threads (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  body text not null default '',
  message_type text not null default 'text',
  attachment_path text,
  created_at timestamptz not null default now(),
  constraint chat_messages_type_check check (
    message_type in ('text', 'image', 'document', 'voice', 'system')
  ),
  constraint chat_messages_body_or_attachment check (
    length(trim(body)) > 0
    or attachment_path is not null
    or message_type = 'system'
  )
);

create index if not exists chat_messages_thread_created_idx
  on public.chat_messages (thread_id, created_at);

create index if not exists chat_messages_org_created_idx
  on public.chat_messages (organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists chat_threads_set_organization on public.chat_threads;
create trigger chat_threads_set_organization
before insert or update of student_id on public.chat_threads
for each row execute function public.set_row_organization_from_student();

drop trigger if exists chat_threads_set_updated_at on public.chat_threads;
create trigger chat_threads_set_updated_at
before update on public.chat_threads
for each row execute function public.set_updated_at();

create or replace function public.chat_messages_set_organization()
returns trigger
language plpgsql
as $$
declare
  v_org_id uuid;
begin
  select organization_id into v_org_id
  from public.chat_threads
  where id = new.thread_id;

  if v_org_id is null then
    raise exception 'Chat thread not found for id %', new.thread_id;
  end if;

  new.organization_id := v_org_id;
  return new;
end;
$$;

drop trigger if exists chat_messages_set_organization on public.chat_messages;
create trigger chat_messages_set_organization
before insert or update of thread_id on public.chat_messages
for each row execute function public.chat_messages_set_organization();

create or replace function public.chat_messages_touch_thread()
returns trigger
language plpgsql
as $$
begin
  update public.chat_threads
  set last_message_at = new.created_at,
      updated_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists chat_messages_touch_thread on public.chat_messages;
create trigger chat_messages_touch_thread
after insert on public.chat_messages
for each row execute function public.chat_messages_touch_thread();

-- ---------------------------------------------------------------------------
-- Ensure thread for a student (student self or admin in same org)
-- ---------------------------------------------------------------------------

create or replace function public.ensure_chat_thread(p_student_id uuid)
returns public.chat_threads
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role public.app_role;
  v_caller_org uuid;
  v_student_org uuid;
  v_student_role public.app_role;
  v_thread public.chat_threads;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select role, organization_id
  into v_caller_role, v_caller_org
  from public.profiles
  where id = auth.uid() and is_active = true;

  if v_caller_role is null then
    raise exception 'Profile not found';
  end if;

  select organization_id, role
  into v_student_org, v_student_role
  from public.profiles
  where id = p_student_id and is_active = true;

  if v_student_role is distinct from 'student' then
    raise exception 'Thread target must be an active student';
  end if;

  if v_caller_role = 'student' then
    if auth.uid() is distinct from p_student_id then
      raise exception 'Students can only open their own chat thread';
    end if;
  elsif v_caller_role = 'admin' then
    if v_caller_org is distinct from v_student_org then
      raise exception 'Student is outside admin organization';
    end if;
  else
    raise exception 'Unauthorized';
  end if;

  select * into v_thread
  from public.chat_threads
  where student_id = p_student_id;

  if v_thread.id is null then
    insert into public.chat_threads (student_id)
    values (p_student_id)
    returning * into v_thread;
  end if;

  return v_thread;
end;
$$;

revoke all on function public.ensure_chat_thread(uuid) from public;
grant execute on function public.ensure_chat_thread(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "students can read own chat thread" on public.chat_threads;
create policy "students can read own chat thread"
on public.chat_threads
for select
to authenticated
using (student_id = auth.uid());

drop policy if exists "admins can read organization chat threads" on public.chat_threads;
create policy "admins can read organization chat threads"
on public.chat_threads
for select
to authenticated
using (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
);

-- Inserts go through ensure_chat_thread (security definer). No direct insert policy needed
-- for clients, but allow admin/student insert matching ensure rules as a fallback:
drop policy if exists "participants can insert chat threads" on public.chat_threads;
create policy "participants can insert chat threads"
on public.chat_threads
for insert
to authenticated
with check (
  (
    student_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student' and p.is_active
    )
  )
  or (
    public.auth_is_admin()
    and organization_id = public.auth_organization_id()
    and exists (
      select 1 from public.profiles p
      where p.id = student_id
        and p.organization_id = public.auth_organization_id()
        and p.role = 'student'
        and p.is_active
    )
  )
);

drop policy if exists "students can read own chat messages" on public.chat_messages;
create policy "students can read own chat messages"
on public.chat_messages
for select
to authenticated
using (
  exists (
    select 1 from public.chat_threads t
    where t.id = thread_id and t.student_id = auth.uid()
  )
);

drop policy if exists "admins can read organization chat messages" on public.chat_messages;
create policy "admins can read organization chat messages"
on public.chat_messages
for select
to authenticated
using (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
);

drop policy if exists "students can send own chat messages" on public.chat_messages;
create policy "students can send own chat messages"
on public.chat_messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and message_type in ('text', 'image', 'document', 'voice')
  and exists (
    select 1 from public.chat_threads t
    where t.id = thread_id and t.student_id = auth.uid()
  )
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'student' and p.is_active
  )
);

drop policy if exists "admins can send organization chat messages" on public.chat_messages;
create policy "admins can send organization chat messages"
on public.chat_messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and message_type in ('text', 'image', 'document', 'voice', 'system')
  and public.auth_is_admin()
  and organization_id = public.auth_organization_id()
  and exists (
    select 1 from public.chat_threads t
    where t.id = thread_id
      and t.organization_id = public.auth_organization_id()
  )
);

grant select, insert on public.chat_threads to authenticated;
grant select, insert on public.chat_messages to authenticated;
grant select on public.chat_threads to anon;
grant select on public.chat_messages to anon;

comment on table public.chat_threads is
  'One chat thread per student with org admin(s).';
comment on table public.chat_messages is
  'Messages in a student↔admin thread. Text now; media types reserved for later.';

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage bucket (for Steps 8–9; safe to create now)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  false,
  20971520,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'audio/mpeg',
    'audio/mp4',
    'audio/m4a',
    'audio/aac',
    'audio/wav',
    'audio/x-wav',
    'audio/webm'
  ]
)
on conflict (id) do nothing;

-- Path convention: {thread_id}/{message_id}/{filename}
drop policy if exists "chat attachment read for participants" on storage.objects;
create policy "chat attachment read for participants"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'chat-attachments'
  and (
    public.auth_is_admin()
    or exists (
      select 1
      from public.chat_threads t
      where t.id::text = (storage.foldername(name))[1]
        and t.student_id = auth.uid()
    )
  )
);

drop policy if exists "chat attachment upload for participants" on storage.objects;
create policy "chat attachment upload for participants"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'chat-attachments'
  and (
    (
      public.auth_is_admin()
      and exists (
        select 1
        from public.chat_threads t
        where t.id::text = (storage.foldername(name))[1]
          and t.organization_id = public.auth_organization_id()
      )
    )
    or exists (
      select 1
      from public.chat_threads t
      where t.id::text = (storage.foldername(name))[1]
        and t.student_id = auth.uid()
    )
  )
);
