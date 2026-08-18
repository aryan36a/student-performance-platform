insert into public.students (id, name, mobile, email, prn, branch, division)
values
  ('11111111-1111-1111-1111-111111111111', 'Aarav Patil', '9999999991', 'aarav@example.edu', 'PRN-2026-001', 'Computer Engineering', 'A'),
  ('22222222-2222-2222-2222-222222222222', 'Sana Shaikh', '9999999992', 'sana@example.edu', 'PRN-2026-002', 'Information Technology', 'A'),
  ('33333333-3333-3333-3333-333333333333', 'Riya Kulkarni', '9999999993', 'riya@example.edu', 'PRN-2026-003', 'Computer Engineering', 'B'),
  ('44444444-4444-4444-4444-444444444444', 'Vedant Joshi', '9999999994', 'vedant@example.edu', 'PRN-2026-004', 'Information Technology', 'B')
on conflict (prn) do nothing;

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
values
  ('11111111-1111-1111-1111-111111111111', 15, 16, 15, 14, 15, 16, 91),
  ('22222222-2222-2222-2222-222222222222', 14, 15, 15, 15, 14, 15, 88),
  ('33333333-3333-3333-3333-333333333333', 13, 14, 14, 14, 14, 13, 82),
  ('44444444-4444-4444-4444-444444444444', 16, 16, 16, 15, 16, 17, 96)
on conflict (student_id) do nothing;

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
  a.computer_fundamentals,
  a.quantitative_aptitude,
  a.logical_reasoning,
  a.verbal_ability,
  a.pseudocode_debugging,
  a.coding,
  a.total
from public.students s
join public.assessment_scores a on a.student_id = s.id
on conflict (student_id) do nothing;

insert into public.imports (
  filename,
  uploaded_by,
  uploaded_at,
  student_count,
  status,
  error_count,
  warning_count
)
values
  ('seed-sample.xlsx', null, now(), 4, 'success', 0, 0);