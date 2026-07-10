-- =============================================================================
-- GRANTS — required after 000_reset_public.sql + 001_schema.sql
-- Without these, login succeeds but API calls return 403.
-- Run in Supabase SQL Editor if you already applied 001_schema.sql.
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

grant usage, select on all sequences in schema public to authenticated;

grant execute on all functions in schema public to authenticated, anon;

alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
grant select on tables to anon;

alter default privileges in schema public
grant execute on functions to authenticated, anon;

alter default privileges in schema public
grant usage, select on sequences to authenticated;
