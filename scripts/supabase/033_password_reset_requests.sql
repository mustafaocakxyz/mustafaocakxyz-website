-- =============================================================================
-- Password reset requests (student public form → admin sets new password)
-- Run in Supabase SQL Editor after 021_account_deletion.sql
-- Then run 034_admin_reset_password_rpc.sql (admin password change; no Edge Function)
-- =============================================================================

create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,
  login_username text not null,
  note text not null default '',
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  completed_by uuid references public.profiles (id) on delete set null,
  constraint password_reset_requests_status_check check (
    status in ('pending', 'completed', 'rejected')
  )
);

create index if not exists password_reset_requests_status_idx
  on public.password_reset_requests (status, requested_at desc);

create index if not exists password_reset_requests_username_idx
  on public.password_reset_requests (lower(login_username));

-- One open request per student at a time
create unique index if not exists password_reset_requests_one_pending_per_user
  on public.password_reset_requests (user_id)
  where status = 'pending' and user_id is not null;

alter table public.password_reset_requests enable row level security;

drop policy if exists "admins can read password reset requests" on public.password_reset_requests;
create policy "admins can read password reset requests"
on public.password_reset_requests
for select to authenticated
using (
  public.auth_is_admin()
  and organization_id = public.auth_organization_id()
);

drop policy if exists "admins can update password reset requests" on public.password_reset_requests;
create policy "admins can update password reset requests"
on public.password_reset_requests
for update to authenticated
using (
  public.auth_is_admin()
  and organization_id = public.auth_organization_id()
)
with check (
  public.auth_is_admin()
  and organization_id = public.auth_organization_id()
);

grant select, update on public.password_reset_requests to authenticated;

comment on table public.password_reset_requests is
  'Student password reset queue. Password change via admin_reset_student_password RPC (034).';

-- ---------------------------------------------------------------------------
-- Public RPC: request reset by login username (generic response)
-- ---------------------------------------------------------------------------

create or replace function public.request_password_reset(
  p_login_username text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text := lower(trim(coalesce(p_login_username, '')));
  v_note text := left(trim(coalesce(p_note, '')), 1000);
  v_profile public.profiles%rowtype;
begin
  if v_username = '' then
    return jsonb_build_object(
      'ok', false,
      'error', 'Kullanıcı adı gerekli.'
    );
  end if;

  select * into v_profile
  from public.profiles
  where lower(login_username) = v_username
    and role = 'student'
    and is_active = true
  limit 1;

  if found then
    delete from public.password_reset_requests
    where user_id = v_profile.id
      and status = 'pending';

    insert into public.password_reset_requests (
      user_id,
      organization_id,
      login_username,
      note,
      status
    )
    values (
      v_profile.id,
      v_profile.organization_id,
      v_profile.login_username,
      v_note,
      'pending'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'message',
      'Talebin alındı. Koçun en kısa sürede yeni şifreni iletecek.'
  );
end;
$$;

revoke all on function public.request_password_reset(text, text) from public;
grant execute on function public.request_password_reset(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin: reject a pending request
-- ---------------------------------------------------------------------------

create or replace function public.reject_password_reset_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.auth_is_admin() then
    raise exception 'Unauthorized';
  end if;

  update public.password_reset_requests
  set status = 'rejected',
      completed_at = now(),
      completed_by = auth.uid()
  where id = p_request_id
    and organization_id = public.auth_organization_id()
    and status = 'pending';
end;
$$;

revoke all on function public.reject_password_reset_request(uuid) from public;
grant execute on function public.reject_password_reset_request(uuid) to authenticated;
