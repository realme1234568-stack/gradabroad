-- Personal entries remain in the existing owner-scoped shortlist. No catalogue
-- insert, public listing, new elevated function or broader grants are introduced.
begin;
do $$ begin
  if not coalesce((select relrowsecurity from pg_class where oid='public.shortlists'::regclass),false) then
    raise exception 'Shortlist row security must be enabled before adding personal programs';
  end if;
end $$;
alter table public.shortlists add column if not exists official_url text;
alter table public.shortlists add column if not exists entry_source text not null default 'saved';
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.shortlists'::regclass and conname='shortlists_entry_source_check') then
    alter table public.shortlists add constraint shortlists_entry_source_check
      check(entry_source in ('saved','catalogue','manual'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.shortlists'::regclass and conname='shortlists_official_url_check') then
    alter table public.shortlists add constraint shortlists_official_url_check check(
      official_url is null or (char_length(official_url)<=2048 and official_url ~* '^https?://[^/@[:space:]]+([/?#][^[:space:]]*)?$')
    );
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.shortlists'::regclass and conname='shortlists_manual_names_check') then
    alter table public.shortlists add constraint shortlists_manual_names_check check(
      entry_source <> 'manual' or (
        university_name is not null and char_length(btrim(university_name)) between 1 and 200 and
        course_name is not null and char_length(btrim(course_name)) between 1 and 240
      )
    );
  end if;
end $$;
notify pgrst, 'reload schema';
commit;
