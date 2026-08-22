-- =============================================================================
-- Earnings contribution: Kapalı (0) | 5000 | 6000 per student
-- Run in Supabase SQL Editor after 026_student_visibility_settings.sql
-- =============================================================================

alter table public.profiles
  add column if not exists earnings_contribution integer;

-- Backfill from legacy boolean: true → 5000, false → 0
update public.profiles
set earnings_contribution = case
  when count_in_earnings is false then 0
  else 5000
end
where earnings_contribution is null;

alter table public.profiles
  alter column earnings_contribution set default 5000;

alter table public.profiles
  alter column earnings_contribution set not null;

alter table public.profiles
  drop constraint if exists profiles_earnings_contribution_check;

alter table public.profiles
  add constraint profiles_earnings_contribution_check
  check (earnings_contribution in (0, 5000, 6000));

comment on column public.profiles.earnings_contribution is
  'Monthly earnings contribution in TRY: 0 = Kapalı, 5000, or 6000.';

-- Keep legacy boolean in sync for any leftover readers
update public.profiles
set count_in_earnings = (earnings_contribution > 0)
where count_in_earnings is distinct from (earnings_contribution > 0);
