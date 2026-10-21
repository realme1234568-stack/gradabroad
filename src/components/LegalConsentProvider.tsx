"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import LegalConsentDialog from "./LegalConsentDialog";
import { LEGAL_BROWSER_HINT, LEGAL_VERSION } from "@/lib/legal";

const Context = createContext<() => Promise<boolean>>(async () => false);
export const useLegalConsent = () => useContext(Context);

export default function LegalConsentProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const resolver = useRef<((accepted: boolean) => void) | null>(null);
  const request = useCallback(() => {
    // This is only a display preference; the verified-account DB record is authoritative.
    try { if (localStorage.getItem(LEGAL_BROWSER_HINT) === LEGAL_VERSION) return Promise.resolve(true); } catch { /* Storage is optional. */ }
    if (resolver.current) return Promise.resolve(false);
    return new Promise<boolean>(resolve => { resolver.current = resolve; setOpen(true); });
  }, []);
  const finish = (accepted: boolean) => { resolver.current?.(accepted); resolver.current = null; setOpen(false); };
  useEffect(() => () => { resolver.current?.(false); resolver.current = null; }, []);
  async function accept() {
    const response = await fetch("/api/legal/acceptance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: LEGAL_VERSION, terms: true, privacy: true, stage: "prelogin" }) });
    if (!response.ok) throw new Error("Could not prepare your acknowledgement. Please retry before signing in.");
    try { localStorage.setItem(LEGAL_BROWSER_HINT, LEGAL_VERSION); } catch { /* DB receipt is saved after authentication. */ }
    finish(true);
  }
  return <Context.Provider value={request}>{children}{open && createPortal(<LegalConsentDialog onAccept={accept} onCancel={() => finish(false)} />, document.body)}</Context.Provider>;
}
