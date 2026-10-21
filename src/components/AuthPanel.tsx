"use client";

import { useLegalConsent } from "./LegalConsentProvider";
import { signInDestination } from "@/lib/signInDestination";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPanel({ nextPath = "/" }: { nextPath?: string }) {
  const requestConsent = useLegalConsent();
  const destination = signInDestination(nextPath);
  const callbackPath = destination === "/" ? "/auth/callback" : `/auth/callback?next=${encodeURIComponent(destination)}`;
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserEmail(data.user?.email ?? null);
    }).catch(() => {
      if (mounted) setMessage("Could not check your session. Please try signing in again.");
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserEmail(session?.user?.email ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    if (!email || loading) return;
    if (!await requestConsent()) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}${callbackPath}` },
      });
      if (error) {
        setMessage("Could not send the sign-in link. Check your email address and try again.");
      } else {
        setMessage("Check your email for the login link. Open it in this browser.");
        setEmail("");
      }
    } catch {
      setMessage("Could not reach the sign-in service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) setMessage("Could not sign out. Please try again.");
      else setUserEmail(null);
    } catch {
      setMessage("Could not sign out. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    if (loading || !await requestConsent()) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}${callbackPath}` },
      });
      if (error) setMessage("Could not start sign-in with this provider. Try another sign-in method.");
    } catch {
      setMessage("Could not reach the sign-in service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        Account
      </p>
      {userEmail ? (
        <div className="space-y-2">
          <p className="text-xs text-ink">
            Signed in as <span className="font-semibold">{userEmail}</span>
          </p>
          {destination !== "/" && <Link href={destination} className="block underline">Continue</Link>}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="w-full rounded-full ga-danger px-3 py-2 text-xs font-semibold text-ink shadow-sm transition hover:scale-[1.01] disabled:opacity-60"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              disabled={loading}
              className="w-full rounded-full border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-surface disabled:opacity-60"
            >
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuthSignIn("github")}
              disabled={loading}
              className="w-full rounded-full border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-surface disabled:opacity-60"
            >
              Continue with GitHub
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-surface" />
            <span className="text-[12px] uppercase tracking-[0.2em] text-muted">
              or
            </span>
            <div className="h-px flex-1 bg-surface" />
          </div>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-ink"
          />
          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading || !email}
            className="w-full rounded-full ga-primary px-3 py-2 text-xs font-semibold text-ink shadow-sm transition hover:scale-[1.01] disabled:opacity-60"
          >
            Send magic link
          </button>
        </div>
      )}
      {message && <p role="status" className="text-xs text-muted">{message}</p>}
    </div>
  );
}
