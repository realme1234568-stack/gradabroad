
create extension if not exists "uuid-ossp";

create table if not exists public.programs (
  id uuid primary key default uuid_generate_v4(),
  university_name text not null,
  course_name text not null,
  level text,
  language text,
  tuition_type text,
  gpa_requirement numeric,
  gmat_required boolean,
  application_mode text,
  intake text,
  created_at timestamptz default now()
);

alter table public.programs
  drop column if exists intake,
  drop column if exists user_id;

create unique index if not exists programs_unique_university_course
  on public.programs (university_name, course_name);

create table if not exists public.shortlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  university_name text not null,
  course_name text not null,
  deadline text,
  status text,
  created_at timestamptz default now()
);

create table if not exists public.application_tracker (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  university_name text not null,
  course_name text not null,
  status text not null,
  checklist text[] default '{}',
  created_at timestamptz default now()
);

alter table public.programs enable row level security;
alter table public.shortlists enable row level security;
alter table public.application_tracker enable row level security;

drop policy if exists "Programs are private" on public.programs;
drop policy if exists "Shortlists are private" on public.shortlists;
drop policy if exists "Tracker rows are private" on public.application_tracker;

create policy "Programs are readable" on public.programs
  for select
  using (true);


create policy "Shortlists are private" on public.shortlists
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Tracker rows are private" on public.application_tracker
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into public.programs (university_name, course_name, level, language)
values
  ('Leuphana University of Lüneburg', 'M.Sc. Management & Entrepreneurship', null, null),
  ('Otto von Guericke University Magdeburg', 'M.Sc. International Management, Marketing & Entrepreneurship (IMME)', null, null),
  ('Chemnitz University of Technology', 'M.Sc. Management & Economics', null, null),
  ('University of Duisburg-Essen', 'M.Sc. Economics (Applied / Business)', null, null),
  ('University of Siegen', 'M.Sc. Economics / Economic Policy', null, null),
  ('University of Cologne', 'M.Sc. Economics', null, null),
  ('University of Passau', 'M.Sc. International Economics & Business', null, null),
  ('TU Berlin', 'IMES', null, null),
  ('Technical University of Munich', 'M.Sc. Management and digital technology', null, null)
on conflict (university_name, course_name) do nothing;

-- Additive migration: preserves existing shortlist rows and application data.
alter table public.shortlists add column if not exists note text not null default '';
alter table public.shortlists add column if not exists program_level text;

create table public.tracker_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  doc_status jsonb not null default '{}'::jsonb check (jsonb_typeof(doc_status) = 'object'),
  mandatory_status jsonb not null default '{}'::jsonb check (jsonb_typeof(mandatory_status) = 'object'),
  custom_docs text[] not null default '{}',
  custom_mandatory_docs text[] not null default '{}'
);
alter table public.tracker_preferences enable row level security;
grant select, insert, update, delete on public.tracker_preferences to authenticated;
create policy "Users manage their own checklist" on public.tracker_preferences
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
