-- =============================================================================
-- Public student showcase summaries (name + join date + featured highlight)
-- Safe for anon: no emails, phones, or submission content.
-- =============================================================================

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
      order by p.created_at asc, p.display_name asc
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
