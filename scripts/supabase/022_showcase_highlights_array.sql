-- =============================================================================
-- Multi-pill showcase highlights (0..n per student)
-- Run in Supabase SQL Editor after 001–021.
-- Converts profiles.showcase_highlight from text → text[].
-- Existing non-empty strings become single-element arrays.
-- =============================================================================

alter table public.profiles
  alter column showcase_highlight drop default;

alter table public.profiles
  alter column showcase_highlight type text[]
  using case
    when showcase_highlight is null then '{}'::text[]
    when btrim(showcase_highlight) = '' then '{}'::text[]
    else array[btrim(showcase_highlight)]
  end;

alter table public.profiles
  alter column showcase_highlight set default '{}'::text[];

alter table public.profiles
  alter column showcase_highlight set not null;

comment on column public.profiles.showcase_highlight is
  'Public showcase pills (0..n). Empty array = hide featured pills.';

-- Public /ogrenciler summaries: emit JSON array under showcaseHighlights
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
        'showcaseHighlights', to_jsonb(coalesce(p.showcase_highlight, '{}'::text[]))
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
