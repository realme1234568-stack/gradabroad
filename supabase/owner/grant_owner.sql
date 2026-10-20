-- Run ONLY after approving this owner grant, after the migration above, and
-- after the named user has signed in and verified the approved email address.
-- Immediately after BEGIN in an execution-only copy, use
-- select set_config('app.owner_email', 'APPROVED_EMAIL', true);
-- This keeps the setting local to this transaction.
-- Never commit the personal address or any credentials to the repository.
-- No user metadata, browser flags, or email strings in client code grant access.
begin;
lock table app_private.owners in share row exclusive mode;
do $$
declare target_id uuid; matches integer; target_email text := lower(btrim(current_setting('app.owner_email',true)));
begin
  if target_email is null or target_email='' then raise exception 'Set app.owner_email to the approved verified email before provisioning'; end if;
  select count(*),min(id::text)::uuid into matches,target_id from auth.users
  where lower(email)=target_email
    and email_confirmed_at is not null and deleted_at is null
    and not coalesce(is_anonymous,false) and (banned_until is null or banned_until < now());
  if matches<>1 then raise exception 'Exactly one verified, active account with the requested email is required'; end if;
  if exists (select 1 from app_private.owners where user_id<>target_id) then
    raise exception 'Another owner already exists. Review ownership before proceeding.';
  end if;
  insert into app_private.owners(user_id) values(target_id) on conflict do nothing;
  if found then
    insert into app_private.owner_audit(actor_id,action,summary) values(target_id,'owner.granted','Application owner access activated');
  end if;
end $$;
commit;
