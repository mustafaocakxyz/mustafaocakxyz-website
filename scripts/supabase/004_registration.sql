-- =============================================================================
-- Registration support — run AFTER 001_schema.sql and 003_grants.sql
-- Creates profile row automatically when a user signs up with metadata.
-- =============================================================================

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

  insert into public.profiles (
    id,
    organization_id,
    role,
    display_name,
    login_username,
    auth_email
  )
  values (
    new.id,
    v_org_id,
    v_role,
    v_display_name,
    v_login_username,
    new.email
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();
