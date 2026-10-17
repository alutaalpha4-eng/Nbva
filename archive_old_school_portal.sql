-- ONE-OFF, only for the original "school portal" project (hayylzszuhwtlwdwlahb).
-- It moved an older app's tables into a private archive schema. Do NOT run this on a fresh project.
create schema if not exists legacy_school_portal;
revoke all on schema legacy_school_portal from public, anon, authenticated;

create table legacy_school_portal._old_functions as
  select p.oid::regprocedure::text as signature, pg_get_functiondef(p.oid) as definition
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind = 'f' and p.proname <> 'rls_auto_enable';

create table legacy_school_portal._old_triggers as
  select tgname::text as name, pg_get_triggerdef(oid) as definition
  from pg_trigger where tgrelid = 'auth.users'::regclass and tgname = 'on_auth_user_created';

drop trigger if exists on_auth_user_created on auth.users;

do $$
declare r record;
begin
  for r in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' loop
    execute format('alter table public.%I set schema legacy_school_portal', r.relname);
  end loop;
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prokind = 'f' and p.proname <> 'rls_auto_enable' loop
    execute format('alter function %s set schema legacy_school_portal', r.sig);
  end loop;
end $$;
