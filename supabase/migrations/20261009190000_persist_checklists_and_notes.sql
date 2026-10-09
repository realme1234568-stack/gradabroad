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
