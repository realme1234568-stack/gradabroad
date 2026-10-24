// @vitest-environment node
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
let db:PGlite;let migration:string;
const a='00000000-0000-0000-0000-000000000001',b='00000000-0000-0000-0000-000000000002';
async function asUser(id:string,role='authenticated'){
  await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec(`set role ${role}`);
}
async function add(user=a,url='https://example.edu/program'){
  return db.query<{id:string}>("insert into public.shortlists(user_id,university_name,course_name,entry_source,official_url) values($1,'Personal University','Personal Program','manual',$2) returning id",[user,url]);
}
beforeAll(async()=>{
 db=await PGlite.create();
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
 create table public.shortlists(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users,university_name text not null,course_name text not null,note text not null default '',deadline text,program_level text,status text default 'Shortlisted',unique(user_id,university_name,course_name));
 alter table public.shortlists enable row level security;
 grant select,insert,update,delete on public.shortlists to authenticated;grant select on public.shortlists to anon;
 create policy own_shortlists on public.shortlists for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
 insert into auth.users values('${a}'),('${b}');
 insert into public.shortlists(user_id,university_name,course_name,note,deadline,status) values('${a}','Existing University','Existing Program','Keep this note','15 May','Admit');`);
 migration=await readFile('supabase/migrations/20261024090000_personal_shortlist_programs.sql','utf8');
 await db.exec(migration);
},20000);
afterAll(async()=>{await db.close();});
beforeEach(async()=>{await db.exec("reset role;delete from public.shortlists where entry_source='manual';");});
test('the additive migration preserves old entries and can be applied again safely',async()=>{
 await db.exec(migration);
 const row=(await db.query("select * from public.shortlists where course_name='Existing Program'")).rows[0];
 expect(row).toMatchObject({note:'Keep this note',deadline:'15 May',status:'Admit',entry_source:'saved',official_url:null,program_level:null});
});
test('a personal program is private to its owner and cannot be reassigned or inserted for someone else',async()=>{
 await asUser(a);const id=(await add()).rows[0].id;
 expect((await db.query('select id from public.shortlists where id=$1',[id])).rows).toHaveLength(1);
 await expect(add(b)).rejects.toThrow(/row-level security/i);
 await expect(db.query('update public.shortlists set user_id=$1 where id=$2',[b,id])).rejects.toThrow(/row-level security/i);
 await asUser(b);
 expect((await db.query('select id from public.shortlists where id=$1',[id])).rows).toHaveLength(0);
 expect((await db.query("update public.shortlists set note='unauthorised' where id=$1 returning id",[id])).rows).toHaveLength(0);
 expect((await db.query('delete from public.shortlists where id=$1 returning id',[id])).rows).toHaveLength(0);
 await asUser('', 'anon');expect((await db.query('select * from public.shortlists')).rows).toHaveLength(0);
 await expect(add()).rejects.toThrow(/permission denied/i);
 await asUser(a);expect((await db.query('select note from public.shortlists where id=$1',[id])).rows).toEqual([{note:''}]);
});
test('database constraints reject unsafe links, blank manual names and invalid source labels',async()=>{
 await asUser(a);
 for(const url of ['javascript:alert(1)','data:text/html,private','https://user:password@example.com','https://example.com/a b']) await expect(add(a,url)).rejects.toThrow(/check constraint/i);
 await expect(db.query("insert into public.shortlists(user_id,university_name,course_name,entry_source) values($1,' ','Course','manual')",[a])).rejects.toThrow(/check constraint/i);
 await expect(db.query("insert into public.shortlists(user_id,university_name,course_name,entry_source) values($1,'Example','Course','public')",[a])).rejects.toThrow(/check constraint/i);
});
