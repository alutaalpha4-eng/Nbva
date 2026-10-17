-- ===== NBVA core schema =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'parent' check (role in ('parent','teacher','accounts','principal','deputy','admin')),
  full_name text not null default '',
  phone text,
  email text,
  staff_code text unique,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.settings (
  id boolean primary key default true check (id),
  school_name text not null default 'NBVA School',
  academic_year text not null default '2026',
  current_term smallint not null default 3 check (current_term between 1 and 3),
  ee_min numeric not null default 75,
  me_min numeric not null default 41,
  ae_min numeric not null default 21,
  check (ee_min > me_min and me_min > ae_min and ae_min > 0 and ee_min <= 100)
);
insert into public.settings default values;

create table public.classes (id smallint primary key, name text not null unique);
create table public.subjects (id integer generated always as identity primary key, name text not null unique);
create table public.class_subjects (
  class_id smallint not null references public.classes(id) on delete cascade,
  subject_id integer not null references public.subjects(id) on delete cascade,
  optional boolean not null default false,
  primary key (class_id, subject_id)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  adm_no text not null unique check (adm_no ~ '^[A-Z0-9/-]{2,15}$'),
  upi text not null unique check (upi ~ '^[A-Z0-9]{4,15}$'),
  full_name text not null check (length(trim(full_name)) > 0),
  class_id smallint not null references public.classes(id),
  photo_path text,
  attendance_pct numeric not null default 100 check (attendance_pct between 0 and 100),
  status text not null default 'active' check (status in ('active','withdrawn')),
  created_at timestamptz not null default now()
);
create table public.student_subjects (
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id integer not null references public.subjects(id) on delete cascade,
  primary key (student_id, subject_id)
);
create table public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_id smallint not null references public.classes(id) on delete cascade,
  subject_id integer not null references public.subjects(id) on delete cascade,
  unique (teacher_id, class_id, subject_id)
);

-- exam: 0 = Opener, 1 = Mid-term, 2 = End-term
create table public.marks (
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id integer not null references public.subjects(id),
  academic_year text not null,
  term smallint not null check (term between 1 and 3),
  exam smallint not null check (exam between 0 and 2),
  score numeric check (score between 0 and 100),
  entered_by uuid default auth.uid() references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (student_id, subject_id, academic_year, term, exam)
);
create table public.mark_locks (
  class_id smallint not null references public.classes(id) on delete cascade,
  subject_id integer not null references public.subjects(id) on delete cascade,
  academic_year text not null,
  term smallint not null check (term between 1 and 3),
  exam smallint not null check (exam between 0 and 2),
  locked boolean not null default true,
  locked_by uuid default auth.uid() references public.profiles(id) on delete set null,
  primary key (class_id, subject_id, academic_year, term, exam)
);

-- fees
create table public.fee_items (
  id integer generated always as identity primary key,
  name text not null unique,
  category text not null,
  default_amount numeric not null default 0 check (default_amount >= 0),
  active boolean not null default true
);
create table public.fee_charges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  fee_item_id integer not null references public.fee_items(id),
  amount numeric not null check (amount > 0),
  academic_year text not null,
  term smallint not null check (term between 1 and 3),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references public.profiles(id) on delete set null
);
create sequence public.receipt_seq start 1;
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique,
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric not null check (amount > 0),
  method text not null check (method in ('Cash','M-Pesa','Bank')),
  reference text,
  balance_after numeric not null default 0,
  paid_at timestamptz not null default now(),
  recorded_by uuid references public.profiles(id) on delete set null
);
create table public.payment_allocations (
  payment_id uuid not null references public.payments(id) on delete cascade,
  fee_item_id integer not null references public.fee_items(id),
  amount numeric not null check (amount > 0),
  primary key (payment_id, fee_item_id)
);

-- parents
create table public.parent_children (
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  linked_at timestamptz not null default now(),
  primary key (parent_id, student_id)
);
create table public.link_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  ok boolean not null,
  at timestamptz not null default now()
);

-- online learning
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  class_id smallint not null references public.classes(id) on delete cascade,
  subject_id integer not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  teacher_name text not null default '',
  title text not null check (length(trim(title)) > 0),
  starts_at timestamptz not null,
  duration_min integer not null check (duration_min between 10 and 240),
  meeting_url text not null check (meeting_url ~ '^https://[^[:space:]]+$'),
  status text not null default 'scheduled' check (status in ('scheduled','live','ended')),
  created_at timestamptz not null default now()
);
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id smallint not null references public.classes(id) on delete cascade,
  subject_id integer not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  teacher_name text not null default '',
  title text not null check (length(trim(title)) > 0),
  notes text,
  due_date date not null,
  file_path text,
  file_name text,
  file_size integer check (file_size is null or file_size <= 5242880),
  created_at timestamptz not null default now()
);

