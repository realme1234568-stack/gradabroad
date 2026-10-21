begin;

-- Dedicated PRIVATE bucket. No names, emails, or document titles in object keys.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('student-documents', 'student-documents', false, 3145728, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create table public.student_documents (
  id uuid primary key,
  -- Account deletion must first remove Storage objects through the Storage API.
  user_id uuid not null references auth.users(id) on delete restrict,
  original_name text not null check (char_length(original_name) between 1 and 150),
  category text not null check (category in ('Passport','Academic records','Language tests','APS','Recommendations','Statement of purpose','Admission','Visa','Financial documents','Other')),
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png')),
  size_bytes integer not null check (size_bytes between 1 and 3145728),
  object_path text not null unique,
  state text not null default 'pending' check (state in ('pending','ready')),
  created_at timestamptz not null default now(),
  constraint document_key_matches_owner check (
    object_path = user_id::text || '/' || id::text || case mime_type when 'application/pdf' then '.pdf' when 'image/png' then '.png' else '.jpg' end
  )
);
create index student_documents_user_created on public.student_documents(user_id, created_at desc);
alter table public.student_documents enable row level security;
alter table public.student_documents force row level security;
revoke all on public.student_documents from public, anon, authenticated;
grant select on public.student_documents to authenticated;
grant all on public.student_documents to service_role;
create policy documents_read_own on public.student_documents for select to authenticated
  using (user_id = (select auth.uid()));

-- Restrictive policies also fence off this bucket from broad policies that may
-- exist for unrelated buckets. Browser writes cannot bypass server validation.
create function public.can_read_student_document(p_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.student_documents d where d.object_path = p_path and d.user_id = (select auth.uid()) and d.state = 'ready');
$$;
revoke all on function public.can_read_student_document(text) from public;
grant execute on function public.can_read_student_document(text) to anon,authenticated;
create policy documents_download_own on storage.objects for select to authenticated
  using (bucket_id = 'student-documents' and public.can_read_student_document(name));
create policy documents_read_fence on storage.objects as restrictive for select to public
  using (bucket_id <> 'student-documents' or public.can_read_student_document(name));
create policy documents_insert_fence on storage.objects as restrictive for insert to public
  with check (bucket_id <> 'student-documents');
create policy documents_update_fence on storage.objects as restrictive for update to public
  using (bucket_id <> 'student-documents') with check (bucket_id <> 'student-documents');
create policy documents_delete_fence on storage.objects as restrictive for delete to public
  using (bucket_id <> 'student-documents');

create schema if not exists documents_private;
revoke all on schema documents_private from public, anon, authenticated;
create table documents_private.upload_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  attempts integer not null
);
alter table documents_private.upload_limits enable row level security;
alter table documents_private.upload_limits force row level security;
revoke all on documents_private.upload_limits from public, anon, authenticated;

create function public.document_upload_attempt(p_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_attempts integer;
begin
  if not exists (select 1 from auth.users where id = p_user_id and email_confirmed_at is not null and not coalesce(is_anonymous,false) and deleted_at is null) then
    raise exception 'DOCUMENT_AUTH_REQUIRED';
  end if;
  insert into documents_private.upload_limits(user_id,window_start,attempts) values (p_user_id,now(),1)
  on conflict(user_id) do update set
    window_start = case when upload_limits.window_start <= now() - interval '1 hour' then now() else upload_limits.window_start end,
    attempts = case when upload_limits.window_start <= now() - interval '1 hour' then 1 else least(upload_limits.attempts + 1,31) end
  returning attempts into v_attempts;
  if v_attempts > 30 then raise exception 'DOCUMENT_RATE_LIMIT'; end if;
end;
$$;
revoke all on function public.document_upload_attempt(uuid) from public, anon, authenticated;
grant execute on function public.document_upload_attempt(uuid) to service_role;

create function public.reserve_student_document(p_id uuid,p_user_id uuid,p_name text,p_category text,p_mime text,p_size integer,p_path text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_count integer; v_size bigint;
begin
  if not exists (select 1 from auth.users where id = p_user_id and email_confirmed_at is not null and not coalesce(is_anonymous,false) and deleted_at is null) then
    raise exception 'DOCUMENT_AUTH_REQUIRED';
  end if;
  -- Serialize quota reservations across concurrent requests/server instances.
  perform pg_advisory_xact_lock(hashtextextended('student-documents:' || p_user_id::text,0));
  select count(*),coalesce(sum(size_bytes),0) into v_count,v_size from public.student_documents where user_id = p_user_id;
  if v_count >= 50 or v_size + p_size > 157286400 then raise exception 'DOCUMENT_QUOTA'; end if;
  insert into public.student_documents(id,user_id,original_name,category,mime_type,size_bytes,object_path)
  values (p_id,p_user_id,p_name,p_category,p_mime,p_size,p_path);
end;
$$;
revoke all on function public.reserve_student_document(uuid,uuid,text,text,text,integer,text) from public, anon, authenticated;
grant execute on function public.reserve_student_document(uuid,uuid,text,text,text,integer,text) to service_role;

commit;
