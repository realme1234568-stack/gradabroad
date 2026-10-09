"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
import { supabase } from "@/lib/supabaseClient";

type Program = {
  id: string;
  university_name: string;
  course_name: string;
  level: string | null;
  language: string | null;
  tuition_type?: string | null;
  gpa_requirement?: number | null;
  gmat_required?: boolean | null;
  application_mode?: string | null;
  intake?: string | null;
};

type Status = "idle" | "loading" | "shortlisted" | "error";

type ProgramMeta = {
  note: string;
  status: string;
  deadline: string | null;
};

type Props = {
  programs: Program[];
};

export default function ProgramList({ programs }: Props) {
  const router = useRouter();
  const { email } = useUser();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shortlistReady, setShortlistReady] = useState(false);
  // Use composite key for shortlist state
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [shortlistedKeys, setShortlistedKeys] = useState<Set<string>>(new Set());

  // Per-program meta: note, status, deadline
  const [programMeta, setProgramMeta] = useState<Record<string, ProgramMeta>>({});
  const [metaLoading, setMetaLoading] = useState<Record<string, boolean>>({});

  const getKey = (program: Program) => `${program.university_name}|||${program.course_name}`;
  const setStatus = (key: string, status: Status) => {
    setStatuses((prev) => ({ ...prev, [key]: status }));
  } 

  // Fetch user's shortlist from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    const fetchShortlistAndMeta = async () => {
      setShortlistReady(false);
      setErrorMessage(null);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (cancelled) return;
      if (!user) {
        setShortlistedKeys(new Set());
        setProgramMeta({});
        setStatuses({});
        setShortlistReady(true);
        return;
      }
      const { data, error } = await supabase
        .from("shortlists")
        .select("course_name, university_name, note, status, deadline")
        .eq("user_id", user.id);
      if (cancelled) return;
      if (error) {
        setErrorMessage("Could not load your shortlist. Refresh to retry.");
        return;
      }
      setShortlistReady(true);
      if (data) {
        // Find matching program keys
        const keys = new Set(
          programs
            .filter((p) =>
              data.some(
                (s) =>
                  s.course_name === p.course_name &&
                  s.university_name === p.university_name
              )
            )
            .map((p) => getKey(p))
        );
        setShortlistedKeys(keys);
        // Set status for UI
        setStatuses((prev) => {
          const updated = { ...prev };
          keys.forEach((key) => {
            updated[key] = "shortlisted";
          });
          return updated;
        });
        // Set meta
        const meta: Record<string, ProgramMeta> = {};
        programs.forEach((p) => {
          const s = data.find(
            (row) =>
              row.course_name === p.course_name &&
              row.university_name === p.university_name
          );
          if (s) {
            meta[getKey(p)] = {
              note: s.note || "",
              status: s.status || "Shortlisted",
              deadline: s.deadline || null,
            };
          }
        });
        setProgramMeta(meta);
      }
    };
    fetchShortlistAndMeta().catch(() => {
      if (!cancelled) setErrorMessage("Could not load your shortlist. Refresh to retry.");
    });
    return () => { cancelled = true; };
  }, [programs, email]);

  // Toggle shortlist (add/remove)
  const handleShortlist = async (program: Program) => {
    const key = getKey(program);
    setStatus(key, "loading");
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setStatus(key, "error");
      return;
    }
    const isShortlisted = shortlistedKeys.has(key);
    if (isShortlisted) {
      // Already shortlisted, do nothing
      setStatus(key, "shortlisted");
      return;
    }
    // Add to shortlist
    const { error } = await supabase.from("shortlists").insert({
      user_id: user.id,
      university_name: program.university_name,
      course_name: program.course_name,
      program_level: program.level?.replace(/s$/, "") ?? null,
      deadline: null,
      status: "Shortlisted",
    });
    if (error) {
      if (error.code === "23505") {
        // Unique violation, already exists
        setShortlistedKeys((prev) => new Set(prev).add(key));
        setStatus(key, "shortlisted");
      } else {
        setStatus(key, "error");
      }
      return;
    }
    setShortlistedKeys((prev) => new Set(prev).add(key));
    setStatus(key, "shortlisted");
    setProgramMeta((prev) => ({ ...prev, [key]: { note: "", status: "Shortlisted", deadline: null } }));
    router.refresh();
  };

  // Update note/status/deadline for a program
  const handleMetaChange = async (
    program: Program,
    field: keyof ProgramMeta,
    value: string | null
  ) => {
    const key = getKey(program);
    setMetaLoading((prev) => ({ ...prev, [key]: true }));
    setErrorMessage(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Sign in to save changes.");
      const { data, error } = await supabase
        .from("shortlists")
        .update({ [field]: value })
        .eq("user_id", userData.user.id)
        .eq("university_name", program.university_name)
        .eq("course_name", program.course_name)
        .select("id");
      if (error || !data?.length) throw new Error("Save failed");
      setProgramMeta((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    } catch {
      setErrorMessage("Could not save this change. Please try again.");
    } finally {
      setMetaLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {errorMessage && <p role="alert">{errorMessage}</p>}
      <section className="rounded-2xl border border-black/10 bg-white/70 p-4 shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
            Showing {programs.length} of {programs.length}
          </span>
        </div>
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        {programs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/20 bg-white/60 p-6 text-sm text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300">
          No programs yet. Add some rows in Supabase to see them here.
        </div>
      ) : (
        programs.map((program) => {
          const key = getKey(program);
          const status = statuses[key] ?? "idle";
          const isLoading = status === "loading";
          const isShortlisted = shortlistedKeys.has(key);

          return (
            <div
              key={key}
              className="group relative overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-6 shadow-lg shadow-emerald-200/30 dark:border-white/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-black dark:shadow-none"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl transition group-hover:scale-110" />
              <h2 className="text-lg font-semibold">{program.course_name}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {program.university_name}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-600 dark:text-zinc-300">
                {program.level ? (
                  <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
                    {program.level}
                  </span>
                ) : null}
                {program.language ? (
                  <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
                    {program.language}
                  </span>
                ) : null}
                {program.tuition_type ? (
                  <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
                    Tuition: {program.tuition_type}
                  </span>
                ) : null}
                {program.gpa_requirement !== null &&
                program.gpa_requirement !== undefined ? (
                  <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
                    GPA ≤ {program.gpa_requirement}
                  </span>
                ) : null}
                {program.gmat_required !== null &&
                program.gmat_required !== undefined ? (
                  <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
                    GMAT {program.gmat_required ? "Required" : "Not required"}
                  </span>
                ) : null}
                {program.application_mode ? (
                  <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
                    {program.application_mode}
                  </span>
                ) : null}
                {program.intake ? (
                  <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
                    {program.intake} intake
                  </span>
                ) : null}
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isShortlisted) handleShortlist(program);
                  }}
                  disabled={!shortlistReady || isLoading || isShortlisted}
                  className={`inline-flex items-center gap-2 rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#22d3ee,_#0ea5e9)] px-4 py-2 text-xs font-semibold text-zinc-900 shadow-md shadow-emerald-300/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 ${isShortlisted ? 'ring-2 ring-emerald-400' : ''}`}
                >
                  {isLoading ? (
                    "Processing..."
                  ) : status === "error" ? (
                    "Try again"
                  ) : isShortlisted ? (
                    <span className="inline-flex items-center gap-2 text-emerald-600 font-semibold">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Already Shortlisted
                    </span>
                  ) : (
                    "Add to shortlist"
                  )}
                </button>
                {isShortlisted && (
                  <>
                    <div className="flex flex-col gap-1 mt-2">
                      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Note</label>
                      <textarea
                        className="rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-xs text-zinc-900 shadow-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                        rows={2}
                        defaultValue={programMeta[key]?.note || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (programMeta[key]?.note || "")) {
                            void handleMetaChange(program, "note", e.target.value);
                          }
                        }}
                        disabled={metaLoading[key]}
                        placeholder="Add your notes..."
                      />
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Status</label>
                      <select
                        className="rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-xs text-zinc-900 shadow-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                        value={programMeta[key]?.status || "Shortlisted"}
                        onChange={(e) => handleMetaChange(program, "status", e.target.value)}
                        disabled={metaLoading[key]}
                      >
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Applied">Applied</option>
                        <option value="Interview">Interview</option>
                        <option value="Admit">Admit</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Deadline</label>
                      <input
                        type="date"
                        className="rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-xs text-zinc-900 shadow-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                        value={programMeta[key]?.deadline || ""}
                        onChange={(e) => handleMetaChange(program, "deadline", e.target.value)}
                        disabled={metaLoading[key]}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
  );
}
