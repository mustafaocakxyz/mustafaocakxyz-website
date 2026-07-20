-- =============================================================================
-- Public active student count for homepage teaser
-- Same definition as admin list: role = student AND is_active = true
-- Returns only an integer — safe to expose to anon.
-- =============================================================================

create or replace function public.public_active_student_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.profiles p
  inner join public.organizations o on o.id = p.organization_id
  where p.role = 'student'
    and p.is_active = true
    and o.slug = 'gelisim';
$$;

revoke all on function public.public_active_student_count() from public;
grant execute on function public.public_active_student_count() to anon, authenticated;
