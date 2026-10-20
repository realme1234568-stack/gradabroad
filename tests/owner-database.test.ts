// @vitest-environment node
import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

// Real PostgreSQL policy/function execution in an isolated in-memory database.
// Auth is a minimal fixture; no production credentials, records, or files are used.
let db: PGlite;
let grant: string;
const owner = "00000000-0000-0000-0000-000000000001";
const student = "00000000-0000-0000-0000-000000000002";
const other = "00000000-0000-0000-0000-000000000003";
const payload = {
  university_name: "Example University",
  course_name: "M.Sc. Example",
  level: "master",
  language: "English",
  is_published: false,
};
async function asUser(id: string | null, role = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    id ?? "",
  ]);
  await db.exec(`set role ${role === "anon" ? "anon" : "authenticated"}`);
}
async function sql<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
) {
  return (await db.query<T>(text, params)).rows;
}
async function save(
  program: unknown = payload,
  revision: number | null = null,
) {
  return (
    await sql<{
      program: { id: string; revision: number; is_published: boolean };
    }>("select public.owner_save_program($1::jsonb,$2::integer) as program", [
      JSON.stringify(program),
      revision,
    ])
  )[0].program;
}
async function overview() {
  return (
    await sql<{ data: Record<string, unknown> }>(
      "select public.owner_overview() as data",
    )
  )[0].data;
}
async function catalogue(query = "", state = "all", page = 0) {
  return (
    await sql<{
      data: { items: { id: string }[]; total: number; page: number };
    }>("select public.owner_programs($1,$2,$3) as data", [query, state, page])
  )[0].data;
}

