-- Use the real clock so two runs can never share a timestamp
alter table public.promotion_runs alter column run_at set default clock_timestamp();