-- indexes on foreign keys
create index on public.class_subjects (subject_id);
create index on public.students (class_id);
create index on public.student_subjects (subject_id);
create index on public.teacher_assignments (class_id, subject_id);
create index on public.teacher_assignments (subject_id);
create index on public.marks (subject_id);
create index on public.marks (entered_by);
create index on public.mark_locks (subject_id);
create index on public.mark_locks (locked_by);
create index on public.fee_charges (student_id);
create index on public.fee_charges (fee_item_id);
create index on public.fee_charges (created_by);
create index on public.payments (student_id);
create index on public.payments (recorded_by);
create index on public.payment_allocations (fee_item_id);
create index on public.parent_children (student_id);
create index on public.link_attempts (user_id, at);
create index on public.lessons (class_id, subject_id);
create index on public.lessons (subject_id);
create index on public.lessons (teacher_id);
create index on public.assignments (class_id, subject_id);
create index on public.assignments (subject_id);
create index on public.assignments (teacher_id);

-- balances per student and fee item (respects the caller's access rights)
create view public.fee_balances with (security_invoker = true) as
select c.student_id, c.fee_item_id, c.charged,
       coalesce(p.paid, 0) as paid, c.charged - coalesce(p.paid, 0) as balance
from (select student_id, fee_item_id, sum(amount) as charged from public.fee_charges group by 1, 2) c
left join (select py.student_id, a.fee_item_id, sum(a.amount) as paid
           from public.payment_allocations a join public.payments py on py.id = a.payment_id group by 1, 2) p
  using (student_id, fee_item_id);

-- ===== reference data =====
insert into public.classes (id, name) values
 (1,'Playgroup'),(2,'PP1'),(3,'PP2'),(4,'Grade 1'),(5,'Grade 2'),(6,'Grade 3'),
 (7,'Grade 4'),(8,'Grade 5'),(9,'Grade 6'),(10,'Grade 7'),(11,'Grade 8'),(12,'Grade 9');

do $$
declare
  l0 text[] := array['Language Activities','Mathematical Activities','Environmental Activities','Psychomotor & Creative Activities','Religious Education Activities'];
  l1 text[] := array['English Language Activities','Kiswahili / Kenya Sign Language','Indigenous Language','Mathematics','Environmental Activities','Religious Education','Creative Activities'];
  l2 text[] := array['English','Kiswahili / Kenya Sign Language','Mathematics','Science and Technology','Social Studies','Agriculture','Home Science','Religious Education','Creative Arts','Physical & Health Education'];
  l3 text[] := array['English','Kiswahili','Mathematics','Integrated Science','Social Studies','Religious Education','Business Studies','Agriculture','Life Skills','Pre-Technical Studies','Sports & Physical Education','Health Education'];
  opt text[] := array['Computer Science','Home Science','Visual Arts','Performing Arts','Foreign Languages','Indigenous Languages'];
begin
  insert into public.subjects (name) select distinct x from unnest(l0 || l1 || l2 || l3 || opt) x;
  insert into public.class_subjects (class_id, subject_id, optional)
    select c, s.id, false from unnest(l0) n join public.subjects s on s.name = n cross join generate_series(1,3) c;
  insert into public.class_subjects (class_id, subject_id, optional)
    select c, s.id, false from unnest(l1) n join public.subjects s on s.name = n cross join generate_series(4,6) c;
  insert into public.class_subjects (class_id, subject_id, optional)
    select c, s.id, false from unnest(l2) n join public.subjects s on s.name = n cross join generate_series(7,9) c;
  insert into public.class_subjects (class_id, subject_id, optional)
    select c, s.id, false from unnest(l3) n join public.subjects s on s.name = n cross join generate_series(10,12) c;
  insert into public.class_subjects (class_id, subject_id, optional)
    select c, s.id, true from unnest(opt) n join public.subjects s on s.name = n cross join generate_series(10,12) c
    on conflict (class_id, subject_id) do nothing;
end $$;

-- Starting amounts are placeholders. Accounts should set the real ones.
insert into public.fee_items (name, category, default_amount) values
 ('Activity fee','Tuition/Term Fee',3000),('Admission Fee','Admission Fee',5000),('Admission & Caution','Admission Fee',8000),
 ('Arrears','Tuition/Term Fee',0),('Books','Books & Stationery',3000),('Caution fee','Admission Fee',3000),
 ('Computer Lessons','Tuition/Term Fee',2500),('Diary','Books & Stationery',300),('Fee penalty','Penalties/Fines',500),
 ('Graduation fee','Graduation Fee',3000),('Holiday homework book','Books & Stationery',500),('Interview','Admission Fee',1000),
 ('Morning snacks','Meals/Snacks',4000),('Report Book','Books & Stationery',200),('Requirements','Books & Stationery',1000),
 ('Rubrics','Books & Stationery',500),('Stationery','Books & Stationery',2000),('Swimming','Swimming',2500),
 ('Term fee','Tuition/Term Fee',30000),('Text Books','Books & Stationery',5000),('Tour','Tours/Trips',5000),
 ('Transport','Transport',8000),('Uniform','Uniform',6000);
