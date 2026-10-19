-- Add independent private budget targets; existing profile/expense rows remain unchanged.
begin;
alter table public.account_data drop constraint account_data_kind_check;
alter table public.account_data drop constraint account_data_check;
alter table public.account_data add constraint account_data_kind_check
  check (kind in ('profile','expenses-inr','expenses-eur','budget-inr','budget-eur'));
alter table public.account_data add constraint account_data_check check (
  (kind in ('profile','budget-inr','budget-eur') and jsonb_typeof(data) = 'object') or
  (kind in ('expenses-inr','expenses-eur') and jsonb_typeof(data) = 'array')
);
-- Existing owner-only RLS also protects the new rows.
-- PostgREST needs only SELECT, INSERT, UPDATE and DELETE.
revoke truncate, references, trigger on public.account_data from authenticated;
commit;
