-- Migration: 202608170002_duplicate_flags
-- Adds duplicate/multiple-entry tracking columns to student_public_scores and imports.
-- Replaces replace_student_dataset RPC to accept and store these new fields.

-- ─── student_public_scores ────────────────────────────────────────────────────

alter table public.student_public_scores
  add column if not exists has_multiple_entries boolean not null default false,
  add column if not exists duplicate_type text check (
    duplicate_type in ('EXACT_DUPLICATE', 'MULTIPLE_ENTRY', 'IDENTITY_CONFLICT')
  );

-- ─── imports ──────────────────────────────────────────────────────────────────

alter table public.imports
  add column if not exists raw_entries integer not null default 0,
  add column if not exists unique_students integer not null default 0,
  add column if not exists multiple_entry_records integer not null default 0,
  add column if not exists identity_conflict_records integer not null default 0;

-- ─── replace_student_dataset (updated) ───────────────────────────────────────

create or replace function public.replace_student_dataset(
  payload jsonb,
  p_filename text,
  p_warning_count integer default 0,
  p_raw_entries integer default 0,
  p_unique_students integer default 0,
  p_multiple_entry_records integer default 0,
  p_identity_conflict_records integer default 0
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
    warning_count,
    raw_entries,
    unique_students,
    multiple_entry_records,
    identity_conflict_records
  ) values (
    p_filename,
    auth.uid(),
    now(),
    0,
    'processing',
    0,
    coalesce(p_warning_count, 0),
    coalesce(p_raw_entries, 0),
    coalesce(p_unique_students, 0),
    coalesce(p_multiple_entry_records, 0),
    coalesce(p_identity_conflict_records, 0)
  )
  returning id into import_id;

  -- Atomic replacement: clear existing data first.
  delete from public.students;
  delete from public.student_public_scores;

  -- Insert private student records.
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
      total numeric,
      has_multiple_entries boolean,
      duplicate_type text
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

  -- Insert public-safe scores including duplicate flags.
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
      total numeric,
      has_multiple_entries boolean,
      duplicate_type text
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
    total,
    has_multiple_entries,
    duplicate_type
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
    r.total,
    coalesce(r.has_multiple_entries, false),
    r.duplicate_type
  from input_rows r
  join public.students s on s.prn = trim(r.prn);

  update public.imports
  set
    student_count = jsonb_array_length(payload),
    status = 'success',
    error_count = 0,
    warning_count = coalesce(p_warning_count, 0),
    raw_entries = coalesce(p_raw_entries, 0),
    unique_students = coalesce(p_unique_students, 0),
    multiple_entry_records = coalesce(p_multiple_entry_records, 0),
    identity_conflict_records = coalesce(p_identity_conflict_records, 0)
  where id = import_id;

  return import_id;
end;
$$;

grant execute on function public.replace_student_dataset(jsonb, text, integer, integer, integer, integer, integer) to authenticated;
