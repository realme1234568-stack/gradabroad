"use client";
import { normalizeApplicationStatus } from "@/lib/applicationStatus";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TrackerItem = {
  id: string;
  university_name: string;
  course_name: string;
  status: string;
  checklist?: string[];
};

const stageColors: Record<string, string> = {
  "Shortlisted": "bg-emerald-400/20 text-emerald-700",
  "Applied": "bg-cyan-400/20 text-cyan-700",
  "Interview": "bg-amber-400/20 text-amber-700",
  "Accepted": "bg-green-400/20 text-green-700",
  "Rejected": "bg-rose-400/20 text-rose-700",
};

export default function ApplicationTrackerPage() {
  const [trackerItems, setTrackerItems] = useState<TrackerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    const fetchTracker = async () => {
      setLoading(true);
      setLoadError(null);
      try {
      const { data, error: queryError } = await supabase
        .from("application_tracker")
        .select("id, university_name, course_name, status, checklist")
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      setTrackerItems(data ?? []);
      } catch {
        setLoadError("Could not load your application tracker. Please retry.");
      } finally {
        setLoading(false);
      }
    };
    fetchTracker();
  }, [loadAttempt]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Application Tracker</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Monitor every shortlisted university from document prep to decision.
      </p>

      <div className="mt-8 grid gap-6">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-black/20 bg-white/60 p-6 text-sm text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300">
            Loading tracker entries...
          </div>
        ) : loadError ? (<div role="alert" className="rounded-xl border border-red-300 p-4"><p>{loadError}</p><button type="button" className="mt-2 rounded border px-3 py-2" onClick={() => setLoadAttempt(attempt => attempt + 1)}>Retry</button></div>) : trackerItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/20 bg-white/60 p-6 text-sm text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300">
            No tracker entries yet. Add rows in Supabase to see them here.
          </div>
        ) : (
          trackerItems.map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-white via-purple-50 to-emerald-50 p-6 shadow-lg shadow-purple-200/30 dark:border-white/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-black dark:shadow-none"
            >
              <div className="pointer-events-none absolute -left-16 top-6 h-32 w-32 rounded-full bg-purple-300/20 blur-2xl" />
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {item.university_name}
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {item.course_name}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    stageColors[normalizeApplicationStatus(item.status)] ?? "bg-emerald-400/20 text-emerald-200"
                  }`}
                >
                  {normalizeApplicationStatus(item.status)}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  Documents
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(item.checklist ?? []).length === 0 ? (
                    <span className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                      No documents added
                    </span>
                  ) : (
                    item.checklist?.map((doc) => (
                      <span
                        key={doc}
                        className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
                      >
                        {doc}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
