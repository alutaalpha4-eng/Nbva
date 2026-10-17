-- Students who finish Grade 9 are marked 'graduated' and kept on record (renamed to 'completed' by a later migration)
alter table public.students drop constraint if exists students_status_check;
alter table public.students add constraint students_status_check check (status in ('active','withdrawn','graduated'));

create table public.promotion_runs (
  id uuid primary key default gen_random_uuid(),
  from_year text not null,
  to_year text not null,
  from_term smallint not null,
  run_by uuid references public.profiles(id) on delete set null,
  run_at timestamptz not null default now(),
  promoted integer not null default 0,
  repeated integer not null default 0,
  graduated integer not null default 0,
  undone_at timestamptz
);
create index on public.promotion_runs (run_by);
create table public.promotion_log (
  run_id uuid not null references public.promotion_runs(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  from_class smallint not null,
  to_class smallint not null,
  from_status text not null,
  to_status text not null,
  primary key (run_id, student_id)
);
create index on public.promotion_log (student_id);
alter table public.promotion_runs enable row level security;
alter table public.promotion_log enable row level security;
create policy promotion_runs_admin on public.promotion_runs for select to authenticated using (private.app_role() = 'admin');
create policy promotion_log_admin on public.promotion_log for select to authenticated using (private.app_role() = 'admin');
revoke all on public.promotion_runs, public.promotion_log from anon;
revoke insert, update, delete on public.promotion_runs, public.promotion_log from authenticated;

-- Give a student the core subjects of their (new) class and keep optional ones still offered there
create function private.sync_student_subjects(stu uuid) returns void language sql security definer set search_path = '' as $$
  delete from public.student_subjects ss using public.students s
   where ss.student_id = s.id and s.id = stu
     and not exists (select 1 from public.class_subjects cs where cs.class_id = s.class_id and cs.subject_id = ss.subject_id);
  insert into public.student_subjects (student_id, subject_id)
   select stu, cs.subject_id from public.class_subjects cs join public.students s on s.id = stu and s.class_id = cs.class_id
    where not cs.optional
   on conflict do nothing;
$$;
revoke execute on function private.sync_student_subjects(uuid) from public, anon;

-- End of year: move every active student up one class (except those who repeat), complete the top class, start the new year.
create function public.promote_students(p_new_year text, p_repeat uuid[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old text; v_term smallint; v_run uuid; v_top smallint; n_up int := 0; n_rep int := 0; n_grad int := 0; r record; v_new text := trim(coalesce(p_new_year, ''));
begin
  if private.app_role() is distinct from 'admin' then raise exception 'Only an admin can promote students' using errcode = '42501'; end if;
  if v_new = '' then raise exception 'Enter the new academic year'; end if;
  select academic_year, current_term into v_old, v_term from public.settings;
  if v_new = v_old then raise exception 'Enter a new academic year. The current year is %.', v_old; end if;
  if exists (select 1 from public.promotion_runs where from_year = v_old and undone_at is null) then
    raise exception 'Students have already been promoted at the end of %.', v_old;
  end if;
  select max(id) into v_top from public.classes;
  insert into public.promotion_runs (from_year, to_year, from_term, run_by) values (v_old, v_new, v_term, auth.uid()) returning id into v_run;
  for r in select id, class_id, status from public.students where status = 'active' for update loop
    if r.id = any (coalesce(p_repeat, '{}'::uuid[])) then
      n_rep := n_rep + 1;
      insert into public.promotion_log values (v_run, r.id, r.class_id, r.class_id, r.status, 'active');
    elsif r.class_id >= v_top then
      update public.students set status = 'graduated' where id = r.id;
      n_grad := n_grad + 1;
      insert into public.promotion_log values (v_run, r.id, r.class_id, r.class_id, r.status, 'graduated');
    else
      update public.students set class_id = class_id + 1 where id = r.id;
      perform private.sync_student_subjects(r.id);
      n_up := n_up + 1;
      insert into public.promotion_log values (v_run, r.id, r.class_id, r.class_id + 1, r.status, 'active');
    end if;
  end loop;
  update public.promotion_runs set promoted = n_up, repeated = n_rep, graduated = n_grad where id = v_run;
  update public.settings set academic_year = v_new, current_term = 1 where id;
  return jsonb_build_object('run', v_run, 'promoted', n_up, 'repeated', n_rep, 'graduated', n_grad, 'year', v_new);
end $$;

-- Undo the latest promotion, but only while nothing has been entered for the new year
create function public.undo_promotion() returns jsonb language plpgsql security definer set search_path = '' as $$
declare v public.promotion_runs; r record; n int := 0;
begin
  if private.app_role() is distinct from 'admin' then raise exception 'Only an admin can undo a promotion' using errcode = '42501'; end if;
  select * into v from public.promotion_runs where undone_at is null order by run_at desc limit 1 for update;
  if not found then raise exception 'There is no promotion to undo'; end if;
  if exists (select 1 from public.marks where academic_year = v.to_year) then
    raise exception 'Marks have already been entered for %. Undo is no longer possible.', v.to_year;
  end if;
  if exists (select 1 from public.fee_charges where academic_year = v.to_year) then
    raise exception 'Fees have already been billed for %. Undo is no longer possible.', v.to_year;
  end if;
  for r in select * from public.promotion_log where run_id = v.id loop
    update public.students set class_id = r.from_class, status = r.from_status where id = r.student_id;
    perform private.sync_student_subjects(r.student_id);
    n := n + 1;
  end loop;
  update public.settings set academic_year = v.from_year, current_term = v.from_term where id;
  update public.promotion_runs set undone_at = now() where id = v.id;
  return jsonb_build_object('restored', n, 'year', v.from_year);
end $$;

revoke execute on function public.promote_students(text, uuid[]), public.undo_promotion() from public, anon;
grant execute on function public.promote_students(text, uuid[]), public.undo_promotion() to authenticated;
