create extension if not exists "uuid-ossp";

create table if not exists public.programs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  university_name text not null,
  course_name text not null,
  level text,
  language text,
  intake text,
  created_at timestamptz default now()
);

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

create policy "Programs are private" on public.programs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Shortlists are private" on public.shortlists
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Tracker rows are private" on public.application_tracker
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
