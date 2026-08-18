# Student Performance Analytics Platform

Production-ready student analytics platform with two separate experiences:

- Public performance portal (no login required)
- Private admin panel for Excel dataset replacement

Tech stack:

- Next.js (App Router) + TypeScript
- Tailwind CSS + reusable shadcn-style UI primitives
- TanStack Table
- Recharts
- Supabase (PostgreSQL + Auth + RLS)
- SheetJS (`xlsx`) for Excel parsing

## Features

### Public portal

- Dashboard metrics and charts
- Leaderboard with tie-aware ranks
- Student directory with filtering and pagination
- Individual student profile view
- Analytics page (mean, median, std dev, subject and branch/division analysis, correlations)

### Admin panel

- Secure login at `/admin/login`
- Protected dashboard at `/admin`
- Drag/drop `.xlsx` upload
- Header and row validation
- Duplicate and warning detection
- Preview before import
- Atomic dataset replacement via PostgreSQL RPC function
- Import history table

### Privacy and security

- Public data is read from `student_public_scores` only
- Private fields (`mobile`, `email`, `prn`) stay in private tables
- RLS and admin policies protect private/admin data
- No service role key in browser
- Server-side admin checks on protected routes and import API

## Project structure

```txt
src/
	app/
		admin/
		analytics/
		leaderboard/
		students/
		api/
	components/
		admin/
		dashboard/
		layout/
		students/
		ui/
	lib/
		analytics.ts
		auth.ts
		data.ts
		excel.ts
		ranking.ts
		supabase/
	types/
supabase/
	migrations/
	seed.sql
```

## 1. Local setup

1. Install dependencies:

```bash
npm install
```

2. Set environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. `npm run dev`

4. Open `http://localhost:3000`

## 2. Supabase setup

1. Create a new Supabase project.
2. Open SQL Editor.
3. Run migration SQL from:

- `supabase/migrations/202608170001_initial_schema.sql`

4. Optional development seed:

- Run `supabase/seed.sql`

## 3. Database migration and schema notes

Core tables:

- `students` (private identity fields, including PRN)
- `assessment_scores`
- `student_public_scores` (public-safe denormalized table)
- `imports`
- `admin_users`

Indexes are created for search/filter/sort performance (name, branch, division, PRN, total).

## 4. RLS setup

RLS is enabled on all tables.

- Public users: read access only on `student_public_scores`
- Admin users: full access through `is_admin()` policy checks

The migration includes all required policies.

## 5. Create the admin account

1. In Supabase Auth, create one user (email/password).
2. Get the user id (`auth.users.id`) and email.
3. Insert in SQL editor:

```sql
insert into public.admin_users (user_id, email)
values ('YOUR_AUTH_USER_ID', 'admin@college.edu');
```

Only users in `admin_users` can access `/admin` and run imports.

## 6. Running locally

```bash
npm run dev
```

Production build check:

```bash
npm run build
```

## 7. Deployment to Vercel

1. Push repository to GitHub.
2. Import project into Vercel.
3. Add environment variables in Vercel Project Settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Deploy.

## 8. Updating production dataset

1. Open `/admin/login`
2. Sign in with authorized admin user.
3. Upload `.xlsx` file with required headers.
4. Review validation results and preview.
5. Confirm replace.

The import is performed through `replace_student_dataset(...)` RPC inside a database transaction. If something fails, the transaction rolls back.

## 9. Required Excel headers

Required:

- Name
- Branch
- Division
- University PRN
- Computer Fundamentals
- Quantitative Aptitude
- Logical Reasoning
- Verbal Ability
- Pseudocode & Debugging
- Coding
- Total

Optional:

- Sr. No.
- Mobile
- Email

Header names are used directly; column letters are not used.

## 10. Notes

- `.env.local` is ignored by git and should not be committed.
- Public pages never query private student fields.
- Import route re-validates data server-side before database replacement.
