
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
-- Private per-user storage for the existing profile and two calculators.
create table public.account_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('profile', 'expenses-inr', 'expenses-eur', 'budget-inr', 'budget-eur')),
  data jsonb not null,
  primary key (user_id, kind),
  check ((kind in ('profile', 'budget-inr', 'budget-eur') and jsonb_typeof(data) = 'object') or
         (kind in ('expenses-inr', 'expenses-eur') and jsonb_typeof(data) = 'array'))
);
alter table public.account_data enable row level security;
revoke all on public.account_data from anon;
revoke truncate, references, trigger on public.account_data from authenticated;
grant select, insert, update, delete on public.account_data to authenticated;
create policy "Account data belongs to its user" on public.account_data
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Notifications are written by a shortlist trigger, never directly by clients.
begin;
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
revoke all on public.notifications from public, anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy "Read own notifications" on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Mark own notifications read" on public.notifications for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create function public.record_shortlist_notification() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.notifications(user_id, message) values (new.user_id,
      new.university_name || ' — ' || new.course_name || ' added to your shortlist.');
  elsif TG_OP = 'DELETE' then
    -- Auth-account cascade deletion must not recreate notifications for a deleted user.
    if exists (select 1 from auth.users where id = old.user_id) then
      insert into public.notifications(user_id, message) values (old.user_id,
        old.university_name || ' — ' || old.course_name || ' removed from your shortlist.');
    end if;
  elsif new.status is distinct from old.status then
    insert into public.notifications(user_id, message) values (new.user_id,
      new.university_name || ' — ' || new.course_name || ': status changed to ' ||
      coalesce(case when new.status = 'Admit' then 'Accepted' else new.status end, 'Shortlisted') || '.');
  end if;
  return null;
end;
$$;
revoke all on function public.record_shortlist_notification() from public, anon, authenticated;
create trigger shortlist_notifications after insert or update of status or delete on public.shortlists
  for each row execute function public.record_shortlist_notification();
commit;
