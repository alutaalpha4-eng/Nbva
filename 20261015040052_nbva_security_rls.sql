-- ===== helper functions (run with owner rights so policies can look across tables) =====
create function public.app_role() returns text language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;
create function public.is_oversight() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(public.app_role() in ('admin','principal','deputy'), false) $$;
create function public.is_money() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(public.app_role() in ('admin','accounts'), false) $$;
create function public.is_fee_viewer() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(public.app_role() in ('admin','accounts','principal','deputy'), false) $$;
create function public.student_class(stu uuid) returns smallint language sql stable security definer set search_path = public as
$$ select class_id from public.students where id = stu $$;
create function public.teaches(cid smallint, sid integer) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.teacher_assignments where teacher_id = auth.uid() and class_id = cid and subject_id = sid) $$;
create function public.teaches_class(cid smallint) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.teacher_assignments where teacher_id = auth.uid() and class_id = cid) $$;
create function public.parent_of(stu uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.parent_children where parent_id = auth.uid() and student_id = stu) $$;
create function public.parent_sees_class_subject(cid smallint, sid integer) returns boolean language sql stable security definer set search_path = public as
$$ select exists (
     select 1 from public.parent_children pc
     join public.students s on s.id = pc.student_id
     join public.student_subjects ss on ss.student_id = s.id
     where pc.parent_id = auth.uid() and s.class_id = cid and ss.subject_id = sid) $$;
create function public.can_see_student(stu uuid) returns boolean language sql stable security definer set search_path = public as
$$ select case public.app_role()
     when 'admin' then true when 'principal' then true when 'deputy' then true when 'accounts' then true
     when 'teacher' then public.teaches_class(public.student_class(stu))
     when 'parent' then public.parent_of(stu)
     else false end $$;
create function public.can_see_mark(stu uuid, sid integer) returns boolean language sql stable security definer set search_path = public as
$$ select case public.app_role()
     when 'admin' then true when 'principal' then true when 'deputy' then true
     when 'teacher' then public.teaches(public.student_class(stu), sid)
     when 'parent' then public.parent_of(stu)
     else false end $$;
create function public.can_enter_mark(stu uuid, sid integer, yr text, t smallint, e smallint) returns boolean language sql stable security definer set search_path = public as
$$ select case public.app_role()
     when 'admin' then true
     when 'teacher' then
        public.teaches(public.student_class(stu), sid)
        and exists (select 1 from public.student_subjects where student_id = stu and subject_id = sid)
        and not exists (select 1 from public.mark_locks l
                        where l.class_id = public.student_class(stu) and l.subject_id = sid
                          and l.academic_year = yr and l.term = t and l.exam = e and l.locked)
     else false end $$;
create function public.path_uuid(p text) returns uuid language sql immutable as
$$ select case when split_part(p, '/', 1) ~ '^[0-9a-fA-F-]{36}$' then split_part(p, '/', 1)::uuid end $$;
create function public.can_see_student_path(p text) returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(public.can_see_student(public.path_uuid(p)), false) $$;
create function public.can_read_assignment_path(p text) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.assignments a where a.id = public.path_uuid(p)
       and (public.is_oversight() or a.teacher_id = auth.uid() or public.parent_sees_class_subject(a.class_id, a.subject_id))) $$;
create function public.can_write_assignment_path(p text) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.assignments a where a.id = public.path_uuid(p)
       and (a.teacher_id = auth.uid() or public.app_role() = 'admin')) $$;

-- ===== triggers =====
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- The role can only come from app_metadata, which users cannot edit. Everyone else is a parent.
  insert into public.profiles (id, role, full_name, phone, email, staff_code, must_change_password)
  values (new.id,
          coalesce(new.raw_app_meta_data ->> 'role', 'parent'),
          coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          new.raw_user_meta_data ->> 'phone',
          lower(new.email),
          new.raw_app_meta_data ->> 'staff_code',
          coalesce((new.raw_app_meta_data ->> 'must_change_password')::boolean, false));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.enroll_core_subjects() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.student_subjects (student_id, subject_id)
  select new.id, subject_id from public.class_subjects where class_id = new.class_id and not optional
  on conflict do nothing;
  return new;
