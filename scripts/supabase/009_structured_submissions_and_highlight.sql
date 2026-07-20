-- =============================================================================
-- Structured daily form fields + showcase highlight
-- Soft legacy: keep uyku_uyanma / gunluk_calisma / ekran_suresi text columns.
-- Run in Supabase SQL Editor after 001–008.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- daily_submissions: typed columns (nullable = not filled yet)
-- ---------------------------------------------------------------------------

alter table public.daily_submissions
  add column if not exists uyuma_saati time,
  add column if not exists uyanma_saati time,
  add column if not exists gunluk_calisma_saat numeric(4, 1),
  add column if not exists ekran_suresi_saat numeric(4, 1);

alter table public.daily_submissions
  drop constraint if exists daily_submissions_gunluk_calisma_saat_range;

alter table public.daily_submissions
  add constraint daily_submissions_gunluk_calisma_saat_range
  check (
    gunluk_calisma_saat is null
    or (gunluk_calisma_saat >= 0 and gunluk_calisma_saat <= 12)
  );

alter table public.daily_submissions
  drop constraint if exists daily_submissions_ekran_suresi_saat_range;

alter table public.daily_submissions
  add constraint daily_submissions_ekran_suresi_saat_range
  check (
    ekran_suresi_saat is null
    or (ekran_suresi_saat >= 0 and ekran_suresi_saat <= 12)
  );

-- ---------------------------------------------------------------------------
-- profiles: featured success free text for public showcase (admin-edited)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists showcase_highlight text not null default '';

comment on column public.profiles.showcase_highlight is
  'Public featured-success text. Empty string = hide featured card.';

-- ---------------------------------------------------------------------------
-- export_student_json: emit structured fields
-- ---------------------------------------------------------------------------

create or replace function public.export_student_json(
  p_student_id uuid,
  p_from_date date default null,
  p_to_date date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org public.organizations;
  v_student public.profiles;
  v_days jsonb;
begin
  if not public.auth_is_admin() then
    raise exception 'Only admins can export data';
  end if;

  select p.*
  into v_student
  from public.profiles p
  where p.id = p_student_id
    and p.organization_id = public.auth_organization_id()
    and p.role = 'student';

  if v_student.id is null then
    raise exception 'Student not found in your organization';
  end if;

  select o.* into v_org from public.organizations o where o.id = v_student.organization_id;

  with date_spine as (
    select distinct d::date as day_date
    from (
      select task_date as d from public.daily_tasks where student_id = p_student_id
      union
      select submission_date as d from public.daily_submissions where student_id = p_student_id
    ) src
    where (p_from_date is null or d >= p_from_date)
      and (p_to_date is null or d <= p_to_date)
    order by d
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', to_char(ds.day_date, 'YYYY-MM-DD'),
        'tasks', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', t.id,
                'label', t.label,
                'completed', t.completed,
                'sortOrder', t.sort_order,
                'updatedAt', t.updated_at
              )
              order by t.sort_order, t.created_at
            )
            from public.daily_tasks t
            where t.student_id = p_student_id
              and t.task_date = ds.day_date
          ),
          '[]'::jsonb
        ),
        'submission', (
          select jsonb_build_object(
            'uyumaSaati', case
              when s.uyuma_saati is null then null
              else to_char(s.uyuma_saati, 'HH24:MI')
            end,
            'uyanmaSaati', case
              when s.uyanma_saati is null then null
              else to_char(s.uyanma_saati, 'HH24:MI')
            end,
            'gunlukCalismaSaat', s.gunluk_calisma_saat,
            'ekranSuresiSaat', s.ekran_suresi_saat,
            'notlar', s.notlar,
            'updatedAt', s.updated_at
          )
          from public.daily_submissions s
          where s.student_id = p_student_id
            and s.submission_date = ds.day_date
        )
      )
      order by ds.day_date
    ),
    '[]'::jsonb
  )
  into v_days
  from date_spine ds;

  return jsonb_build_object(
    'version', 2,
    'exportedAt', now(),
    'scope', 'student',
    'organization', jsonb_build_object(
      'id', v_org.id,
      'name', v_org.name,
      'slug', v_org.slug
    ),
    'filters', jsonb_build_object(
      'fromDate', p_from_date,
      'toDate', p_to_date
    ),
    'student', jsonb_build_object(
      'id', v_student.id,
      'displayName', v_student.display_name,
      'loginUsername', v_student.login_username,
      'role', v_student.role,
      'showcaseHighlight', v_student.showcase_highlight
    ),
    'days', v_days
  );
end;
$$;
