// @vitest-environment node
import { afterAll, beforeAll, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
let db: PGlite;
const a="00000000-0000-0000-0000-000000000001", b="00000000-0000-0000-0000-000000000002";
beforeAll(async()=>{
  db=await PGlite.create();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false,deleted_at timestamptz,banned_until timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated,anon;
    insert into auth.users(id,email_confirmed_at) values ('${a}',now()),('${b}',now());`);
  await db.exec(await readFile(new URL("../supabase/migrations/20261021140000_legal_acceptance.sql",import.meta.url),"utf8"));
},20000);
afterAll(async()=>{await db?.close();});
async function asUser(id:string,role="authenticated") {
  await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]); await db.exec(`set role ${role}`);
}
async function accepted() { return (await db.query<{ok:boolean}>("select public.has_accepted_legal('2026-10-21') as ok")).rows[0].ok; }
test("records only the calling account, stays immutable on repeated acceptance, and isolates another account",async()=>{
  await asUser(a); expect(await accepted()).toBe(false);
  await db.exec("select public.accept_legal('2026-10-21','prelogin')");
  expect(await accepted()).toBe(true);
  await db.exec("select public.accept_legal('2026-10-21','onboarding')");
  await expect(db.exec("select * from app_private.legal_acceptances")).rejects.toThrow();
  await asUser(b); expect(await accepted()).toBe(false);
  await db.exec("reset role");
  const rows=(await db.query<{source:string}>("select source from app_private.legal_acceptances")).rows;
  expect(rows).toEqual([{source:"prelogin"}]);
});
test("anonymous, unverified and banned users cannot accept; unsupported versions are rejected",async()=>{
  await asUser("","anon");
  await expect(db.exec("select public.accept_legal('2026-10-21','prelogin')")).rejects.toThrow();
  await asUser(b);
  await expect(db.exec("select public.accept_legal('old','prelogin')")).rejects.toThrow();
  await db.exec("reset role"); await db.query("update auth.users set email_confirmed_at=null where id=$1",[b]); await asUser(b);
  await expect(db.exec("select public.accept_legal('2026-10-21','prelogin')")).rejects.toThrow();
  await db.exec("reset role"); await db.query("update auth.users set email_confirmed_at=now(),banned_until=now()+interval '1 day' where id=$1",[b]); await asUser(b);
  await expect(db.exec("select public.accept_legal('2026-10-21','prelogin')")).rejects.toThrow();
});
