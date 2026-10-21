"use client";
import { useEffect, useRef, useState } from "react";
import LegalPolicy from "./LegalPolicy";
import { LEGAL_VERSION } from "@/lib/legal";
import styles from "@/app/legal/legal.module.css";

export default function LegalConsentDialog({ onAccept, onCancel, signedIn = false, externalError }: {
  onAccept: () => Promise<void>; onCancel: () => void; signedIn?: boolean; externalError?: string | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const busy = useRef(false);
  const [tab, setTab] = useState<"terms" | "privacy">("terms");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const current = dialog.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    current?.showModal(); title.current?.focus();
    return () => { current?.close(); if (previous?.isConnected) previous.focus(); };
  }, []);
  async function accept() {
    if (!termsAccepted || !privacyAcknowledged || busy.current) return;
    busy.current = true; setSaving(true); setError(null);
    try { await onAccept(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save your acceptance. Please retry."); }
    finally { busy.current = false; setSaving(false); }
  }
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="legal-consent-title" aria-describedby="legal-consent-summary"
    onCancel={e => { e.preventDefault(); if (!busy.current) onCancel(); }}>
    <header className={styles.header}><span className={styles.badge}>Before your first sign-in · {LEGAL_VERSION}</span>
      <h2 id="legal-consent-title" ref={title} tabIndex={-1}>A clear agreement. Your choice.</h2>
      <p id="legal-consent-summary">GradAbroad helps you plan your studies in Germany. Programme details, deadlines, costs and planning groups are preliminary guidance: verify them with DAAD, the university and relevant authorities. We cannot guarantee admission, a visa or an error-free service. Your profile and optional uploads are stored with our service providers to operate your private workspace; no online storage can promise absolute security. Please read both documents below before continuing. Your legal and privacy rights remain protected.</p>
    </header>
    <div className={styles.tabs} role="group" aria-label="Read our policies">
      <button type="button" aria-pressed={tab === "terms"} onClick={() => setTab("terms")}>Terms & Conditions</button>
      <button type="button" aria-pressed={tab === "privacy"} onClick={() => setTab("privacy")}>Privacy Policy</button>
    </div>
    <div className={styles.reading} tabIndex={0} role="region" aria-label={tab === "terms" ? "Terms & Conditions text" : "Privacy Policy text"} key={tab}>
      <LegalPolicy kind={tab} embedded />
    </div>
    <div className={styles.footer}>
      <label className={styles.check}><input type="checkbox" checked={termsAccepted} disabled={saving} onChange={e => setTermsAccepted(e.target.checked)} /><span>I accept the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</a>.</span></label>
      <label className={styles.check}><input type="checkbox" checked={privacyAcknowledged} disabled={saving} onChange={e => setPrivacyAcknowledged(e.target.checked)} /><span>I acknowledge the <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and understand how GradAbroad handles my information.</span></label>
      {(error || externalError) && <p role="alert" className={styles.error}>{error || externalError}</p>}
      <div className={styles.actions}><button type="button" onClick={onCancel} disabled={saving}>{signedIn ? "Sign out instead" : "Not now"}</button>
        <button type="button" className="ga-primary" disabled={!termsAccepted || !privacyAcknowledged || saving} onClick={() => void accept()}>{saving ? "Saving…" : "I accept and continue"}</button></div>
      <p className={styles.note}>No pre-selected boxes. No marketing permission. Acceptance is linked to your verified account after sign-in. Public programme browsing remains available without an account.</p>
    </div>
  </dialog>;
}
