"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ProgramList from "@/components/ProgramList";
import ProgramResearchNote from "@/components/ProgramResearchNote";
import { supabase } from "@/lib/supabaseClient";
import { admissionBands, catalogueReady, type ProgramDetails } from "@/lib/programDetails";

type Program = {
  id: string;
  university_name: string;
  course_name: string;
  level: string | null;
  language: string | null;
  details: ProgramDetails;
};
const pageSize = 24;
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
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [band, setBand] = useState("all");
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const { data, error } = await supabase.rpc("search_english_programs", {
          p_level: selectedLevel, p_query: submittedQuery, p_band: band, p_page: page,
        });
        if (!active) return;
        if (error) throw error;
        if (!data || !Array.isArray(data.items) || data.items.length > pageSize || !Number.isSafeInteger(data.total) || data.total < data.items.length || data.page !== page ||
            !data.items.every((p: Program) => p && typeof p.id === "string" && typeof p.university_name === "string" && typeof p.course_name === "string" && p.language === "English" && p.level === selectedLevel && catalogueReady(p.details)))
          throw new Error("Unexpected catalogue response");
        setPrograms(data.items);
        setTotal(data.total);
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
  }, [selectedLevel, page, attempt, submittedQuery, band]);
  function choose(level: typeof selectedLevel) {
    setPage(0);
    setSelectedLevel(level);
  }
  return (
    <div className="app-page mx-auto w-full max-w-6xl px-6 py-12">
      <p className="page-eyebrow">FIND YOUR DIRECTION</p>
      <h1>Browse Programs</h1>
      <p>
        English-taught degrees at public universities across Germany. Compare
        published requirements, intakes and costs, then build your shortlist.
      </p>
      <p className="mt-6 rounded-xl border border-line bg-surface px-5 py-4 text-sm leading-7 text-ink">
        <strong>Can’t find your dream university? Add it manually <Link href="/dashboard/my-shortlist" className="text-accent-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4" aria-label="Add your university or program in My Shortlist">here</Link>.</strong>
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
      <form className="my-8 flex flex-wrap items-end gap-4 rounded-xl border border-line bg-surface p-5" onSubmit={e => {
        e.preventDefault(); setPage(0); setSubmittedQuery(query.trim());
      }}>
        <label className="w-full min-w-0 text-xs text-muted sm:flex-1">University or program
          <input className="mt-2 block w-full rounded-lg border border-line bg-background px-3 py-3 text-sm text-ink" type="search" maxLength={120} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Germany’s public programs" />
        </label>
        <label className="w-full text-xs text-muted sm:w-auto">Admission requirements
          <select className="mt-2 block w-full max-w-full rounded-lg border border-line bg-background px-3 py-3 text-sm text-ink" value={band} onChange={e => { setPage(0); setBand(e.target.value); }}>
            <option value="all">All planning groups</option>
            {Object.entries(admissionBands).map(([key,label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <button type="submit" className="ga-primary rounded-lg px-5 py-3 text-sm">Search</button>
        {(submittedQuery || band !== "all") && <button type="button" className="px-3 py-3 text-sm underline" onClick={() => { setQuery(""); setSubmittedQuery(""); setBand("all"); setPage(0); }}>Clear filters</button>}
      </form>
      <p className="mb-6 text-xs leading-6 text-muted">Planning groups describe entry requirements, not acceptance chances or university rankings. Open admission still requires all stated qualifications. Check each program’s sources and review date.</p>
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
              {total} {total === 1 ? "program" : "programs"} · Page {page + 1} of{" "}
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
          No {selectedLevel === "master" ? "Master’s" : "Bachelor’s"} programs match these filters on this page.
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
      <ProgramResearchNote />
    </div>
  );
}
