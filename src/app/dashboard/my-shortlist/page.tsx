"use client";
import { useNotifications } from "@/components/NotificationProvider";
import React, { useEffect, useRef, useState } from "react";
import { getProgramLevel } from "@/lib/programLevel";
import { supabase } from "@/lib/supabaseClient";

type ShortlistItem = {
  id: string;
  university_name: string;
  course_name: string;
  deadline: string;
  status: string;
  program_level?: string | null; // 'bachelor' | 'master' | undefined
};

export default function MyShortlistPage() {
  const { notify } = useNotifications();
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [removing, setRemoving] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const removalBusy = useRef(false);

  useEffect(() => {
    const fetchShortlist = async () => {
      setLoading(true);
      setLoadError(null);
      try {
      const { data, error: queryError } = await supabase
        .from("shortlists")
        .select("id, university_name, course_name, deadline, status, program_level")
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      setShortlist(data ?? []);
      } catch {
        setLoadError("Could not load your shortlist. Please retry.");
      } finally {
        setLoading(false);
      }
    };
    fetchShortlist();
  }, [loadAttempt]);

  const handleRemoveShortlist = async (id: string) => {
    if (removalBusy.current) return;
    removalBusy.current = true;
    setRemoving(id);
    setRemoveError(null);
    try {
      const { data, error } = await supabase.from("shortlists").delete().eq("id", id).select("id");
      if (error || !data?.some((row: { id: string }) => row.id === id)) {
        throw new Error("Removal was not confirmed");
      }
      const removed = shortlist.find(item => item.id === id);
      setShortlist((prev) => prev.filter((item) => item.id !== id));
      if (removed) notify(`${removed.university_name} — ${removed.course_name} removed from your shortlist.`);
    } catch {
      setRemoveError("Could not remove this program. It is still shown here; please retry.");
    } finally {
      removalBusy.current = false;
      setRemoving(null);
    }
  };

  const groups = [
    { level: "master", title: "Your Masters Program Shortlist" },
    { level: "bachelor", title: "Your Bachelors Program Shortlist" },
    { level: null, title: "Other saved programs — degree level unknown" },
  ].map((group) => ({
    ...group,
    items: shortlist.filter((item) => getProgramLevel(item) === group.level),
  }));

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Shortlist</h1>
      {removeError && <p role="alert" className="mb-4 text-red-700 dark:text-red-300">{removeError}</p>}
      {loading ? (
        <div>Loading...</div>
      ) : loadError ? (<div role="alert" className="rounded-xl border border-red-300 p-4"><p>{loadError}</p><button type="button" className="mt-2 rounded border px-3 py-2" onClick={() => setLoadAttempt(attempt => attempt + 1)}>Retry</button></div>) : shortlist.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/20 bg-white/60 p-4 text-sm text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300">
          No universities shortlisted yet.
        </div>
      ) : (
        <>
          {groups.filter((group) => group.items.length > 0).map((group) => (
            <section key={group.level ?? "unknown"} className="mb-8" aria-label={group.title}>
              <h2 className="text-lg font-semibold mb-2">{group.title}</h2>
              <div className="space-y-4">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-black/10 py-2 last:border-b-0 dark:border-white/10">
                    <div>
                      <div className="font-semibold">{item.university_name}</div>
                      <div className="text-xs text-zinc-500">{item.course_name}</div>
                    </div>
                    <button
                      className="ml-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                      disabled={removing !== null}
                      onClick={() => handleRemoveShortlist(item.id)}
                    >
                      {removing === item.id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </main>
  );
}
