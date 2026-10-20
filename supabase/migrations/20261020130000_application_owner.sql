-- Owner capabilities are granted to an immutable verified auth account in a
-- SEPARATE provisioning script. This migration does not grant anyone ownership.
begin;
create schema app_private;
revoke all on schema app_private from public, anon, authenticated;
create table app_private.owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);
create table app_private.owner_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  action text not null,
  summary text not null,
  recorded_at timestamptz not null default now()
);
alter table app_private.owners enable row level security;
alter table app_private.owner_audit enable row level security;
revoke all on all tables in schema app_private from public, anon, authenticated;
revoke all on all sequences in schema app_private from public, anon, authenticated;

create function public.is_app_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from app_private.owners o join auth.users u on u.id=o.user_id
    where o.user_id=(select auth.uid()) and u.email_confirmed_at is not null
      and u.deleted_at is null and not coalesce(u.is_anonymous,false)
      and (u.banned_until is null or u.banned_until < now())
  );
$$;
revoke all on function public.is_app_owner() from public, anon, authenticated;
grant execute on function public.is_app_owner() to authenticated;

-- Fail rather than silently coexist with a policy that could expose drafts.
do $$ begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='programs'
    and policyname <> 'Programs are readable') then
    raise exception 'Unexpected programs policies: review before applying owner migration';
  end if;
end $$;
create unique index if not exists programs_unique_university_course on public.programs(university_name,course_name);
alter table public.programs add column is_published boolean not null default true;
alter table public.programs add column revision integer not null default 1 check (revision > 0);
alter table public.programs enable row level security;
drop policy if exists "Programs are readable" on public.programs;
create policy "Published programs are readable" on public.programs for select to anon, authenticated using (is_published);
revoke all on public.programs from public, anon, authenticated;
grant select on public.programs to anon, authenticated;

create function public.owner_overview() returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_app_owner() then raise exception 'Owner access required' using errcode='42501'; end if;
  return jsonb_build_object(
    'email', (select email from auth.users where id=auth.uid()),
    'accounts', (select count(*) from auth.users where deleted_at is null and not coalesce(is_anonymous,false)),
    'programs', (select count(*) from public.programs),
    'published', (select count(*) from public.programs where is_published),
    'shortlists', (select count(*) from public.shortlists),
    'journeys', (select count(*) from public.account_data where kind='journey'),
    'activity', coalesce((select jsonb_agg(a order by a.id desc) from
      (select id,action,summary,recorded_at from app_private.owner_audit order by id desc limit 30) a),'[]'::jsonb)
  );
end;
$$;

create function public.owner_programs(p_query text default '', p_state text default 'all', p_page integer default 0) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare rows jsonb; total bigint;
begin
  if not public.is_app_owner() then raise exception 'Owner access required' using errcode='42501'; end if;
  if p_query is null or char_length(p_query)>120 or p_state is null or p_state not in ('all','published','archived')
     or p_page is null or p_page<0 or p_page>100000 then
    raise exception 'Invalid catalogue filters' using errcode='22023';
  end if;
  select count(*) into total from public.programs
    where (university_name ilike '%'||p_query||'%' or course_name ilike '%'||p_query||'%')
      and (p_state='all' or is_published=(p_state='published'));
  select coalesce(jsonb_agg(row order by row.university_name,row.course_name,row.id),'[]'::jsonb) into rows from (
    select id,university_name,course_name,level,language,is_published,revision from public.programs
    where (university_name ilike '%'||p_query||'%' or course_name ilike '%'||p_query||'%')
      and (p_state='all' or is_published=(p_state='published'))
    order by university_name,course_name,id limit 25 offset (p_page*25)
  ) row;
  return jsonb_build_object('items',rows,'total',total,'page',p_page);
end;
$$;

