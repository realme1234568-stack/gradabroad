// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth: { getUser: mocks.getUser }, rpc: mocks.rpc }) }));
import { GET, POST } from "@/app/api/legal/acceptance/route";
const valid = { version: "2026-10-21", terms: true, privacy: true, stage: "prelogin" };
function req(body: unknown = valid, headers: Record<string,string> = {}) {
  return new NextRequest("https://gradabroad.test/api/legal/acceptance", { method: "POST", headers: { origin: "https://gradabroad.test", "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
}
beforeEach(() => { vi.resetAllMocks(); mocks.getUser.mockResolvedValue({data:{user:{id:"account-a"}},error:null}); mocks.rpc.mockResolvedValue({data:true,error:null}); });
test("prelogin records only a short-lived HttpOnly intent, not another account's acceptance", async () => {
  const response = await POST(req());
  expect(response.status).toBe(200);
  expect(response.cookies.get("ga_legal_pending")).toMatchObject({ value:"2026-10-21",path:"/auth/callback",maxAge:900,httpOnly:true,secure:true,sameSite:"lax" });
  expect(mocks.getUser).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  expect(response.headers.get("cache-control")).toContain("no-store");
});
test("rejects cross-origin, missing origin, stale versions, unchecked boxes and oversized payloads", async () => {
  expect((await POST(req(valid,{origin:"https://evil.test"}))).status).toBe(403);
  const missing=req(); missing.headers.delete("origin");
  expect((await POST(missing)).status).toBe(403);
  for(const body of [{...valid,terms:false},{...valid,privacy:false},{...valid,version:"old"},{...valid,stage:"admin"}]) expect((await POST(req(body))).status).toBe(400);
  expect((await POST(req({...valid,extra:"x".repeat(1100)}))).status).toBe(413);
  expect(mocks.rpc).not.toHaveBeenCalled();
});
test("authenticated acceptance is scoped to the verified account and reports persistence failures", async () => {
  const body={...valid,stage:"onboarding"};
  expect((await POST(req(body,{"x-legal-account":"account-b"}))).status).toBe(409);
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect((await POST(req(body,{"x-legal-account":"account-a"}))).status).toBe(200);
  expect(mocks.rpc).toHaveBeenCalledWith("accept_legal",{p_version:"2026-10-21",p_source:"onboarding"});
  mocks.rpc.mockResolvedValue({data:null,error:new Error("DB failed")});
  expect((await POST(req(body,{"x-legal-account":"account-a"}))).status).toBe(503);
});
test("receipt checks distinguish missing session, missing receipt and database outage", async () => {
  const request=()=>new NextRequest("https://gradabroad.test/api/legal/acceptance");
  mocks.getUser.mockResolvedValue({data:{user:null},error:null});
  expect((await GET(request())).status).toBe(401);
  mocks.getUser.mockResolvedValue({data:{user:{id:"a"}},error:null});
  mocks.rpc.mockResolvedValue({data:false,error:null});
  expect(await (await GET(request())).json()).toMatchObject({accepted:false,account:"a"});
  mocks.rpc.mockResolvedValue({data:null,error:new Error("DB failed")});
  expect((await GET(request())).status).toBe(503);
});
