"use client";
import { useEffect, useState } from "react";
import ProgramList from "@/components/ProgramList";
import { supabase } from "@/lib/supabaseClient";

type Program = {
  id: string;
  university_name: string;
  course_name: string;
  level: string | null;
  language: string | null;
};
const pageSize = 48;
export default function BrowseProgramsPage() {
  const [selectedLevel, setSelectedLevel] = useState<"master" | "bachelor">(
    "master",
  );
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const { data, count, error } = await supabase
          .from("programs")
          .select("id,university_name,course_name,level,language", {
            count: "exact",
          })
          .in("level", [selectedLevel, `${selectedLevel}s`])
          .eq("is_published", true)
          .order("university_name")
          .order("course_name")
          .order("id")
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (!active) return;
        if (error) throw error;
        setPrograms(data ?? []);
        setTotal(count ?? 0);
      } catch {
        if (active) setLoadError("Could not load programs. Please retry.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [selectedLevel, page, attempt]);
  function choose(level: typeof selectedLevel) {
    setPage(0);
    setSelectedLevel(level);
  }
  return (
    <div className="app-page mx-auto w-full max-w-6xl px-6 py-12">
      <p className="page-eyebrow">FIND YOUR DIRECTION</p>
      <h1>Browse Programs</h1>
      <p>
        Find your next chapter in Germany. Explore programs and build your
        personal shortlist.
      </p>
      <div className="degree-tabs">
        {(
          [
            ["bachelor", "Bachelors"],
            ["master", "Masters"],
          ] as const
        ).map(([level, label]) => (
          <button
            type="button"
            key={level}
            className={`border-2 transition-colors ${selectedLevel === level ? "border-accent-ink bg-accent-soft text-accent-ink" : "border-line bg-surface text-ink"}`}
            aria-pressed={selectedLevel === level}
            onClick={() => choose(level)}
          >
            {label}
          </button>
        ))}
      </div>
      {loading ? (
        <p role="status">Loading programs…</p>
      ) : loadError ? (
        <div role="alert" className="rounded-xl border border-line p-6">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-3 underline"
          >
            Retry
          </button>
        </div>
      ) : programs.length ? (
        <>
          <ProgramList key={`${selectedLevel}:${page}`} programs={programs} />
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
            <span>
              {total} programs · Page {page + 1} of{" "}
              {Math.max(1, Math.ceil(total / pageSize))}
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((value) => value - 1)}
                className="rounded border border-line px-4 py-2 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={(page + 1) * pageSize >= total}
                onClick={() => setPage((value) => value + 1)}
                className="rounded border border-line px-4 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-line bg-surface p-8 text-muted">
          No {selectedLevel === "master" ? "Master’s" : "Bachelor’s"} programs
          are available on this page.
          {page > 0 && (
            <button
              type="button"
              className="ml-3 underline"
              onClick={() => setPage(0)}
            >
              Go to first page
            </button>
          )}
        </p>
      )}
    </div>
  );
}
