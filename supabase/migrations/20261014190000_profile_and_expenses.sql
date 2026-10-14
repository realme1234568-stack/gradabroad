-- Private per-user storage for the existing profile and two calculators.
create table public.account_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('profile', 'expenses-inr', 'expenses-eur')),
  data jsonb not null,
  primary key (user_id, kind),
  check ((kind = 'profile' and jsonb_typeof(data) = 'object') or
         (kind in ('expenses-inr', 'expenses-eur') and jsonb_typeof(data) = 'array'))
);
alter table public.account_data enable row level security;
revoke all on public.account_data from anon;
grant select, insert, update, delete on public.account_data to authenticated;
create policy "Account data belongs to its user" on public.account_data
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
