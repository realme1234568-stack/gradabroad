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
