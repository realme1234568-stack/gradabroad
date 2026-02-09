"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPanel() {
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserEmail(data.user?.email ?? null);
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
    if (!email) return;
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the login link.");
      setEmail("");
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  const handleOAuthSignIn = async (
    provider: "google" | "github" | "azure" | "linkedin" | "discord"
  ) => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
        Account
      </p>
      {userEmail ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-700 dark:text-zinc-200">
            Signed in as <span className="font-semibold">{userEmail}</span>
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="w-full rounded-full bg-[radial-gradient(circle_at_top,_#f87171,_#ef4444,_#dc2626)] px-3 py-2 text-xs font-semibold text-white shadow-md shadow-red-200/40 transition hover:scale-[1.01] disabled:opacity-60"
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
              className="w-full rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:bg-black/60 dark:text-white dark:hover:bg-white/10"
            >
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuthSignIn("github")}
              disabled={loading}
              className="w-full rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:bg-black/60 dark:text-white dark:hover:bg-white/10"
            >
              Continue with GitHub
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              or
            </span>
            <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          </div>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:border-white/10 dark:bg-black/60 dark:text-white"
          />
          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading || !email}
            className="w-full rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#22d3ee,_#0ea5e9)] px-3 py-2 text-xs font-semibold text-zinc-900 shadow-md shadow-emerald-200/40 transition hover:scale-[1.01] disabled:opacity-60"
          >
            Send magic link
          </button>
          {message ? (
            <p className="text-xs text-zinc-600 dark:text-zinc-300">{message}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
