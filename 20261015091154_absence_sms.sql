-- SMS alerts are switched off in the app. These objects are kept but unused.
-- Parents can switch SMS alerts on or off, and edit their own phone number
alter table public.profiles add column sms_alerts boolean not null default true;
grant update (full_name, phone, sms_alerts) on public.profiles to authenticated;

-- One row per text message about an absence. The unique key stops a parent being texted twice for the same child and day.
create table public.absence_sms (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  parent_id uuid not null references public.profiles(id) on delete cascade,
  att_date date not null,
  phone text not null,
  status text not null default 'queued' check (status in ('queued','sent','failed')),
  provider_ref text,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (student_id, parent_id, att_date)
);
create index on public.absence_sms (parent_id);
create index on public.absence_sms (created_at desc);

alter table public.absence_sms enable row level security;
-- Only the school's oversight staff can read the log. Nobody writes to it from the browser: the sending function does.
create policy absence_sms_read on public.absence_sms for select to authenticated using (private.is_oversight());
revoke all on public.absence_sms from anon;
revoke insert, update, delete on public.absence_sms from authenticated;
