-- =============================================================================
-- RESET — wipe all app objects in public schema
-- Run this BEFORE 001_schema.sql if you have leftover tables from an old app.
--
-- KEEPS: auth users (Authentication → Users), storage buckets, edge functions
-- WIPES: tables, views, functions, types, triggers, RLS policies in public
-- =============================================================================

drop schema if exists public cascade;

create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on schema public to postgres, service_role;
grant all on all tables in schema public to postgres, service_role;
grant all on all routines in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;

alter default privileges in schema public
grant all on tables to postgres, service_role;

alter default privileges in schema public
grant all on routines to postgres, service_role;

alter default privileges in schema public
grant all on sequences to postgres, service_role;

-- Supabase exposes these via API — restore standard access
grant usage on schema public to anon, authenticated;
