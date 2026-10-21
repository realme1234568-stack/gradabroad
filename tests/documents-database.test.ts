// @vitest-environment node
import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";

let db: PGlite;
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
const first = "00000000-0000-4000-8000-000000000003";
const second = "00000000-0000-4000-8000-000000000004";
async function asUser(id: string | null, role = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? ""]);
  await db.exec(`set role ${role}`);
}
async function reserve(id = first, user = alice, path = `${user}/${id}.pdf`) {
  await db.query("select public.reserve_student_document($1,$2,'test.pdf','Passport','application/pdf',20,$3)", [id, user, path]);
}
beforeAll(async () => {
  db = await PGlite.create();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false,deleted_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,storage to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to anon,authenticated,service_role;
    -- Deliberately permissive legacy policy: document fences must still win.
    create policy legacy_broad_policy on storage.objects for all to anon,authenticated using(true) with check(true);
  `);
  await db.exec(await readFile(new URL("../supabase/migrations/20261021100000_private_student_documents.sql", import.meta.url), "utf8"));
}, 20000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => {
  await db.exec("reset role; truncate public.student_documents,documents_private.upload_limits,storage.objects,auth.users cascade;");
  await db.query("insert into auth.users(id,email_confirmed_at) values ($1,now()),($2,now())", [alice,bob]);
});
test("bucket is private and limits MIME types and size", async () => {
  const bucket = (await db.query<{public: boolean; file_size_limit: number; allowed_mime_types: string[]}>("select * from storage.buckets where id='student-documents'")).rows[0];
  expect(bucket.public).toBe(false); expect(Number(bucket.file_size_limit)).toBe(3145728);
  expect(bucket.allowed_mime_types).toEqual(["application/pdf","image/jpeg","image/png"]);
});
test("students see only their metadata; no client can forge ownership or bypass validation", async () => {
  await asUser(null,"service_role"); await reserve(); await reserve(second,bob);
  await asUser(alice);
  expect((await db.query("select id from public.student_documents")).rows).toEqual([{id:first}]);
  await expect(reserve()).rejects.toThrow(/permission denied/);
  await expect(db.query("update public.student_documents set user_id=$1", [bob])).rejects.toThrow(/permission denied/);
  await expect(db.exec("delete from public.student_documents")).rejects.toThrow(/permission denied/);
  await asUser(null,"anon");
  await expect(db.exec("select * from public.student_documents")).rejects.toThrow(/permission denied/);
});
test("storage denies other users and anonymous reads even with a broad existing policy", async () => {
  await asUser(null,"service_role"); await reserve(); await reserve(second,bob);
  await db.exec("update public.student_documents set state='ready'");
  await db.query("insert into storage.objects(bucket_id,name) values ('student-documents',$1),('student-documents',$2),('public-assets','logo.png')", [`${alice}/${first}.pdf`,`${bob}/${second}.pdf`]);
  await asUser(alice);
  expect((await db.exec("select name from storage.objects order by name"))[0].rows).toEqual([{name:`${alice}/${first}.pdf`},{name:"logo.png"}]);
  await asUser(bob);
  expect((await db.exec("select name from storage.objects where bucket_id='student-documents'"))[0].rows).toEqual([{name:`${bob}/${second}.pdf`}]);
  await asUser(null,"anon");
  expect((await db.exec("select name from storage.objects"))[0].rows).toEqual([{name:"logo.png"}]);
});
test("pending uploads are not downloadable; direct insert, overwrite, and deletion are blocked", async () => {
  await asUser(null,"service_role"); await reserve();
  await db.query("insert into storage.objects(bucket_id,name) values ('student-documents',$1)", [`${alice}/${first}.pdf`]);
  await asUser(alice);
  expect((await db.exec("select * from storage.objects"))[0].rows).toEqual([]);
  await expect(db.query("insert into storage.objects(bucket_id,name) values ('student-documents',$1)", [`${alice}/${second}.pdf`])).rejects.toThrow(/row-level security/);
  await asUser(null,"service_role"); await db.exec("update public.student_documents set state='ready'");
  await asUser(alice);
  expect((await db.exec("update storage.objects set name='changed' returning name"))[0].rows).toEqual([]);
  expect((await db.exec("delete from storage.objects returning name"))[0].rows).toEqual([]);
});
test("quotas count pending uploads and a forged path is rejected", async () => {
  await asUser(null,"service_role");
  await expect(reserve(first,alice,`${bob}/${first}.pdf`)).rejects.toThrow(/document_key_matches_owner/);
  await db.query(`select public.reserve_student_document(id,$1::uuid,'test.pdf','Other','application/pdf',1,$1::text || '/' || id || '.pdf') from (select gen_random_uuid() id from generate_series(1,50)) f`, [alice]);
  await expect(reserve()).rejects.toThrow(/DOCUMENT_QUOTA/);
});
test("upload rate limit is durable and cannot be reset by a client", async () => {
  await asUser(null,"service_role");
  for(let i=0;i<30;i++) await db.query("select public.document_upload_attempt($1)",[alice]);
  await expect(db.query("select public.document_upload_attempt($1)",[alice])).rejects.toThrow(/DOCUMENT_RATE_LIMIT/);
  await asUser(alice);
  await expect(db.query("select public.document_upload_attempt($1)",[alice])).rejects.toThrow(/permission denied/);
  await expect(db.exec("delete from documents_private.upload_limits")).rejects.toThrow(/permission denied/);
});
