-- A separate owner-only journey record; no profile, expense, or budget rows change.
begin;
alter table public.account_data drop constraint account_data_kind_check;
alter table public.account_data drop constraint account_data_check;
alter table public.account_data add constraint account_data_kind_check
  check (kind in ('profile','expenses-inr','expenses-eur','budget-inr','budget-eur','journey'));
alter table public.account_data add constraint account_data_check check (
  (kind in ('profile','budget-inr','budget-eur','journey') and jsonb_typeof(data) = 'object') or
  (kind in ('expenses-inr','expenses-eur') and jsonb_typeof(data) = 'array')
);
-- The existing auth.uid() = user_id policy and grants are unchanged.
commit;
