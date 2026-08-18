create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text,
  email text,
  prn text not null unique,
  branch text not null,
  division text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessment_scores (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete cascade,
  computer_fundamentals numeric(6,2) not null,
  quantitative_aptitude numeric(6,2) not null,
  logical_reasoning numeric(6,2) not null,
  verbal_ability numeric(6,2) not null,
  pseudocode_debugging numeric(6,2) not null,
  coding numeric(6,2) not null,
  total numeric(6,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  student_count integer not null default 0,
  status text not null check (status in ('processing', 'success', 'failed')),
  error_count integer not null default 0,
  warning_count integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.student_public_scores (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete cascade,
  name text not null,
  branch text not null,
  division text not null,
  computer_fundamentals numeric(6,2) not null,
  quantitative_aptitude numeric(6,2) not null,
  logical_reasoning numeric(6,2) not null,
  verbal_ability numeric(6,2) not null,
  pseudocode_debugging numeric(6,2) not null,
  coding numeric(6,2) not null,
  total numeric(6,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_students_name on public.students(name);
create index if not exists idx_students_branch on public.students(branch);
create index if not exists idx_students_division on public.students(division);
create index if not exists idx_students_prn on public.students(prn);

create index if not exists idx_public_scores_name on public.student_public_scores(name);
create index if not exists idx_public_scores_branch on public.student_public_scores(branch);
create index if not exists idx_public_scores_division on public.student_public_scores(division);
create index if not exists idx_public_scores_total on public.student_public_scores(total desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists students_set_updated_at on public.students;
create trigger students_set_updated_at
before update on public.students
for each row execute function public.set_updated_at();

drop trigger if exists scores_set_updated_at on public.assessment_scores;
create trigger scores_set_updated_at
before update on public.assessment_scores
for each row execute function public.set_updated_at();

drop trigger if exists public_scores_set_updated_at on public.student_public_scores;
create trigger public_scores_set_updated_at
before update on public.student_public_scores
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.uid()
  );
$$;

alter table public.admin_users enable row level security;
alter table public.students enable row level security;
alter table public.assessment_scores enable row level security;
alter table public.imports enable row level security;
alter table public.student_public_scores enable row level security;

create policy "admin users can read their own record"
on public.admin_users
for select
using (auth.uid() = user_id);

create policy "admins can manage admin users"
on public.admin_users
for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins can manage students"
on public.students
for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins can manage assessment scores"
on public.assessment_scores
for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins can manage imports"
on public.imports
for all
using (public.is_admin())
with check (public.is_admin());

create policy "public can read public scores"
on public.student_public_scores
for select
using (true);

create policy "admins can manage public scores"
on public.student_public_scores
for all
using (public.is_admin())
with check (public.is_admin());

create or replace function public.replace_student_dataset(
  payload jsonb,
  p_filename text,
  p_warning_count integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  import_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  if jsonb_typeof(payload) <> 'array' then
    raise exception 'Payload must be a JSON array';
  end if;

  insert into public.imports (
    filename,
    uploaded_by,
    uploaded_at,
    student_count,
    status,
    error_count,
    warning_count
  ) values (
    p_filename,
    auth.uid(),
    now(),
    0,
    'processing',
    0,
    coalesce(p_warning_count, 0)
  )
  returning id into import_id;

  delete from public.students;
  delete from public.student_public_scores;

  with input_rows as (
    select *
    from jsonb_to_recordset(payload) as x(
      name text,
      mobile text,
      email text,
      prn text,
      branch text,
      division text,
      computer_fundamentals numeric,
      quantitative_aptitude numeric,
      logical_reasoning numeric,
      verbal_ability numeric,
      pseudocode_debugging numeric,
      coding numeric,
      total numeric
    )
  ), new_students as (
    insert into public.students (name, mobile, email, prn, branch, division)
    select
      trim(name),
      nullif(trim(coalesce(mobile, '')), ''),
      nullif(lower(trim(coalesce(email, ''))), ''),
      trim(prn),
      trim(branch),
      trim(division)
    from input_rows
    returning id, prn, name, branch, division
  )
  insert into public.assessment_scores (
    student_id,
    computer_fundamentals,
    quantitative_aptitude,
    logical_reasoning,
    verbal_ability,
    pseudocode_debugging,
    coding,
    total
  )
  select
    s.id,
    r.computer_fundamentals,
    r.quantitative_aptitude,
    r.logical_reasoning,
    r.verbal_ability,
    r.pseudocode_debugging,
    r.coding,
    r.total
  from input_rows r
  join new_students s on s.prn = trim(r.prn);

  with input_rows as (
    select *
    from jsonb_to_recordset(payload) as x(
      name text,
      mobile text,
      email text,
      prn text,
      branch text,
      division text,
      computer_fundamentals numeric,
      quantitative_aptitude numeric,
      logical_reasoning numeric,
      verbal_ability numeric,
      pseudocode_debugging numeric,
      coding numeric,
      total numeric
    )
  )
  insert into public.student_public_scores (
    student_id,
    name,
    branch,
    division,
    computer_fundamentals,
    quantitative_aptitude,
    logical_reasoning,
    verbal_ability,
    pseudocode_debugging,
    coding,
    total
  )
  select
    s.id,
    s.name,
    s.branch,
    s.division,
    r.computer_fundamentals,
    r.quantitative_aptitude,
    r.logical_reasoning,
    r.verbal_ability,
    r.pseudocode_debugging,
    r.coding,
    r.total
  from input_rows r
  join public.students s on s.prn = trim(r.prn);

  update public.imports
  set
    student_count = jsonb_array_length(payload),
    status = 'success',
    error_count = 0,
    warning_count = coalesce(p_warning_count, 0)
  where id = import_id;

  return import_id;
end;
$$;

grant usage on schema public to anon, authenticated;
grant select on public.student_public_scores to anon, authenticated;
grant select on public.imports to authenticated;
grant execute on function public.replace_student_dataset(jsonb, text, integer) to authenticated;