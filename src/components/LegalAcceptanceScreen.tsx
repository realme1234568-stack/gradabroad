"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { LEGAL_BROWSER_HINT, LEGAL_VERSION } from "@/lib/legal";
import AuthPanel from "./AuthPanel";
import LegalConsentDialog from "./LegalConsentDialog";
import styles from "@/app/legal/legal.module.css";

export default function LegalAcceptanceScreen({ nextPath }: { nextPath: string }) {
  const [account, setAccount] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef(0);
  const load = useCallback(async () => {
    const current = ++sequence.current;
    setAccount(null); setError(null); setSignedOut(false);
    try {
      const response = await fetch("/api/legal/acceptance", { cache: "no-store" });
      if (current !== sequence.current) return;
      if (response.status === 401) { setSignedOut(true); return; }
      const result = await response.json();
      if (!response.ok || typeof result.account !== "string") throw new Error("Could not check your agreement. Please retry.");
      if (result.accepted === true) { window.location.replace(nextPath); return; }
      setAccount(result.account);
    } catch { if (current === sequence.current) setError("Could not check your agreement. Please retry."); }
  }, [nextPath]);
  useEffect(() => {
    // Defer work outside Supabase's auth callback and invalidate stale account responses.
    let timer: ReturnType<typeof setTimeout> | undefined = setTimeout(() => void load(), 0);
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;
      sequence.current++; setAccount(null);
      clearTimeout(timer); timer = setTimeout(() => void load(), 0);
    });
    const invalidate = () => { sequence.current++; };
    return () => { invalidate(); clearTimeout(timer); data.subscription.unsubscribe(); };
  }, [load]);
  async function accept() {
    const current = sequence.current;
    const response = await fetch("/api/legal/acceptance", { method: "POST", headers: { "Content-Type": "application/json", "X-Legal-Account": account ?? "" }, body: JSON.stringify({ version: LEGAL_VERSION, terms: true, privacy: true, stage: "onboarding" }) });
    if (current !== sequence.current) return;
    if (response.status === 409 || response.status === 401) { await load(); return; }
    const result = await response.json();
    if (!response.ok || result.accepted !== true || result.account !== account) throw new Error("Could not save your agreement. Please retry.");
    try { localStorage.setItem(LEGAL_BROWSER_HINT, LEGAL_VERSION); } catch { /* Optional display preference. */ }
    window.location.replace(nextPath);
  }
  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.replace("/");
    } catch { setError("Could not sign out. Please retry."); }
  }
  return <div className={styles.screen}><p className="page-eyebrow">Welcome to GradAbroad</p><h1>Your account agreement</h1>
    <p>Review the Terms & Conditions and Privacy Policy before using your workspace. Your acceptance will be saved to your verified account.</p>
    {signedOut ? <div className="mt-8"><AuthPanel nextPath={nextPath} /></div> : account ? <LegalConsentDialog key={account} signedIn onAccept={accept} onCancel={() => void signOut()} externalError={error} /> : error ? <><p role="alert" className={styles.error}>{error}</p><button className="ga-primary mt-4 px-5 py-3" onClick={() => void load()}>Retry agreement check</button></> : <p role="status">Checking your account…</p>}
    <nav className="mt-8 flex flex-wrap gap-6 text-sm underline"><Link href="/terms">Terms & Conditions</Link><Link href="/privacy">Privacy Policy</Link><Link href="/contact">Contact us</Link><Link href="/">Browse without an account</Link></nav>
  </div>;
}
