create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.app_role() set schema private;
alter function public.is_oversight() set schema private;
alter function public.is_money() set schema private;
alter function public.is_fee_viewer() set schema private;
alter function public.student_class(uuid) set schema private;
alter function public.teaches(smallint, integer) set schema private;
alter function public.teaches_class(smallint) set schema private;
alter function public.parent_of(uuid) set schema private;
alter function public.parent_sees_class_subject(smallint, integer) set schema private;
alter function public.can_see_student(uuid) set schema private;
alter function public.can_see_mark(uuid, integer) set schema private;
alter function public.can_enter_mark(uuid, integer, text, smallint, smallint) set schema private;
alter function public.path_uuid(text) set schema private;
alter function public.can_see_student_path(text) set schema private;
alter function public.can_read_assignment_path(text) set schema private;
alter function public.can_write_assignment_path(text) set schema private;

-- Rewrite the bodies so they point at the private schema and use an empty search path.
create or replace function private.app_role() returns text language sql stable security definer set search_path = '' as
$$ select role from public.profiles where id = auth.uid() $$;
create or replace function private.is_oversight() returns boolean language sql stable security definer set search_path = '' as
$$ select coalesce(private.app_role() in ('admin','principal','deputy'), false) $$;
create or replace function private.is_money() returns boolean language sql stable security definer set search_path = '' as
$$ select coalesce(private.app_role() in ('admin','accounts'), false) $$;
create or replace function private.is_fee_viewer() returns boolean language sql stable security definer set search_path = '' as
$$ select coalesce(private.app_role() in ('admin','accounts','principal','deputy'), false) $$;
create or replace function private.student_class(stu uuid) returns smallint language sql stable security definer set search_path = '' as
$$ select class_id from public.students where id = stu $$;
create or replace function private.teaches(cid smallint, sid integer) returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.teacher_assignments where teacher_id = auth.uid() and class_id = cid and subject_id = sid) $$;
create or replace function private.teaches_class(cid smallint) returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.teacher_assignments where teacher_id = auth.uid() and class_id = cid) $$;
create or replace function private.parent_of(stu uuid) returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.parent_children where parent_id = auth.uid() and student_id = stu) $$;
create or replace function private.parent_sees_class_subject(cid smallint, sid integer) returns boolean language sql stable security definer set search_path = '' as
$$ select exists (
     select 1 from public.parent_children pc
     join public.students s on s.id = pc.student_id
     join public.student_subjects ss on ss.student_id = s.id
     where pc.parent_id = auth.uid() and s.class_id = cid and ss.subject_id = sid) $$;
create or replace function private.can_see_student(stu uuid) returns boolean language sql stable security definer set search_path = '' as
$$ select case private.app_role()
     when 'admin' then true when 'principal' then true when 'deputy' then true when 'accounts' then true
     when 'teacher' then private.teaches_class(private.student_class(stu))
     when 'parent' then private.parent_of(stu)
     else false end $$;
create or replace function private.can_see_mark(stu uuid, sid integer) returns boolean language sql stable security definer set search_path = '' as
$$ select case private.app_role()
     when 'admin' then true when 'principal' then true when 'deputy' then true
     when 'teacher' then private.teaches(private.student_class(stu), sid)
     when 'parent' then private.parent_of(stu)
     else false end $$;
create or replace function private.can_enter_mark(stu uuid, sid integer, yr text, t smallint, e smallint) returns boolean language sql stable security definer set search_path = '' as
$$ select case private.app_role()
     when 'admin' then true
     when 'teacher' then
        private.teaches(private.student_class(stu), sid)
        and exists (select 1 from public.student_subjects where student_id = stu and subject_id = sid)
        and not exists (select 1 from public.mark_locks l
                        where l.class_id = private.student_class(stu) and l.subject_id = sid
                          and l.academic_year = yr and l.term = t and l.exam = e and l.locked)
     else false end $$;
create or replace function private.path_uuid(p text) returns uuid language sql immutable set search_path = '' as
$$ select case when split_part(p, '/', 1) ~ '^[0-9a-fA-F-]{36}$' then split_part(p, '/', 1)::uuid end $$;
create or replace function private.can_see_student_path(p text) returns boolean language sql stable security definer set search_path = '' as
$$ select coalesce(private.can_see_student(private.path_uuid(p)), false) $$;
create or replace function private.can_read_assignment_path(p text) returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.assignments a where a.id = private.path_uuid(p)
       and (private.is_oversight() or a.teacher_id = auth.uid() or private.parent_sees_class_subject(a.class_id, a.subject_id))) $$;
