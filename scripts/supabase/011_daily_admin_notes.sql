-- =============================================================================
-- Daily admin notes (coach → student, per student + per day)
-- Admin write / student read-only. Run in Supabase SQL Editor after 001–010.
-- =============================================================================

create table if not exists public.daily_admin_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  note_date date not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_admin_notes_student_date_unique unique (student_id, note_date)
);

create index if not exists daily_admin_notes_student_date_idx
  on public.daily_admin_notes (student_id, note_date);

create index if not exists daily_admin_notes_org_student_date_idx
  on public.daily_admin_notes (organization_id, student_id, note_date);

drop trigger if exists daily_admin_notes_set_organization on public.daily_admin_notes;
create trigger daily_admin_notes_set_organization
before insert or update of student_id on public.daily_admin_notes
for each row execute function public.set_row_organization_from_student();

drop trigger if exists daily_admin_notes_set_updated_at on public.daily_admin_notes;
create trigger daily_admin_notes_set_updated_at
before update on public.daily_admin_notes
for each row execute function public.set_updated_at();

alter table public.daily_admin_notes enable row level security;

drop policy if exists "students can read own admin notes" on public.daily_admin_notes;
create policy "students can read own admin notes"
on public.daily_admin_notes
for select
to authenticated
using (student_id = auth.uid());

drop policy if exists "admins can read organization admin notes" on public.daily_admin_notes;
create policy "admins can read organization admin notes"
on public.daily_admin_notes
for select
to authenticated
using (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
);

drop policy if exists "admins can insert organization admin notes" on public.daily_admin_notes;
create policy "admins can insert organization admin notes"
on public.daily_admin_notes
for insert
to authenticated
with check (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
  and exists (
    select 1
    from public.profiles p
    where p.id = student_id
      and p.organization_id = public.auth_organization_id()
      and p.role = 'student'
  )
);

drop policy if exists "admins can update organization admin notes" on public.daily_admin_notes;
create policy "admins can update organization admin notes"
on public.daily_admin_notes
for update
to authenticated
using (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
)
with check (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
);

drop policy if exists "admins can delete organization admin notes" on public.daily_admin_notes;
create policy "admins can delete organization admin notes"
on public.daily_admin_notes
for delete
to authenticated
using (
  organization_id = public.auth_organization_id()
  and public.auth_is_admin()
);

grant select, insert, update, delete on public.daily_admin_notes to authenticated;
grant select on public.daily_admin_notes to anon;

comment on table public.daily_admin_notes is
  'Admin/coach notes for a student on a given day. Students may read only.';

-- ---------------------------------------------------------------------------
-- export_student_json: include adminNote in each day
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
      union
      select note_date as d from public.daily_admin_notes where student_id = p_student_id
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
        ),
        'adminNote', (
          select jsonb_build_object(
            'body', n.body,
            'updatedAt', n.updated_at
          )
          from public.daily_admin_notes n
          where n.student_id = p_student_id
            and n.note_date = ds.day_date
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
