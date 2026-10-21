// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { PDFDocument } from "pdf-lib";
const m = vi.hoisted(() => ({ createServer:vi.fn(), createWriter:vi.fn(), getUser:vi.fn(), rpc:vi.fn(), download:vi.fn(), upload:vi.fn(), remove:vi.fn(), reader:vi.fn(), writer:vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/ssr", () => ({createServerClient:m.createServer}));
vi.mock("@supabase/supabase-js", () => ({createClient:m.createWriter}));
import { GET as list, POST } from "@/app/api/documents/route";
import { GET as download, DELETE } from "@/app/api/documents/[id]/route";
const owner = "00000000-0000-4000-8000-000000000001";
const id = "00000000-0000-4000-8000-000000000003";
const row = {id,object_path:`${owner}/${id}.pdf`,original_name:"passport.pdf",mime_type:"application/pdf",state:"ready",created_at:"2026-10-01T00:00:00Z"};
let readResult: {data:unknown;error:unknown};
let writeResult: {data:unknown;error:unknown};
function builder(write = false) {
  const result = {select:vi.fn(),eq:vi.fn(),order:vi.fn(),limit:vi.fn(),maybeSingle:vi.fn(),single:vi.fn(),update:vi.fn(),delete:vi.fn(),then:vi.fn()};
  for(const method of ["select","eq","order","update","delete"] as const) result[method].mockReturnValue(result);
  result.limit.mockImplementation(async()=>readResult);
  result.maybeSingle.mockImplementation(async()=>readResult);
  result.single.mockImplementation(async()=>writeResult);
  result.then.mockImplementation((resolve: (value:unknown)=>unknown)=>Promise.resolve(write ? writeResult : readResult).then(resolve));
  return result;
}
let reader:ReturnType<typeof builder>;
let writer:ReturnType<typeof builder>;
beforeEach(()=>{
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL","https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY","public-test-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY","server-test-key");
  readResult={data:row,error:null}; writeResult={data:row,error:null};
  reader=builder();writer=builder(true);
  m.getUser.mockResolvedValue({data:{user:{id:owner,email_confirmed_at:"2026-10-01",is_anonymous:false}},error:null});
  m.createServer.mockImplementation((_url,_key,options)=>{
    options.cookies.setAll([{name:"session",value:"refreshed",options:{path:"/",httpOnly:true}}]);
    return {auth:{getUser:m.getUser},from:m.reader,storage:{from:()=>({download:m.download})}};
  });
  m.reader.mockReturnValue(reader);
  m.writer.mockReturnValue(writer);
  m.createWriter.mockReturnValue({rpc:m.rpc,from:m.writer,storage:{from:()=>({upload:m.upload,remove:m.remove})}});
  m.rpc.mockResolvedValue({error:null});m.upload.mockResolvedValue({error:null});m.remove.mockResolvedValue({error:null});
  m.download.mockResolvedValue({data:new Blob(["private bytes"]),error:null});
});
const req=(method="GET",body?:Uint8Array,headers:Record<string,string>={})=>new NextRequest(`https://gradabroad.test/api/documents/${id}`,{method,body:body as BodyInit,headers:{origin:"https://gradabroad.test","x-document-account":owner,...headers}});
const params={params:Promise.resolve({id})};
test("unauthenticated and unverified callers fail before database or storage access",async()=>{
  m.getUser.mockResolvedValue({data:{user:null},error:null});
  expect((await list(req())).status).toBe(401);expect(m.reader).not.toHaveBeenCalled();
  m.getUser.mockResolvedValue({data:{user:{id:owner}},error:null});
  expect((await list(req())).status).toBe(403);
});
test("rejects cross-origin mutations and account-switch races",async()=>{
  expect((await DELETE(req("DELETE",undefined,{origin:"https://evil.test"}),params)).status).toBe(403);
  expect((await list(req("GET",undefined,{"sec-fetch-site":"cross-site"}))).status).toBe(403);
  expect((await POST(req("POST",undefined,{"x-document-account":"other"}))).status).toBe(409);
  expect(m.createWriter).not.toHaveBeenCalled();
});
test("same-origin checks use the public Host rather than an internal Next hostname",async()=>{
  writeResult.data=[{id}];
  const request=new NextRequest(`https://internal-next-host/api/documents/${id}`,{method:"DELETE",headers:{host:"gradabroad.test",origin:"https://gradabroad.test","x-document-account":owner}});
  expect((await DELETE(request,params)).status).toBe(200);
  const foreign=new NextRequest(`https://internal-next-host/api/documents/${id}`,{method:"DELETE",headers:{host:"gradabroad.test",origin:"https://evil.test","x-forwarded-host":"evil.test","x-document-account":owner}});
  expect((await DELETE(foreign,params)).status).toBe(403);
});
test("downloads are account-filtered, authenticated, attachment-only, and never cached",async()=>{
  const result=await download(req(),params);
  expect(result.status).toBe(200);expect(await result.text()).toBe("private bytes");
  expect(reader.eq).toHaveBeenCalledWith("user_id",owner);
  expect(m.download).toHaveBeenCalledWith(row.object_path);expect(m.createWriter).not.toHaveBeenCalled();
  expect(result.headers.get("content-disposition")).toContain("attachment;");
  expect(result.headers.get("cache-control")).toContain("no-store");
  expect(result.headers.get("x-content-type-options")).toBe("nosniff");
  expect(result.headers.get("content-security-policy")).toContain("sandbox");
  expect(result.cookies.get("session")?.value).toBe("refreshed");
});
test("foreign or missing document IDs have the same 404 without storage access",async()=>{
  readResult.data=null;
  expect((await download(req(),params)).status).toBe(404);
  expect((await DELETE(req("DELETE"),params)).status).toBe(404);
  expect(m.download).not.toHaveBeenCalled();expect(m.remove).not.toHaveBeenCalled();
});
test("in-flight uploads cannot be downloaded or deleted before processing finishes",async()=>{
  readResult.data={...row,state:"pending",created_at:new Date().toISOString()};
  expect((await download(req(),params)).status).toBe(409);
  expect((await DELETE(req("DELETE"),params)).status).toBe(409);
  expect(m.download).not.toHaveBeenCalled();expect(m.remove).not.toHaveBeenCalled();
});
test("delete failures retain metadata and report failure",async()=>{
  m.remove.mockResolvedValue({error:new Error("storage failed secret details")});
  const response=await DELETE(req("DELETE"),params);
  expect(response.status).toBe(503);expect(m.writer).not.toHaveBeenCalled();
  expect(await response.text()).not.toContain("secret details");
});
test("successful deletion removes bytes before owner-filtered metadata",async()=>{
  writeResult.data=[{id}];
  const response=await DELETE(req("DELETE"),params);
  expect(response.status).toBe(200);expect(await response.json()).toEqual({deleted:true});
  expect(writer.eq).toHaveBeenCalledWith("user_id",owner);
  expect(m.remove.mock.invocationCallOrder[0]).toBeLessThan(m.writer.mock.invocationCallOrder[0]);
});
test("uploads fail closed when server credentials are missing",async()=>{
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY","");
  expect((await POST(req("POST"))).status).toBe(503);expect(m.upload).not.toHaveBeenCalled();
});
test("spoofed file contents never reach storage",async()=>{
  const response=await POST(req("POST",new TextEncoder().encode("<html>bad</html>"),{"x-document-name":"passport.pdf","x-document-category":"Passport"}));
  expect(response.status).toBe(400);expect(m.upload).not.toHaveBeenCalled();
});
test("valid upload reserves quota, uploads to a generated owner path, then confirms ready",async()=>{
  const pdf=await PDFDocument.create();pdf.addPage();
  const response=await POST(req("POST",await pdf.save(),{"x-document-name":"passport.pdf","x-document-category":"Passport"}));
  expect(response.status).toBe(201);
  const reservation=m.rpc.mock.calls.find(call=>call[0]==="reserve_student_document")![1];
  expect(reservation.p_user_id).toBe(owner);expect(reservation.p_path).toMatch(new RegExp(`^${owner}/[0-9a-f-]+\\.pdf$`));
  expect(reservation.p_path).not.toContain("passport");expect(m.upload.mock.calls[0][2].upsert).toBe(false);
  expect(writer.update).toHaveBeenCalledWith({state:"ready"});
});
test("failed storage cleanup keeps pending metadata for a retry instead of hiding an orphan",async()=>{
  const pdf=await PDFDocument.create();pdf.addPage();
  m.upload.mockResolvedValue({error:new Error("failed")});m.remove.mockResolvedValue({error:new Error("failed cleanup")});
  expect((await POST(req("POST",await pdf.save(),{"x-document-name":"passport.pdf","x-document-category":"Passport"}))).status).toBe(503);
  expect(writer.delete).not.toHaveBeenCalled();
});