create function public.owner_save_program(p_program jsonb, p_expected_revision integer default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare saved public.programs%rowtype; previous public.programs%rowtype; new_id uuid;
  uni text; course text; degree text; lang text; published boolean; event text;
begin
  if not public.is_app_owner() then raise exception 'Owner access required' using errcode='42501'; end if;
  if p_program is null or jsonb_typeof(p_program)<>'object' then raise exception 'Invalid program' using errcode='22023'; end if;
  if exists (select 1 from jsonb_object_keys(p_program) k where k not in ('id','university_name','course_name','level','language','is_published'))
    or jsonb_typeof(p_program->'university_name') is distinct from 'string'
    or jsonb_typeof(p_program->'course_name') is distinct from 'string'
    or jsonb_typeof(p_program->'level') is distinct from 'string'
    or jsonb_typeof(p_program->'language') is distinct from 'string'
    or jsonb_typeof(p_program->'is_published') is distinct from 'boolean' then
    raise exception 'Invalid program fields' using errcode='22023';
  end if;
  uni:=btrim(p_program->>'university_name'); course:=btrim(p_program->>'course_name');
  degree:=p_program->>'level'; lang:=btrim(p_program->>'language'); published:=(p_program->>'is_published')::boolean;
  if char_length(uni) not between 1 and 240 or char_length(course) not between 1 and 400
     or degree not in ('bachelor','master') or char_length(lang) not between 1 and 120 then
    raise exception 'Check program names, degree level, and language' using errcode='22023';
  end if;
  if p_program ? 'id' then
    if jsonb_typeof(p_program->'id') is distinct from 'string' or p_expected_revision is null or p_expected_revision<1 then
      raise exception 'A valid program and revision are required' using errcode='22023';
    end if;
    new_id:=(p_program->>'id')::uuid;
    select * into previous from public.programs where id=new_id for update;
    if not found or previous.revision<>p_expected_revision then
      raise exception 'This program changed. Reload before editing.' using errcode='40001';
    end if;
    update public.programs set university_name=uni,course_name=course,level=degree,language=lang,
      is_published=published,revision=revision+1 where id=new_id returning * into saved;
    event:=case when previous.is_published and not published then 'program.archived'
      when not previous.is_published and published then 'program.published' else 'program.updated' end;
  else
    if p_expected_revision is not null then raise exception 'New programs cannot include a revision' using errcode='22023'; end if;
    insert into public.programs (university_name,course_name,level,language,is_published)
      values (uni,course,degree,lang,published) returning * into saved;
    event:='program.created';
  end if;
  insert into app_private.owner_audit(actor_id,action,summary)
    values (auth.uid(),event,saved.university_name || ' — ' || saved.course_name);
  return jsonb_build_object('id',saved.id,'university_name',saved.university_name,'course_name',saved.course_name,
    'level',saved.level,'language',saved.language,'is_published',saved.is_published,'revision',saved.revision);
end;
$$;

revoke all on function public.owner_overview() from public, anon, authenticated;
revoke all on function public.owner_programs(text,text,integer) from public, anon, authenticated;
revoke all on function public.owner_save_program(jsonb,integer) from public, anon, authenticated;
grant execute on function public.owner_overview() to authenticated;
grant execute on function public.owner_programs(text,text,integer) to authenticated;
grant execute on function public.owner_save_program(jsonb,integer) to authenticated;

-- Move the EXISTING nine hard-coded Master's entries into the editable catalogue.
-- No new university/course claims are introduced. Existing records are preserved.
insert into public.programs (university_name,course_name,level,language) values
('Leuphana University of Lüneburg','M.Sc. Management & Entrepreneurship','master','English'),
('Otto von Guericke University Magdeburg','M.Sc. International Management, Marketing & Entrepreneurship (IMME)','master','English'),
('Chemnitz University of Technology','M.Sc. Management & Economics','master','English'),
('University of Duisburg-Essen','M.Sc. Economics (Applied / Business)','master','English'),
('University of Siegen','M.Sc. Economics / Economic Policy','master','English'),
('University of Cologne','M.Sc. Economics','master','English'),
('University of Passau','M.Sc. International Economics & Business','master','English'),
('TU Berlin','IMES','master','English'),
('Technical University of Munich','M.Sc. Management and digital technology','master','English')
on conflict (university_name,course_name) do update set level=coalesce(nullif(btrim(public.programs.level),''),excluded.level), language=coalesce(nullif(btrim(public.programs.language),''),excluded.language);
commit;
