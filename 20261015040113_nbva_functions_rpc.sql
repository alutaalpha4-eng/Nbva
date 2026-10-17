-- Record a payment, share it across outstanding fee items and issue a receipt number.
create function public.record_payment(p_student uuid, p_item integer, p_amount numeric, p_method text, p_ref text)
returns public.payments language plpgsql security definer set search_path = public as $$
declare v_pay public.payments; v_left numeric; v_total numeric; v_take numeric; r record;
begin
  if not public.is_money() then raise exception 'Only Accounts or Admin can record payments' using errcode = '42501'; end if;
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

-- Charge fee items to a whole class (or every class when p_class is null). Skips items a student already has this term.
create function public.bill_class(p_items jsonb, p_class smallint, p_year text, p_term smallint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare it jsonb; v_item integer; v_amt numeric; n integer := 0; sk integer := 0; s record;
begin
  if not public.is_money() then raise exception 'Only Accounts or Admin can bill fees' using errcode = '42501'; end if;
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

-- A parent links a child by admission number and UPI. Returns null when they do not match.
create function public.link_child(p_adm text, p_upi text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_fails integer;
begin
  if public.app_role() is distinct from 'parent' then raise exception 'Only parent accounts can link a child' using errcode = '42501'; end if;
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

-- Staff sign-in asks for a name as well as the code. This checks it against the signed-in account.
create function public.check_staff_name(p_name text) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role <> 'parent' and lower(trim(full_name)) = lower(trim(p_name))) $$;

-- Called after a staff member sets their own new password.
create function public.clear_must_change() returns void language sql security definer set search_path = public as
$$ update public.profiles set must_change_password = false where id = auth.uid() $$;

revoke execute on function public.record_payment(uuid, integer, numeric, text, text), public.bill_class(jsonb, smallint, text, smallint),
  public.link_child(text, text), public.check_staff_name(text), public.clear_must_change() from public, anon;
grant execute on function public.record_payment(uuid, integer, numeric, text, text), public.bill_class(jsonb, smallint, text, smallint),
  public.link_child(text, text), public.check_staff_name(text), public.clear_must_change() to authenticated;