end $$;
create trigger students_enroll after insert on public.students for each row execute function public.enroll_core_subjects();

create function public.marks_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); new.entered_by = auth.uid(); return new; end $$;
create trigger marks_touch before insert or update on public.marks for each row execute function public.marks_touch();

create function public.set_teacher_name() returns trigger language plpgsql security definer set search_path = public as $$
begin select full_name into new.teacher_name from public.profiles where id = new.teacher_id; return new; end $$;
create trigger lessons_teacher_name before insert on public.lessons for each row execute function public.set_teacher_name();
create trigger assignments_teacher_name before insert on public.assignments for each row execute function public.set_teacher_name();

-- ===== row level security =====
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.class_subjects enable row level security;
alter table public.students enable row level security;
alter table public.student_subjects enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.marks enable row level security;
alter table public.mark_locks enable row level security;
alter table public.fee_items enable row level security;
alter table public.fee_charges enable row level security;
alter table public.payments enable row level security;
alter table public.payment_allocations enable row level security;
alter table public.parent_children enable row level security;
alter table public.link_attempts enable row level security;
alter table public.lessons enable row level security;
alter table public.assignments enable row level security;

-- profiles: people see themselves, admins see everyone. Role and code cannot be edited by users.
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_select_admin on public.profiles for select to authenticated using (public.app_role() = 'admin');
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- reference data: everyone signed in can read, only admin changes it
create policy settings_read on public.settings for select to authenticated using (true);
create policy settings_admin on public.settings for update to authenticated using (public.app_role() = 'admin') with check (public.app_role() = 'admin');
create policy classes_read on public.classes for select to authenticated using (true);
create policy classes_admin on public.classes for all to authenticated using (public.app_role() = 'admin') with check (public.app_role() = 'admin');
create policy subjects_read on public.subjects for select to authenticated using (true);
create policy subjects_admin on public.subjects for all to authenticated using (public.app_role() = 'admin') with check (public.app_role() = 'admin');
create policy class_subjects_read on public.class_subjects for select to authenticated using (true);
create policy class_subjects_admin on public.class_subjects for all to authenticated using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- students
create policy students_read on public.students for select to authenticated using (public.can_see_student(id));
create policy students_admin on public.students for all to authenticated using (public.app_role() = 'admin') with check (public.app_role() = 'admin');
create policy student_subjects_read on public.student_subjects for select to authenticated using (public.can_see_student(student_id));
create policy student_subjects_admin on public.student_subjects for all to authenticated using (public.app_role() = 'admin') with check (public.app_role() = 'admin');
create policy teacher_assignments_read on public.teacher_assignments for select to authenticated using (teacher_id = (select auth.uid()) or public.is_oversight());
create policy teacher_assignments_admin on public.teacher_assignments for all to authenticated using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- marks: teachers only for their own class and subject, and only while not submitted
create policy marks_read on public.marks for select to authenticated using (public.can_see_mark(student_id, subject_id));
create policy marks_insert on public.marks for insert to authenticated with check (public.can_enter_mark(student_id, subject_id, academic_year, term, exam));
create policy marks_update on public.marks for update to authenticated using (public.can_enter_mark(student_id, subject_id, academic_year, term, exam)) with check (public.can_enter_mark(student_id, subject_id, academic_year, term, exam));
create policy mark_locks_read on public.mark_locks for select to authenticated using (public.teaches(class_id, subject_id) or public.is_oversight());
create policy mark_locks_insert on public.mark_locks for insert to authenticated with check (public.teaches(class_id, subject_id) or public.app_role() = 'admin');
create policy mark_locks_update on public.mark_locks for update to authenticated using (public.teaches(class_id, subject_id) or public.app_role() = 'admin') with check (public.teaches(class_id, subject_id) or public.app_role() = 'admin');

