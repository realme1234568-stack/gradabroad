import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
const m=vi.hoisted(()=>({getUser:vi.fn(),subscribe:vi.fn(),fetch:vi.fn()}));
vi.mock("@/lib/supabaseClient",()=>({supabase:{auth:{getUser:m.getUser,onAuthStateChange:m.subscribe}}}));
import DocumentsLibrary from "@/components/DocumentsLibrary";
let authChange: (_event:string,session:{user:{id:string}}|null)=>void;
const document={id:"doc",original_name:"passport.pdf",category:"Passport",mime_type:"application/pdf",size_bytes:2048,created_at:"2026-10-21T00:00:00Z",state:"ready"};
class Upload {
  static last:Upload;
  headers:Record<string,string>={};
  upload:{onprogress?: (event:unknown)=>void}={};
  responseText="";status=0;timeout=0;
  onload?:()=>void;onerror?:()=>void;ontimeout?:()=>void;onabort?:()=>void;
  constructor(){Upload.last=this;}
  open(){} setRequestHeader(key:string,value:string){this.headers[key]=value;}
  send(){} abort(){this.onabort?.();}
}
beforeEach(()=>{
  vi.clearAllMocks();
  m.getUser.mockResolvedValue({data:{user:{id:"alice"}},error:null});
  m.subscribe.mockImplementation(callback=>{authChange=callback;return{data:{subscription:{unsubscribe:vi.fn()}}};});
  m.fetch.mockResolvedValue(new Response(JSON.stringify({documents:[document]}),{status:200}));
  vi.stubGlobal("fetch",m.fetch);vi.stubGlobal("XMLHttpRequest",Upload);
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute("open","");};
  HTMLDialogElement.prototype.close=function(){this.removeAttribute("open");};
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
test("shows the private library with an owner-bound request and a filtered category view",async()=>{
  render(<DocumentsLibrary/>);
  await screen.findByText("passport.pdf");
  expect(m.fetch).toHaveBeenCalledWith("/api/documents",expect.objectContaining({cache:"no-store",headers:{"X-Document-Account":"alice"}}));
  fireEvent.change(screen.getByLabelText("Filter by category"),{target:{value:"Visa"}});
  expect(screen.queryByText("passport.pdf")).toBeNull();
  expect(screen.getByText("No documents in this category.")).toBeTruthy();
});
test("delete confirmation and failed deletion preserve the file",async()=>{
  render(<DocumentsLibrary/>);await screen.findByText("passport.pdf");
  fireEvent.click(screen.getByRole("button",{name:"Delete passport.pdf"}));
  const dialog=screen.getByRole("dialog");
  expect(m.fetch).toHaveBeenCalledTimes(1);
  m.fetch.mockResolvedValueOnce(new Response(JSON.stringify({error:"Could not delete the file. Please retry."}),{status:503}));
  fireEvent.click(within(dialog).getByRole("button",{name:"Delete document"}));
  await within(dialog).findByRole("alert");
  expect(screen.getAllByText("passport.pdf")).toHaveLength(2);
  expect(screen.queryByText("Your document has been deleted from your library.")).toBeNull();
  m.fetch.mockResolvedValueOnce(new Response(JSON.stringify({deleted:true}),{status:200}));
  fireEvent.click(within(dialog).getByRole("button",{name:"Delete document"}));
  await screen.findByText("Your document has been deleted from your library.");
  expect(screen.queryByText("passport.pdf")).toBeNull();
});
test("upload reports success only after server confirmation",async()=>{
  render(<DocumentsLibrary/>);await screen.findByText("passport.pdf");
  fireEvent.change(screen.getByLabelText("Choose document file"),{target:{files:[new File(["pdf"],"transcript.pdf",{type:"application/pdf"})]}});
  fireEvent.click(screen.getByRole("button",{name:"Upload document"}));
  expect(Upload.last.headers["X-Document-Account"]).toBe("alice");
  expect(screen.queryByText("Your document has been uploaded.")).toBeNull();
  await act(async()=>{Upload.last.status=201;Upload.last.responseText=JSON.stringify({document:{...document,id:"new",original_name:"transcript.pdf"}});Upload.last.onload?.();});
  await screen.findByText("Your document has been uploaded.");
  expect(screen.getByText("transcript.pdf")).toBeTruthy();
});
test("switching accounts clears private files and ignores an old in-flight response",async()=>{
  render(<DocumentsLibrary/>);await screen.findByText("passport.pdf");
  let resolve:(value:Response)=>void=()=>{};
  m.fetch.mockImplementationOnce(()=>new Promise<Response>(done=>{resolve=done;}));
  fireEvent.click(screen.getByRole("button",{name:"Refresh"}));
  act(()=>authChange("SIGNED_OUT",null));
  await act(async()=>resolve(new Response(JSON.stringify({documents:[document]}),{status:200})));
  expect(screen.queryByText("passport.pdf")).toBeNull();
  expect(screen.getByRole("link",{name:/Sign in/})).toBeTruthy();
});
test("a failed library load shows an error instead of an empty-account success state",async()=>{
  m.fetch.mockResolvedValueOnce(new Response(JSON.stringify({error:"Documents unavailable. Please retry."}),{status:503}));
  render(<DocumentsLibrary/>);await screen.findByRole("alert");
  expect(screen.queryByText("A fresh start for your files.")).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:"Refresh"}));
  await waitFor(()=>expect(screen.getByText("passport.pdf")).toBeTruthy());
});
