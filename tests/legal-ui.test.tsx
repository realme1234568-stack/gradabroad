import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
const auth=vi.hoisted(()=>({getUser:vi.fn(),signInWithOAuth:vi.fn(),signInWithOtp:vi.fn(),signOut:vi.fn(), listener:null as null | ((event:string)=>void)}));
vi.mock("@/lib/supabaseClient",()=>({supabase:{auth:{...auth,onAuthStateChange:(listener:(event:string)=>void)=>{auth.listener=listener;return {data:{subscription:{unsubscribe(){}}}};}}}}));
import LegalConsentProvider from "@/components/LegalConsentProvider";
import AuthPanel from "@/components/AuthPanel";
import LegalAcceptanceScreen from "@/components/LegalAcceptanceScreen";
import LegalConsentDialog from "@/components/LegalConsentDialog";
import { LEGAL_BROWSER_HINT, LEGAL_VERSION } from "@/lib/legal";
const fetchMock=vi.fn();
beforeEach(()=>{
  vi.resetAllMocks();
  const stored = new Map<string,string>();
  vi.stubGlobal("localStorage", {getItem:(key:string)=>stored.get(key)??null,setItem:(key:string,value:string)=>stored.set(key,value),removeItem:(key:string)=>stored.delete(key)});
  auth.getUser.mockResolvedValue({data:{user:null}}); auth.signInWithOAuth.mockResolvedValue({error:null});
  vi.stubGlobal("fetch",fetchMock);
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute("open","");};
  HTMLDialogElement.prototype.close=function(){this.removeAttribute("open");};
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
function start(){render(<LegalConsentProvider><AuthPanel nextPath="/dashboard"/></LegalConsentProvider>);fireEvent.click(screen.getByRole("button",{name:"Continue with Google"}));}
function checkBoth(){fireEvent.click(screen.getByLabelText(/I accept the/));fireEvent.click(screen.getByLabelText(/I acknowledge the/));}
test("Google sign-in waits for both unchecked acknowledgements and successful prelogin persistence",async()=>{
  fetchMock.mockResolvedValue({ok:true}); start();
  const button=await screen.findByRole("button",{name:"I accept and continue"}) as HTMLButtonElement;
  expect(button.disabled).toBe(true);expect(auth.signInWithOAuth).not.toHaveBeenCalled();
  fireEvent.click(screen.getByLabelText(/I accept the/));expect(button.disabled).toBe(true);
  fireEvent.click(screen.getByLabelText(/I acknowledge the/));fireEvent.click(button);
  await waitFor(()=>expect(auth.signInWithOAuth).toHaveBeenCalledTimes(1));
  expect(fetchMock).toHaveBeenCalledWith("/api/legal/acceptance",expect.objectContaining({method:"POST"}));
  expect(localStorage.getItem(LEGAL_BROWSER_HINT)).toBe(LEGAL_VERSION);
});
test("cancellation never starts Google, and acceptance failures remain visible without storing a hint",async()=>{
  fetchMock.mockResolvedValue({ok:false});start();
  fireEvent.click(await screen.findByRole("button",{name:"Not now"}));
  expect(auth.signInWithOAuth).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button",{name:"Continue with Google"}));
  await screen.findByRole("button",{name:"I accept and continue"});checkBoth();fireEvent.click(screen.getByRole("button",{name:"I accept and continue"}));
  expect((await screen.findByRole("alert")).textContent).toContain("Could not prepare");
  expect(auth.signInWithOAuth).not.toHaveBeenCalled();expect(localStorage.getItem(LEGAL_BROWSER_HINT)).toBeNull();
});
test("a browser hint skips the introductory popup, while server callback owns account verification",async()=>{
  localStorage.setItem(LEGAL_BROWSER_HINT,LEGAL_VERSION);start();
  await waitFor(()=>expect(auth.signInWithOAuth).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole("dialog")).toBeNull();
});
test("full policy text is available without a scroll trap or marketing consent",()=>{
  render(<LegalConsentDialog onAccept={async()=>{}} onCancel={()=>{}}/>);
  expect(screen.getByRole("region",{name:"Terms & Conditions text"})).toBeTruthy();
  fireEvent.click(screen.getByRole("button",{name:"Privacy Policy"}));
  expect(screen.getByRole("region",{name:"Privacy Policy text"}).textContent).toContain("gradabroad.online@gmail.com");
  expect(screen.getAllByRole("checkbox")).toHaveLength(2);
});


test("account changes discard stale acceptance responses and reset both checkboxes", async()=>{
  let finishSave!: (value:unknown)=>void;
  fetchMock.mockResolvedValueOnce({ok:true,status:200,json:async()=>({accepted:false,account:"account-a"})})
    .mockImplementationOnce(()=>new Promise(resolve=>{finishSave=resolve;}))
    .mockResolvedValueOnce({ok:true,status:200,json:async()=>({accepted:false,account:"account-b"})});
  render(<LegalAcceptanceScreen nextPath="/dashboard"/>);
  await screen.findByRole("button",{name:"I accept and continue"});checkBoth();
  fireEvent.click(screen.getByRole("button",{name:"I accept and continue"}));
  await waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(fetchMock.mock.calls[1][1].headers["X-Legal-Account"]).toBe("account-a");
  auth.listener!("SIGNED_IN");
  finishSave({ok:true,status:200,json:async()=>({accepted:true,account:"account-a"})});
  await waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(3));
  const button=await screen.findByRole("button",{name:"I accept and continue"}) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  expect((screen.getByLabelText(/I accept the/) as HTMLInputElement).checked).toBe(false);
  expect((screen.getByLabelText(/I acknowledge the/) as HTMLInputElement).checked).toBe(false);
});
