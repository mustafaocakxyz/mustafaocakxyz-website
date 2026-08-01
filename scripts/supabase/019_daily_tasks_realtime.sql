-- =============================================================================
-- Enable Realtime for daily_tasks (live task add/edit/complete across clients)
-- Run in: Supabase Dashboard → SQL Editor → paste → Run
-- After 001–018.
-- =============================================================================

do $$
begin
  alter publication supabase_realtime add table public.daily_tasks;
exception
  when duplicate_object then null;
end;
$$;
