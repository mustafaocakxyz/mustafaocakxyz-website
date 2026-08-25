-- =============================================================================
-- Per-student admin chat visibility
-- Run in Supabase SQL Editor after 034_admin_reset_password_rpc.sql
-- =============================================================================

alter table public.profiles
  add column if not exists show_in_admin_chat boolean not null default true;

comment on column public.profiles.show_in_admin_chat is
  'When false, student is hidden from the admin chat inbox. Messages/threads are kept.';