-- fees: Accounts and Admin change them. Oversight staff and the child's parents can read.
create policy fee_items_read on public.fee_items for select to authenticated using (public.is_fee_viewer());
create policy fee_items_write on public.fee_items for all to authenticated using (public.is_money()) with check (public.is_money());
create policy fee_charges_read on public.fee_charges for select to authenticated using (public.is_fee_viewer() or public.parent_of(student_id));
create policy fee_charges_insert on public.fee_charges for insert to authenticated with check (public.is_money());
create policy fee_charges_delete on public.fee_charges for delete to authenticated using (public.is_money());
create policy payments_read on public.payments for select to authenticated using (public.is_fee_viewer() or public.parent_of(student_id));
create policy allocations_read on public.payment_allocations for select to authenticated using (exists (select 1 from public.payments p where p.id = payment_id));

-- parents
create policy parent_children_read on public.parent_children for select to authenticated using (parent_id = (select auth.uid()) or public.is_oversight());
create policy parent_children_delete on public.parent_children for delete to authenticated using (parent_id = (select auth.uid()) or public.app_role() = 'admin');

-- lessons and assignments
create policy lessons_read on public.lessons for select to authenticated using (public.is_oversight() or teacher_id = (select auth.uid()) or public.parent_sees_class_subject(class_id, subject_id));
create policy lessons_insert on public.lessons for insert to authenticated with check ((public.app_role() = 'teacher' and teacher_id = (select auth.uid()) and public.teaches(class_id, subject_id)) or public.app_role() = 'admin');
create policy lessons_update on public.lessons for update to authenticated using ((teacher_id = (select auth.uid()) and public.teaches(class_id, subject_id)) or public.app_role() = 'admin') with check ((teacher_id = (select auth.uid()) and public.teaches(class_id, subject_id)) or public.app_role() = 'admin');
create policy lessons_delete on public.lessons for delete to authenticated using (teacher_id = (select auth.uid()) or public.app_role() = 'admin');
create policy assignments_read on public.assignments for select to authenticated using (public.is_oversight() or teacher_id = (select auth.uid()) or public.parent_sees_class_subject(class_id, subject_id));
create policy assignments_insert on public.assignments for insert to authenticated with check ((public.app_role() = 'teacher' and teacher_id = (select auth.uid()) and public.teaches(class_id, subject_id)) or public.app_role() = 'admin');
create policy assignments_update on public.assignments for update to authenticated using ((teacher_id = (select auth.uid()) and public.teaches(class_id, subject_id)) or public.app_role() = 'admin') with check ((teacher_id = (select auth.uid()) and public.teaches(class_id, subject_id)) or public.app_role() = 'admin');
create policy assignments_delete on public.assignments for delete to authenticated using (teacher_id = (select auth.uid()) or public.app_role() = 'admin');

-- ===== file storage (private buckets) =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
 ('student-photos', 'student-photos', false, 1048576, array['image/jpeg','image/png','image/webp']),
 ('assignment-files', 'assignment-files', false, 5242880, array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain','image/png','image/jpeg','application/zip','application/x-zip-compressed','text/csv','text/markdown'])
on conflict (id) do nothing;
create policy photos_read on storage.objects for select to authenticated using (bucket_id = 'student-photos' and public.can_see_student_path(name));
create policy photos_insert on storage.objects for insert to authenticated with check (bucket_id = 'student-photos' and public.app_role() = 'admin');
create policy photos_update on storage.objects for update to authenticated using (bucket_id = 'student-photos' and public.app_role() = 'admin');
create policy photos_delete on storage.objects for delete to authenticated using (bucket_id = 'student-photos' and public.app_role() = 'admin');
create policy asgfiles_read on storage.objects for select to authenticated using (bucket_id = 'assignment-files' and public.can_read_assignment_path(name));
create policy asgfiles_insert on storage.objects for insert to authenticated with check (bucket_id = 'assignment-files' and public.can_write_assignment_path(name));
create policy asgfiles_delete on storage.objects for delete to authenticated using (bucket_id = 'assignment-files' and public.can_write_assignment_path(name));

-- ===== lock down anonymous access =====
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
revoke execute on function public.handle_new_user(), public.enroll_core_subjects(), public.marks_touch(), public.set_teacher_name() from authenticated;
revoke all on public.link_attempts from authenticated;
