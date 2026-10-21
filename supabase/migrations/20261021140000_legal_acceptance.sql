-- Versioned, account-bound acknowledgement. No IP address or browser fingerprint.
begin;
create schema if not exists app_private;
create table app_private.legal_acceptances (
  user_id uuid not null references auth.users(id) on delete cascade,
  version text not null check (version = '2026-10-21'),
  accepted_at timestamptz not null default now(),
  source text not null check (source in ('prelogin','onboarding')),
  primary key (user_id,version)
);
alter table app_private.legal_acceptances enable row level security;
revoke all on app_private.legal_acceptances from public,anon,authenticated;

create function public.has_accepted_legal(p_version text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from app_private.legal_acceptances a
    where a.user_id = (select auth.uid()) and a.version = p_version
  );
$$;
create function public.accept_legal(p_version text,p_source text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_version is distinct from '2026-10-21' or p_source is null or p_source not in ('prelogin','onboarding') then
    raise exception 'Invalid policy acknowledgement' using errcode='22023';
  end if;
  if not exists (select 1 from auth.users u where u.id=(select auth.uid())
    and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
    and u.deleted_at is null and (u.banned_until is null or u.banned_until < now())) then
    raise exception 'Verified active account required' using errcode='42501';
  end if;
  insert into app_private.legal_acceptances(user_id,version,source)
    values ((select auth.uid()),p_version,p_source) on conflict (user_id,version) do nothing;
  return true;
end;
$$;
revoke all on function public.has_accepted_legal(text) from public,anon;
revoke all on function public.accept_legal(text,text) from public,anon;
grant execute on function public.has_accepted_legal(text) to authenticated;
grant execute on function public.accept_legal(text,text) to authenticated;
commit;