create or replace function private.can_write_assignment_path(p text) returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.assignments a where a.id = private.path_uuid(p)
       and (a.teacher_id = auth.uid() or private.app_role() = 'admin')) $$;

-- Public functions that call the helpers.
create or replace function public.record_payment(p_student uuid, p_item integer, p_amount numeric, p_method text, p_ref text)
returns public.payments language plpgsql security definer set search_path = '' as $$
declare v_pay public.payments; v_left numeric; v_total numeric; v_take numeric; r record;
begin
  if not private.is_money() then raise exception 'Only Accounts or Admin can record payments' using errcode = '42501'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Enter an amount above 0'; end if;
  if p_method not in ('Cash','M-Pesa','Bank') then raise exception 'Unknown payment method'; end if;
  if p_method <> 'Cash' and coalesce(trim(p_ref), '') = '' then raise exception 'Enter the payment reference'; end if;
  perform 1 from public.students where id = p_student for update;
  if not found then raise exception 'Student not found'; end if;
  select coalesce(sum(balance), 0) into v_total from public.fee_balances
    where student_id = p_student and balance > 0 and (p_item is null or fee_item_id = p_item);
  if p_amount > v_total then raise exception 'That is more than the balance of %', v_total; end if;
  insert into public.payments (receipt_no, student_id, amount, method, reference, recorded_by)
  values ('RCT-' || lpad(nextval('public.receipt_seq')::text, 5, '0'), p_student, p_amount, p_method, nullif(trim(p_ref), ''), auth.uid())
  returning * into v_pay;
  v_left := p_amount;
  for r in select fee_item_id, balance from public.fee_balances
           where student_id = p_student and balance > 0 and (p_item is null or fee_item_id = p_item)
           order by fee_item_id loop
    exit when v_left <= 0;
    v_take := least(v_left, r.balance);
    insert into public.payment_allocations (payment_id, fee_item_id, amount) values (v_pay.id, r.fee_item_id, v_take);
    v_left := v_left - v_take;
  end loop;
  update public.payments set balance_after = (select coalesce(sum(balance), 0) from public.fee_balances where student_id = p_student)
    where id = v_pay.id returning * into v_pay;
  return v_pay;
end $$;

create or replace function public.bill_class(p_items jsonb, p_class smallint, p_year text, p_term smallint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare it jsonb; v_item integer; v_amt numeric; n integer := 0; sk integer := 0; s record;
begin
  if not private.is_money() then raise exception 'Only Accounts or Admin can bill fees' using errcode = '42501'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Choose at least one fee item'; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    v_item := (it ->> 'item')::integer; v_amt := (it ->> 'amount')::numeric;
    if v_amt is null or v_amt <= 0 then raise exception 'Enter an amount above 0 for each fee item'; end if;
    for s in select id from public.students where status = 'active' and (p_class is null or class_id = p_class) loop
      if exists (select 1 from public.fee_charges where student_id = s.id and fee_item_id = v_item and academic_year = p_year and term = p_term) then
        sk := sk + 1;
      else
        insert into public.fee_charges (student_id, fee_item_id, amount, academic_year, term) values (s.id, v_item, v_amt, p_year, p_term);
        n := n + 1;
      end if;
    end loop;
  end loop;
  return jsonb_build_object('added', n, 'skipped', sk);
end $$;

create or replace function public.link_child(p_adm text, p_upi text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_fails integer;
begin
  if private.app_role() is distinct from 'parent' then raise exception 'Only parent accounts can link a child' using errcode = '42501'; end if;
  select count(*) into v_fails from public.link_attempts where user_id = auth.uid() and not ok and at > now() - interval '15 minutes';
  if v_fails >= 5 then raise exception 'Too many attempts. Wait 15 minutes and try again.'; end if;
  select id into v_id from public.students where adm_no = upper(trim(p_adm)) and upi = upper(trim(p_upi)) and status = 'active';
  if v_id is null then
    insert into public.link_attempts (user_id, ok) values (auth.uid(), false);
    return null;
  end if;
  insert into public.link_attempts (user_id, ok) values (auth.uid(), true);
  insert into public.parent_children (parent_id, student_id) values (auth.uid(), v_id) on conflict do nothing;
  return v_id;
end $$;

alter function public.marks_touch() set search_path = '';
alter function public.check_staff_name(text) set search_path = '';
alter function public.clear_must_change() set search_path = '';
alter function public.handle_new_user() set search_path = '';
alter function public.enroll_core_subjects() set search_path = '';
alter function public.set_teacher_name() set search_path = '';

-- the auto-RLS helper and trigger functions never need to be called by app users
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
