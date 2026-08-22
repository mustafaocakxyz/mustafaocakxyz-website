-- =============================================================================
-- Admin password reset via RPC + http extension (no Edge Function / CORS)
-- Run in Supabase SQL Editor after 033_password_reset_requests.sql
--
-- ONE-TIME: store service role key in Vault (Dashboard → Project Settings → API):
--
--   select vault.create_secret(
--     '<PASTE_SERVICE_ROLE_SECRET_HERE>',
--     'supabase_service_role_key',
--     'Auth admin API for admin_reset_student_password'
--   );
--
-- If the secret already exists, rotate with vault.update_secret or delete + recreate.
-- =============================================================================

create extension if not exists http with schema extensions;
create extension if not exists supabase_vault with schema vault;

create or replace function public.admin_reset_student_password(
  p_student_id uuid,
  p_new_password text,
  p_request_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  v_service_key text;
  v_supabase_url text := 'https://cngmoqwmxucrtqryrtat.supabase.co';
  v_status_code integer;
  v_body text;
  v_profile public.profiles%rowtype;
begin
  if not public.auth_is_admin() then
    return jsonb_build_object('ok', false, 'error', 'Unauthorized');
  end if;

  if coalesce(length(trim(p_new_password)), 0) < 6 then
    return jsonb_build_object('ok', false, 'error', 'Şifre en az 6 karakter olmalı.');
  end if;

  select * into v_profile
  from public.profiles
  where id = p_student_id
    and role = 'student'
    and is_active = true
    and organization_id = public.auth_organization_id();

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Öğrenci bulunamadı.');
  end if;

  select ds.decrypted_secret
  into v_service_key
  from vault.decrypted_secrets ds
  where ds.name = 'supabase_service_role_key'
  limit 1;

  if v_service_key is null or length(trim(v_service_key)) = 0 then
    return jsonb_build_object(
      'ok', false,
      'error', 'Service role key yapılandırılmamış. Vault''a supabase_service_role_key ekleyin.'
    );
  end if;

  select r.status, r.content
  into v_status_code, v_body
  from extensions.http((
    'PUT',
    v_supabase_url || '/auth/v1/admin/users/' || p_student_id::text,
    array[
      extensions.http_header('Authorization', 'Bearer ' || v_service_key),
      extensions.http_header('apikey', v_service_key),
      extensions.http_header('Content-Type', 'application/json')
    ],
    'application/json',
    jsonb_build_object('password', p_new_password)::text
  )::extensions.http_request) as r;

  if v_status_code is distinct from 200 then
    return jsonb_build_object(
      'ok', false,
      'error', coalesce(nullif(trim(v_body), ''), 'Auth API şifre güncellemesi başarısız.')
    );
  end if;

  if p_request_id is not null then
    update public.password_reset_requests
    set status = 'completed',
        completed_at = now(),
        completed_by = auth.uid()
    where id = p_request_id
      and organization_id = public.auth_organization_id()
      and status = 'pending';
  else
    update public.password_reset_requests
    set status = 'completed',
        completed_at = now(),
        completed_by = auth.uid()
    where user_id = p_student_id
      and organization_id = public.auth_organization_id()
      and status = 'pending';
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.admin_reset_student_password(uuid, text, uuid) from public;
grant execute on function public.admin_reset_student_password(uuid, text, uuid) to authenticated;

comment on function public.admin_reset_student_password(uuid, text, uuid) is
  'Admin-only: set student auth password via GoTrue Admin API (http PUT). Requires vault secret supabase_service_role_key.';

comment on table public.password_reset_requests is
  'Student password reset queue. Password change via admin_reset_student_password RPC.';
