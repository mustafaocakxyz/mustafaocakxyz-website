-- =============================================================================
-- Account deletion requests (Play Console / App Store web deletion URL)
-- Run in: Supabase Dashboard → SQL Editor → paste → Run
-- After 018+ (push_tokens optional but cleared if present)
-- =============================================================================

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,
  login_username text not null,
  contact_email text,
  note text not null default '',
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint account_deletion_requests_status_check check (
    status in ('pending', 'completed', 'rejected')
  )
);

create index if not exists account_deletion_requests_status_idx
  on public.account_deletion_requests (status, requested_at desc);

create index if not exists account_deletion_requests_username_idx
  on public.account_deletion_requests (lower(login_username));

alter table public.account_deletion_requests enable row level security;

drop policy if exists "admins can read deletion requests" on public.account_deletion_requests;
create policy "admins can read deletion requests"
on public.account_deletion_requests
for select to authenticated
using (
  public.auth_is_admin()
  and organization_id = public.auth_organization_id()
);

grant select on public.account_deletion_requests to authenticated;

comment on table public.account_deletion_requests is
  'Web/app account deletion requests for store compliance. Soft-disable happens in RPC; hard delete of auth.users is admin/service follow-up.';

-- ---------------------------------------------------------------------------
-- Public RPC: request deletion by login username
-- - Students only (never disables admin)
-- - Immediately sets is_active = false + clears push tokens
-- - Always returns a generic success payload (no username enumeration)
-- ---------------------------------------------------------------------------

create or replace function public.request_account_deletion(
  p_login_username text,
  p_contact_email text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text := lower(trim(coalesce(p_login_username, '')));
  v_email text := nullif(trim(coalesce(p_contact_email, '')), '');
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
  limit 1;

  if found then
    insert into public.account_deletion_requests (
      user_id,
      organization_id,
      login_username,
      contact_email,
      note,
      status
    )
    values (
      v_profile.id,
      v_profile.organization_id,
      v_profile.login_username,
      v_email,
      v_note,
      'pending'
    );

    update public.profiles
    set is_active = false,
        updated_at = now()
    where id = v_profile.id
      and is_active = true;

    delete from public.push_tokens
    where user_id = v_profile.id;
  end if;

  -- Generic response whether or not the username matched
  return jsonb_build_object(
    'ok', true,
    'message',
      'Talebin alındı. Hesap bulunduysa erişim hemen kapatılır; kişisel veriler en geç 30 gün içinde silinir.'
  );
end;
$$;

revoke all on function public.request_account_deletion(text, text, text) from public;
grant execute on function public.request_account_deletion(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin helper: mark request completed after hard-deleting auth user (optional)
-- ---------------------------------------------------------------------------

create or replace function public.complete_account_deletion_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.auth_is_admin() then
    raise exception 'Unauthorized';
  end if;

  update public.account_deletion_requests
  set status = 'completed',
      completed_at = now()
  where id = p_request_id
    and organization_id = public.auth_organization_id();
end;
$$;

revoke all on function public.complete_account_deletion_request(uuid) from public;
grant execute on function public.complete_account_deletion_request(uuid) to authenticated;