beforeAll(async () => {
  db = await PGlite.create();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz,is_anonymous boolean default false,banned_until timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    create table public.programs(id uuid primary key default gen_random_uuid(),university_name text not null,course_name text not null,level text,language text,created_at timestamptz default now(),unique(university_name,course_name));
    alter table public.programs enable row level security;
    create policy "Programs are readable" on public.programs for select using(true);
    grant all on public.programs to anon,authenticated;
    create table public.shortlists(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users,university_name text,course_name text);
    create table public.account_data(user_id uuid references auth.users,kind text,data jsonb);
    alter table public.shortlists enable row level security;
    alter table public.account_data enable row level security;
    grant select,insert,update,delete on public.shortlists,public.account_data to authenticated;
    create policy own_shortlists on public.shortlists for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
    create policy own_data on public.account_data for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
  `);
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/20261020130000_application_owner.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  grant = await readFile(
    new URL("../supabase/owner/grant_owner.sql", import.meta.url),
    "utf8",
  );
}, 20000);
afterAll(async () => {
  await db?.close();
});
beforeEach(async () => {
  await db.exec(
    `reset role; truncate app_private.owners,app_private.owner_audit,public.account_data,public.shortlists,auth.users cascade;`,
  );
  await db.query(
    "insert into auth.users(id,email,email_confirmed_at) values ($1,'owner@example.test',now()),($2,'student@example.test',now()),($3,'unverified@example.test',null)",
    [owner, student, other],
  );
  await db.query(
    "select set_config('app.owner_email','owner@example.test',false)",
  );
  await db.exec(grant);
  await db.exec(
    "delete from public.programs where university_name like 'Example%' or university_name like 'Paging%'",
  );
  await db.query(
    "insert into public.account_data(user_id,kind,data) values ($1,'profile','{\"private\":\"PRIVATE_OWNER_PROFILE\"}'),($2,'profile','{\"private\":\"PRIVATE_STUDENT_PROFILE\"}')",
    [owner, student],
  );
});

test("anonymous visitors cannot invoke owner functions or write catalogue data", async () => {
  await asUser(null, "anon");
  expect(
    (await sql("select count(*)::integer as count from public.programs"))[0]
      .count,
  ).toBe(9);
  await expect(sql("select public.is_app_owner()")).rejects.toMatchObject({
    code: "42501",
  });
  await expect(overview()).rejects.toMatchObject({ code: "42501" });
  await expect(save()).rejects.toMatchObject({ code: "42501" });
  await expect(
    sql(
      "insert into public.programs(university_name,course_name) values('attack','attack')",
    ),
  ).rejects.toMatchObject({ code: "42501" });
});
test("ordinary users cannot escalate via client metadata, private tables, or direct writes", async () => {
  await db.query(
    'update auth.users set raw_user_meta_data=\'{"role":"owner","admin":true}\' where id=$1',
    [student],
  );
  await asUser(student);
  expect((await sql("select public.is_app_owner() as owner"))[0].owner).toBe(
    false,
  );
  await expect(overview()).rejects.toMatchObject({ code: "42501" });
  await expect(catalogue()).rejects.toMatchObject({ code: "42501" });
  await expect(save()).rejects.toMatchObject({ code: "42501" });
  await expect(
    sql("insert into app_private.owners(user_id) values(auth.uid())"),
  ).rejects.toMatchObject({ code: "42501" });
  await expect(sql("delete from public.programs")).rejects.toMatchObject({
    code: "42501",
  });
});
test("owner can manage drafts, publication, and catalogue export pages while students cannot see drafts", async () => {
  await asUser(owner);
  const draft = await save();
  expect(draft.revision).toBe(1);
  expect(draft.is_published).toBe(false);
  expect((await catalogue("Example", "archived")).total).toBe(1);
  await asUser(student);
  expect(
    (
      await sql(
        "select count(*)::integer as count from public.programs where id=$1",
        [draft.id],
      )
    )[0].count,
  ).toBe(0);
  await asUser(owner);
  const published = await save(
    { ...payload, id: draft.id, is_published: true },
    draft.revision,
  );
  expect(published.revision).toBe(2);
  await asUser(null, "anon");
  expect(
    (
      await sql(
        "select count(*)::integer as count from public.programs where id=$1",
        [draft.id],
      )
    )[0].count,
  ).toBe(1);
  await asUser(owner);
  await save({ ...payload, id: draft.id }, published.revision);
  const counts = await overview();
  expect(counts.published).toBe(9);
  expect(counts.programs).toBe(10);
});
test("owner totals do not expose private profiles and owner role does not bypass personal-data policies", async () => {
  await asUser(owner);
  const data = await overview();
  expect(data.accounts).toBe(3);
  expect(JSON.stringify(data)).not.toContain("PRIVATE_");
  expect(JSON.stringify(data)).not.toContain("student@example.test");
  expect(
    (
      await sql(
        "select count(*)::integer as count from public.account_data where user_id=$1",
        [student],
      )
    )[0].count,
  ).toBe(0);
  expect(
    (await sql("select count(*)::integer as count from public.account_data"))[0]
      .count,
  ).toBe(1);
});
test("stale edits, unexpected keys, malformed fields and invalid filters are rejected atomically", async () => {
  await asUser(owner);
  const draft = await save();
  await save(
    { ...payload, id: draft.id, course_name: "M.Sc. Updated" },
    draft.revision,
  );
  await expect(
    save({ ...payload, id: draft.id }, draft.revision),
  ).rejects.toMatchObject({ code: "40001" });
  await expect(save({ ...payload, user_id: student })).rejects.toMatchObject({
    code: "22023",
  });
  await expect(save({ ...payload, course_name: 5 })).rejects.toMatchObject({
    code: "22023",
  });
  await expect(save({ ...payload, level: "invalid" })).rejects.toMatchObject({
    code: "22023",
  });
  await expect(save([])).rejects.toMatchObject({ code: "22023" });
  await expect(catalogue("", "all", -1)).rejects.toMatchObject({
    code: "22023",
  });
  expect((await catalogue("Updated")).total).toBe(1);
  expect((await catalogue("' OR 1=1;--")).total).toBe(0);
});
test("catalogue changes leave saved applications intact and audit history cannot be edited through the API", async () => {
  await db.query(
    "insert into public.shortlists(user_id,university_name,course_name) values($1,$2,$3)",
    [student, payload.university_name, payload.course_name],
  );
  await asUser(owner);
  const draft = await save({ ...payload, is_published: true });
  await save({ ...payload, id: draft.id }, draft.revision);
  await expect(
    sql("delete from app_private.owner_audit"),
  ).rejects.toMatchObject({ code: "42501" });
  const data = await overview();
  expect(JSON.stringify(data.activity)).toContain("program.archived");
  await asUser(student);
  expect(
    (await sql("select count(*)::integer as count from public.shortlists"))[0]
      .count,
  ).toBe(1);
});
test("role revocation and an unverified or banned owner take effect without waiting for a new token", async () => {
  await db.query(
    "update auth.users set banned_until=now()+interval '1 day' where id=$1",
    [owner],
  );
  await asUser(owner);
  expect((await sql("select public.is_app_owner() as owner"))[0].owner).toBe(
    false,
  );
  await expect(save()).rejects.toMatchObject({ code: "42501" });
  await db.exec("reset role");
  await db.query(
    "update auth.users set banned_until=null,email_confirmed_at=null where id=$1",
    [owner],
  );
  await asUser(owner);
  await expect(overview()).rejects.toMatchObject({ code: "42501" });
  await db.exec("reset role");
  await db.query("update auth.users set email_confirmed_at=now() where id=$1", [
    owner,
  ]);
  await db.exec("delete from app_private.owners");
  await asUser(owner);
  await expect(overview()).rejects.toMatchObject({ code: "42501" });
});
test("provisioning is idempotent, rejects unverified addresses, and refuses to replace another owner", async () => {
  await db.exec(grant);
  expect(
    (
      await sql(
        "select count(*)::integer as count from app_private.owner_audit where action='owner.granted'",
      )
    )[0].count,
  ).toBe(1);
  await db.query(
    "select set_config('app.owner_email','unverified@example.test',false)",
  );
  await expect(db.exec(grant)).rejects.toThrow(/verified, active account/);
  await db.exec("rollback");
  await db.query(
    "select set_config('app.owner_email','student@example.test',false)",
  );
  await expect(db.exec(grant)).rejects.toThrow(/Another owner already exists/);
  await db.exec("rollback");
  expect((await sql("select user_id from app_private.owners"))[0].user_id).toBe(
    owner,
  );
});
test("owner catalogue pagination returns all records across pages", async () => {
  await db.exec(
    "insert into public.programs(university_name,course_name,level,language) select 'Paging University', 'Course '||n, 'master','English' from generate_series(1,31) n",
  );
  await asUser(owner);
  const first = await catalogue("Paging");
  const second = await catalogue("Paging", "all", 1);
  expect(first.total).toBe(31);
  expect(first.items).toHaveLength(25);
  expect(second.items).toHaveLength(6);
  expect(new Set([...first.items, ...second.items].map((p) => p.id)).size).toBe(
    31,
  );
});
