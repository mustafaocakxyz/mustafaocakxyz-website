-- =============================================================================
-- Per-student "meet lazım" flag for admin tea page
-- Run in Supabase SQL Editor after 038_chat_admin_message_actions.sql
-- =============================================================================

alter table public.profiles
  add column if not exists tea_meet_needed boolean not null default false;

comment on column public.profiles.tea_meet_needed is
  'When true, admin tea page shows an orange "meet lazım" pill for this student.';
