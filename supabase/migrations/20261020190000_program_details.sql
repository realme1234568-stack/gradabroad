-- Adds source-backed public catalogue facts without changing personal-data policies.
begin;
create function public.program_details_valid(d jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare k text; required_keys text[]:=array['version','institution_type','english_taught','city','subject','award','duration','credits','teaching_notes','english_requirement','academic_requirements','admission_band','admission_basis','intakes','deadlines','tuition','semester_fee','application_route','documents','source_url','official_url','admissions_url','fees_url','reviewed_on','notes'];
begin
  if d is null or jsonb_typeof(d)<>'object' or octet_length(d::text)>40000 then return false; end if;
  if exists(select 1 from jsonb_object_keys(d) x where not x=any(required_keys)) then return false; end if;
  if exists(select 1 from unnest(required_keys) x where not d ? x) then return false; end if;
  if d->'version'<>'1'::jsonb or d->>'institution_type'<>'public' or jsonb_typeof(d->'english_taught')<>'boolean' then return false; end if;
  foreach k in array required_keys loop
    if k not in ('version','english_taught') and (jsonb_typeof(d->k)<>'string' or char_length(d->>k)>2500) then return false; end if;
  end loop;
  if d->>'admission_band' not in ('demanding','additional','standard','open','unreviewed') then return false; end if;
  foreach k in array array['source_url','official_url','admissions_url','fees_url'] loop
    if d->>k<>'' and (char_length(d->>k)>1200 or d->>k !~ '^https://[A-Za-z0-9.-]+[.][A-Za-z]{2,}(:[0-9]+)?([/?#][^[:space:]]*)?$') then return false; end if;
  end loop;
  if d->>'reviewed_on'<>'' and ((d->>'reviewed_on') !~ '^\d{4}-\d{2}-\d{2}$' or ((d->>'reviewed_on')::date)::text<>d->>'reviewed_on') then return false; end if;
  if d->>'admission_band'<>'unreviewed' and btrim(d->>'admission_basis')='' then return false; end if;
  if (d->>'english_taught')::boolean and (d->>'official_url'='' or d->>'reviewed_on'='' or btrim(d->>'teaching_notes')='') then return false; end if;
  return true;
exception when others then return false;
end $$;
revoke all on function public.program_details_valid(jsonb) from public,anon,authenticated;
grant execute on function public.program_details_valid(jsonb) to authenticated;
alter table public.programs add column details jsonb;
alter table public.programs add constraint programs_details_shape check(details is null or public.program_details_valid(details));
create or replace function public.owner_programs(p_query text default '', p_state text default 'all', p_page integer default 0) returns jsonb
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
    select id,university_name,course_name,level,language,is_published,revision,details from public.programs
    where (university_name ilike '%'||p_query||'%' or course_name ilike '%'||p_query||'%')
      and (p_state='all' or is_published=(p_state='published'))
    order by university_name,course_name,id limit 25 offset (p_page*25)
  ) row;
  return jsonb_build_object('items',rows,'total',total,'page',p_page);
end;
$$;

create or replace function public.owner_save_program(p_program jsonb, p_expected_revision integer default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare saved public.programs%rowtype; previous public.programs%rowtype; new_id uuid;
  uni text; course text; degree text; lang text; published boolean; event text;
begin
  if not public.is_app_owner() then raise exception 'Owner access required' using errcode='42501'; end if;
  if p_program is null or jsonb_typeof(p_program)<>'object' then raise exception 'Invalid program' using errcode='22023'; end if;
  if exists (select 1 from jsonb_object_keys(p_program) k where k not in ('id','university_name','course_name','level','language','is_published','details'))
    or jsonb_typeof(p_program->'university_name') is distinct from 'string'
    or jsonb_typeof(p_program->'course_name') is distinct from 'string'
    or jsonb_typeof(p_program->'level') is distinct from 'string'
    or jsonb_typeof(p_program->'language') is distinct from 'string'
    or jsonb_typeof(p_program->'is_published') is distinct from 'boolean' then
    raise exception 'Invalid program fields' using errcode='22023';
  end if;
  if p_program ? 'details' and p_program->'details'<>'null'::jsonb and not public.program_details_valid(p_program->'details') then
    raise exception 'Invalid program details or source links' using errcode='22023';
  end if;
  if p_program ? 'details' and nullif(p_program->'details','null'::jsonb) is not null and nullif(p_program->'details'->>'reviewed_on','')::date > current_date then
    raise exception 'Review date cannot be in the future' using errcode='22023';
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
      is_published=published,revision=revision+1,details=case when p_program ? 'details' then nullif(p_program->'details','null'::jsonb) else previous.details end where id=new_id returning * into saved;
    event:=case when previous.is_published and not published then 'program.archived'
      when not previous.is_published and published then 'program.published' else 'program.updated' end;
  else
    if p_expected_revision is not null then raise exception 'New programs cannot include a revision' using errcode='22023'; end if;
    insert into public.programs (university_name,course_name,level,language,is_published,details)
      values (uni,course,degree,lang,published,nullif(p_program->'details','null'::jsonb)) returning * into saved;
    event:='program.created';
  end if;
  insert into app_private.owner_audit(actor_id,action,summary)
    values (auth.uid(),event,saved.university_name || ' — ' || saved.course_name);
  return jsonb_build_object('id',saved.id,'university_name',saved.university_name,'course_name',saved.course_name,
    'level',saved.level,'language',saved.language,'is_published',saved.is_published,'revision',saved.revision,'details',saved.details);
end;
$$;

revoke all on function public.owner_overview() from public, anon, authenticated;
revoke all on function public.owner_programs(text,text,integer) from public, anon, authenticated;
revoke all on function public.owner_save_program(jsonb,integer) from public, anon, authenticated;
grant execute on function public.owner_overview() to authenticated;
grant execute on function public.owner_programs(text,text,integer) to authenticated;
grant execute on function public.owner_save_program(jsonb,integer) to authenticated;


-- Public search runs under the caller's existing SELECT policies, never as owner.
create function public.search_english_programs(p_level text default 'master', p_query text default '', p_band text default 'all', p_page integer default 0) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare matches bigint; items jsonb;
begin
  if p_level is null or p_level not in ('bachelor','master') or p_query is null or char_length(p_query)>120
     or p_band is null or p_band not in ('all','demanding','additional','standard','open','unreviewed')
     or p_page is null or p_page<0 or p_page>10000 then
    raise exception 'Invalid catalogue filters' using errcode='22023';
  end if;
  select count(*) into matches from public.programs
    where is_published and lower(level) in (p_level,p_level||'s') and language='English'
      and details->>'institution_type'='public' and details->>'english_taught'='true'
      and (p_band='all' or details->>'admission_band'=p_band)
      and (p_query='' or strpos(lower(university_name||' '||course_name),lower(p_query))>0);
  select coalesce(jsonb_agg(row order by row.university_name,row.course_name,row.id),'[]'::jsonb) into items from (
    select id,university_name,course_name,p_level as level,language,details from public.programs
    where is_published and lower(level) in (p_level,p_level||'s') and language='English'
      and details->>'institution_type'='public' and details->>'english_taught'='true'
      and (p_band='all' or details->>'admission_band'=p_band)
      and (p_query='' or strpos(lower(university_name||' '||course_name),lower(p_query))>0)
    order by university_name,course_name,id limit 24 offset p_page*24
  ) row;
  return jsonb_build_object('items',items,'total',matches,'page',p_page);
end $$;
revoke all on function public.search_english_programs(text,text,text,integer) from public,anon,authenticated;
grant execute on function public.search_english_programs(text,text,text,integer) to anon,authenticated;
commit;
