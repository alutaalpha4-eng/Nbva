-- Class teachers and daily morning attendance
create table public.class_teachers (
  class_id smallint primary key references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  teacher_name text not null default ''
);
create index on public.class_teachers (teacher_id);

create table public.attendance (
  student_id uuid not null references public.students(id) on delete cascade,
  att_date date not null,
  status text not null check (status in ('present','absent','late')),
  note text check (note is null or length(note) <= 200),
  marked_by uuid default auth.uid() references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (student_id, att_date)
);
create index on public.attendance (att_date);
create index on public.attendance (marked_by);

create function private.nairobi_today() returns date language sql stable set search_path = '' as
$$ select (now() at time zone 'Africa/Nairobi')::date $$;
create function private.is_class_teacher(cid smallint) returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.class_teachers where class_id = cid and teacher_id = auth.uid()) $$;
create function private.can_see_attendance(stu uuid) returns boolean language sql stable security definer set search_path = '' as
$$ select case private.app_role()
     when 'admin' then true when 'principal' then true when 'deputy' then true
     when 'teacher' then private.is_class_teacher(private.student_class(stu))
     when 'parent' then private.parent_of(stu)
     else false end $$;
-- Class teachers can take attendance for their own class, on school days, for today only. Admin can correct any day.
create function private.can_take_attendance(stu uuid, d date) returns boolean language sql stable security definer set search_path = '' as
$$ select case private.app_role()
     when 'admin' then true
     when 'teacher' then private.is_class_teacher(private.student_class(stu)) and d = private.nairobi_today() and extract(isodow from d) <= 5
     else false end $$;
revoke execute on function private.nairobi_today(), private.is_class_teacher(smallint), private.can_see_attendance(uuid), private.can_take_attendance(uuid, date) from public, anon;
grant execute on function private.nairobi_today(), private.is_class_teacher(smallint), private.can_see_attendance(uuid), private.can_take_attendance(uuid, date) to authenticated;

create function public.att_touch() returns trigger language plpgsql set search_path = '' as
$$ begin new.updated_at = now(); new.marked_by = auth.uid(); return new; end $$;
create trigger att_touch before insert or update on public.attendance for each row execute function public.att_touch();
create function public.set_ct_name() returns trigger language plpgsql security definer set search_path = '' as
$$ begin select full_name into new.teacher_name from public.profiles where id = new.teacher_id; return new; end $$;
create trigger ct_name before insert or update on public.class_teachers for each row execute function public.set_ct_name();
revoke execute on function public.att_touch(), public.set_ct_name() from public, anon, authenticated;

alter table public.class_teachers enable row level security;
alter table public.attendance enable row level security;
create policy ct_read on public.class_teachers for select to authenticated using (teacher_id = (select auth.uid()) or private.is_oversight());
create policy ct_admin on public.class_teachers for all to authenticated using (private.app_role() = 'admin') with check (private.app_role() = 'admin');
create policy att_read on public.attendance for select to authenticated using (private.can_see_attendance(student_id));
create policy att_insert on public.attendance for insert to authenticated with check (private.can_take_attendance(student_id, att_date));
create policy att_update on public.attendance for update to authenticated using (private.can_take_attendance(student_id, att_date)) with check (private.can_take_attendance(student_id, att_date));
create policy att_delete on public.attendance for delete to authenticated using (private.app_role() = 'admin');

-- Year-to-date attendance rate per student (respects who is asking)
create view public.attendance_summary with (security_invoker = true) as
select a.student_id, count(*)::int as marked, (count(*) filter (where a.status in ('present','late')))::int as attended
from public.attendance a
where to_char(a.att_date, 'YYYY') = (select academic_year from public.settings)
group by a.student_id;

revoke all on public.class_teachers, public.attendance, public.attendance_summary from anon;
