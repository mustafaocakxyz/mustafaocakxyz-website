-- =============================================================================
-- Assistant hiring test. Isolated from the student app.
--
-- Creates schema assistant_test and public functions named assistant_test_* only.
-- Does not alter existing tables, policies, triggers, or functions.
-- Do not add schema assistant_test to Supabase "Exposed schemas".
-- The website cannot see this table until the test page is wired to these functions.
--
-- Run once in the Supabase SQL Editor.
-- =============================================================================

create schema if not exists assistant_test;

revoke all on schema assistant_test from public, anon, authenticated;

create table if not exists assistant_test.submissions (
  id uuid primary key default gen_random_uuid(),
  access_token uuid not null default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  answers jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  constraint assistant_test_submissions_first_name_len check (char_length(first_name) between 1 and 80),
  constraint assistant_test_submissions_last_name_len check (char_length(last_name) between 1 and 80),
  constraint assistant_test_submissions_answers_object check (jsonb_typeof(answers) = 'object')
);

create index if not exists assistant_test_submissions_submitted_idx
  on assistant_test.submissions (submitted_at desc nulls last, updated_at desc);

revoke all on assistant_test.submissions from public, anon, authenticated;

alter table assistant_test.submissions enable row level security;

comment on table assistant_test.submissions is
  'Hiring-test answers. No policies: only security-definer functions named assistant_test_* may touch this table.';

-- ---------------------------------------------------------------------------
-- Applicant functions. Token required. No read of other rows.
-- ---------------------------------------------------------------------------

create or replace function public.assistant_test_start(
  p_first_name text,
  p_last_name text
)
returns jsonb
language plpgsql
security definer
set search_path = assistant_test
as $$
declare
  v_first text := left(trim(coalesce(p_first_name, '')), 80);
  v_last text := left(trim(coalesce(p_last_name, '')), 80);
  v_row assistant_test.submissions%rowtype;
begin
  if v_first = '' or v_last = '' then
    return jsonb_build_object('ok', false, 'error', 'Ad ve soyad gerekli.');
  end if;

  insert into assistant_test.submissions (first_name, last_name)
  values (v_first, v_last)
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'id', v_row.id,
    'accessToken', v_row.access_token,
    'startedAt', v_row.started_at
  );
end;
$$;

create or replace function public.assistant_test_load(
  p_id uuid,
  p_access_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = assistant_test
as $$
declare
  v_row assistant_test.submissions%rowtype;
begin
  select * into v_row
  from assistant_test.submissions
  where id = p_id
    and access_token = p_access_token;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Oturum bulunamadı.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'id', v_row.id,
    'firstName', v_row.first_name,
    'lastName', v_row.last_name,
    'answers', v_row.answers,
    'startedAt', v_row.started_at,
    'updatedAt', v_row.updated_at,
    'submittedAt', v_row.submitted_at
  );
end;
$$;

create or replace function public.assistant_test_save(
  p_id uuid,
  p_access_token uuid,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = assistant_test
as $$
declare
  v_row assistant_test.submissions%rowtype;
begin
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    return jsonb_build_object('ok', false, 'error', 'Geçersiz yanıt.');
  end if;

  if octet_length(p_answers::text) > 400000 then
    return jsonb_build_object('ok', false, 'error', 'Yanıtlar çok uzun.');
  end if;

  update assistant_test.submissions
  set answers = p_answers,
      updated_at = now()
  where id = p_id
    and access_token = p_access_token
    and submitted_at is null
  returning * into v_row;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Oturum bulunamadı veya gönderilmiş.');
  end if;

  return jsonb_build_object('ok', true, 'updatedAt', v_row.updated_at);
end;
$$;

create or replace function public.assistant_test_submit(
  p_id uuid,
  p_access_token uuid,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = assistant_test
as $$
declare
  v_row assistant_test.submissions%rowtype;
begin
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    return jsonb_build_object('ok', false, 'error', 'Geçersiz yanıt.');
  end if;

  if octet_length(p_answers::text) > 400000 then
    return jsonb_build_object('ok', false, 'error', 'Yanıtlar çok uzun.');
  end if;

  update assistant_test.submissions
  set answers = p_answers,
      updated_at = now(),
      submitted_at = now()
  where id = p_id
    and access_token = p_access_token
    and submitted_at is null
  returning * into v_row;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Oturum bulunamadı veya gönderilmiş.');
  end if;

  return jsonb_build_object('ok', true, 'submittedAt', v_row.submitted_at);
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin reads. Checks the existing admin flag. Does not change it.
-- ---------------------------------------------------------------------------

create or replace function public.assistant_test_admin_list()
returns jsonb
language plpgsql
security definer
set search_path = assistant_test, public
as $$
begin
  if not public.auth_is_admin() then
    return jsonb_build_object('ok', false, 'error', 'Yetkisiz.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'submissions', coalesce((
      select jsonb_agg(row_to_json(s) order by s.sort_at desc)
      from (
        select
          id,
          first_name,
          last_name,
          started_at,
          updated_at,
          submitted_at,
          coalesce(submitted_at, updated_at) as sort_at
        from assistant_test.submissions
      ) s
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.assistant_test_admin_get(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = assistant_test, public
as $$
declare
  v_row assistant_test.submissions%rowtype;
begin
  if not public.auth_is_admin() then
    return jsonb_build_object('ok', false, 'error', 'Yetkisiz.');
  end if;

  select * into v_row
  from assistant_test.submissions
  where id = p_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Kayıt bulunamadı.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'id', v_row.id,
    'firstName', v_row.first_name,
    'lastName', v_row.last_name,
    'answers', v_row.answers,
    'startedAt', v_row.started_at,
    'updatedAt', v_row.updated_at,
    'submittedAt', v_row.submitted_at
  );
end;
$$;

revoke all on function public.assistant_test_start(text, text) from public, anon, authenticated;
revoke all on function public.assistant_test_load(uuid, uuid) from public, anon, authenticated;
revoke all on function public.assistant_test_save(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.assistant_test_submit(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.assistant_test_admin_list() from public, anon, authenticated;
revoke all on function public.assistant_test_admin_get(uuid) from public, anon, authenticated;

grant execute on function public.assistant_test_start(text, text) to anon;
grant execute on function public.assistant_test_load(uuid, uuid) to anon;
grant execute on function public.assistant_test_save(uuid, uuid, jsonb) to anon;
grant execute on function public.assistant_test_submit(uuid, uuid, jsonb) to anon;

grant execute on function public.assistant_test_admin_list() to authenticated;
grant execute on function public.assistant_test_admin_get(uuid) to authenticated;
