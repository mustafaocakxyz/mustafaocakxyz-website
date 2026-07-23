-- =============================================================================
-- Showcase list order for /ogrenciler (admin-controlled)
-- Run in Supabase SQL Editor after 001–011.
-- =============================================================================

alter table public.profiles
  add column if not exists showcase_sort_order integer not null default 0;

comment on column public.profiles.showcase_sort_order is
  'Public /ogrenciler list order. Lower = earlier. Admin-managed.';

-- Backfill existing students: oldest first within each org (stable starting order)
with ranked as (
  select
    id,
    row_number() over (
      partition by organization_id
      order by created_at asc, display_name asc
    ) - 1 as sort_order
  from public.profiles
  where role = 'student'
)
update public.profiles p
set showcase_sort_order = ranked.sort_order
from ranked
where p.id = ranked.id;

create index if not exists profiles_org_showcase_sort_idx
  on public.profiles (organization_id, showcase_sort_order, display_name);

-- New students go to the end of their org's showcase list
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_org_slug text;
  v_login_username text;
  v_display_name text;
  v_role public.app_role := 'student';
  v_sort_order integer := 0;
begin
  v_login_username := nullif(trim(lower(new.raw_user_meta_data ->> 'login_username')), '');
  if v_login_username is null then
    return new;
  end if;

  v_display_name := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
  if v_display_name is null then
    v_display_name := v_login_username;
  end if;

  v_org_slug := coalesce(nullif(trim(new.raw_user_meta_data ->> 'organization_slug'), ''), 'gelisim');

  select id
  into v_org_id
  from public.organizations
  where slug = v_org_slug;

  if v_org_id is null then
    raise exception 'Organization not found: %', v_org_slug;
  end if;

  select coalesce(max(showcase_sort_order), -1) + 1
  into v_sort_order
  from public.profiles
  where organization_id = v_org_id
    and role = 'student';

  insert into public.profiles (
    id,
    organization_id,
    role,
    display_name,
    login_username,
    auth_email,
    showcase_sort_order
  )
  values (
    new.id,
    v_org_id,
    v_role,
    v_display_name,
    v_login_username,
    new.email,
    v_sort_order
  );

  return new;
end;
$$;

-- Public showcase: order by admin sort, then name
create or replace function public.public_student_showcase_summaries()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'displayName', p.display_name,
        'createdAt', p.created_at,
        'showcaseHighlight', p.showcase_highlight
      )
      order by p.showcase_sort_order asc, p.display_name asc
    ),
    '[]'::jsonb
  )
  from public.profiles p
  inner join public.organizations o on o.id = p.organization_id
  where p.role = 'student'
    and p.is_active = true
    and o.slug = 'gelisim';
$$;

revoke all on function public.public_student_showcase_summaries() from public;
grant execute on function public.public_student_showcase_summaries() to anon, authenticated;
