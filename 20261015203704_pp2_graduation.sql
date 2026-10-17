-- Graduation is PP2 -> Grade 1. Grade 9 students "complete" and leave.
update public.students set status = 'completed' where status = 'graduated';
alter table public.students drop constraint if exists students_status_check;
alter table public.students add constraint students_status_check check (status in ('active','withdrawn','completed'));
alter table public.students add column pp2_graduated_year text;

alter table public.promotion_runs rename column graduated to completed;
alter table public.promotion_runs add column graduates integer not null default 0;
update public.promotion_log set to_status = 'completed' where to_status = 'graduated';

create or replace function public.promote_students(p_new_year text, p_repeat uuid[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old text; v_term smallint; v_run uuid; v_top smallint; v_pp2 smallint;
        n_up int := 0; n_rep int := 0; n_done int := 0; n_grad int := 0; r record; v_new text := trim(coalesce(p_new_year, ''));
begin
  if private.app_role() is distinct from 'admin' then raise exception 'Only an admin can promote students' using errcode = '42501'; end if;
  if v_new = '' then raise exception 'Enter the new academic year'; end if;
  select academic_year, current_term into v_old, v_term from public.settings;
  if v_new = v_old then raise exception 'Enter a new academic year. The current year is %.', v_old; end if;
  if exists (select 1 from public.promotion_runs where from_year = v_old and undone_at is null) then
    raise exception 'Students have already been promoted at the end of %.', v_old;
  end if;
  select max(id) into v_top from public.classes;
  select id into v_pp2 from public.classes where name = 'PP2';
  insert into public.promotion_runs (from_year, to_year, from_term, run_by) values (v_old, v_new, v_term, auth.uid()) returning id into v_run;
  for r in select id, class_id, status from public.students where status = 'active' for update loop
    if r.id = any (coalesce(p_repeat, '{}'::uuid[])) then
      n_rep := n_rep + 1;
      insert into public.promotion_log values (v_run, r.id, r.class_id, r.class_id, r.status, 'active');
    elsif r.class_id >= v_top then
      update public.students set status = 'completed' where id = r.id;
      n_done := n_done + 1;
      insert into public.promotion_log values (v_run, r.id, r.class_id, r.class_id, r.status, 'completed');
    else
      update public.students set class_id = class_id + 1,
             pp2_graduated_year = case when r.class_id = v_pp2 then v_old else pp2_graduated_year end
       where id = r.id;
      perform private.sync_student_subjects(r.id);
      n_up := n_up + 1;
      if r.class_id = v_pp2 then n_grad := n_grad + 1; end if;
      insert into public.promotion_log values (v_run, r.id, r.class_id, r.class_id + 1, r.status, 'active');
    end if;
  end loop;
  update public.promotion_runs set promoted = n_up, repeated = n_rep, completed = n_done, graduates = n_grad where id = v_run;
  update public.settings set academic_year = v_new, current_term = 1 where id;
  return jsonb_build_object('run', v_run, 'promoted', n_up, 'graduates', n_grad, 'repeated', n_rep, 'completed', n_done, 'year', v_new);
end $$;

create or replace function public.undo_promotion() returns jsonb language plpgsql security definer set search_path = '' as $$
declare v public.promotion_runs; r record; n int := 0; v_pp2 smallint;
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
  select id into v_pp2 from public.classes where name = 'PP2';
  for r in select * from public.promotion_log where run_id = v.id loop
    update public.students set class_id = r.from_class, status = r.from_status,
           pp2_graduated_year = case when r.from_class = v_pp2 and r.to_class <> r.from_class then null else pp2_graduated_year end
     where id = r.student_id;
    perform private.sync_student_subjects(r.student_id);
    n := n + 1;
  end loop;
  update public.settings set academic_year = v.from_year, current_term = v.from_term where id;
  update public.promotion_runs set undone_at = now() where id = v.id;
  return jsonb_build_object('restored', n, 'year', v.from_year);
end $$;
