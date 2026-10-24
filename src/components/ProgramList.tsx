"use client";
import Link from "next/link";
import { admissionBands, catalogueReady, type ProgramDetails } from "@/lib/programDetails";
import { useNotifications } from "@/components/NotificationProvider";
import ApplicationStatusOptions from "@/components/ApplicationStatusOptions";
import { normalizeApplicationStatus } from "@/lib/applicationStatus";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { normalizeProgramLevel } from "@/lib/programLevel";
import { programWebsite } from "@/lib/shortlist";
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
  details?: ProgramDetails | null;
};

type Status = "idle" | "loading" | "shortlisted" | "error" | "signin";

type ProgramMeta = {
  note: string;
  status: string;
  deadline: string | null;
};

type Props = {
  programs: Program[];
};

export default function ProgramList({ programs }: Props) {
  const { notify } = useNotifications();
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
      setStatus(key, "signin");
      setErrorMessage("Please sign in to save programs to your shortlist.");
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
      program_level: normalizeProgramLevel(program.level),
      deadline: null,
      status: "Shortlisted",
      entry_source: "catalogue",
      official_url: programWebsite(program.details?.official_url),
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
    notify(`${program.university_name} — ${program.course_name} added to your shortlist.`);
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
      if (field === "status" && value !== programMeta[key]?.status) notify(`${program.university_name} — ${program.course_name}: status changed to ${normalizeApplicationStatus(value)}.`);
    } catch {
      setErrorMessage("Could not save this change. Please try again.");
    } finally {
      setMetaLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {errorMessage && <p role="alert">{errorMessage}</p>}
      <section className="rounded-xl border border-line bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-muted">
          <span className="rounded-full bg-surface px-3 py-1">
            {programs.length} {programs.length === 1 ? "program" : "programs"} on this page
          </span>
        </div>
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        {programs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface p-6 text-sm text-muted">
          No programs match these filters. Try another degree level or search.
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
              className="group relative overflow-hidden rounded-xl border border-line bg-surface p-6 shadow-sm dark:shadow-none"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-accent/10 blur-2xl transition group-hover:scale-110" />
              <h2 className="text-lg font-semibold">{catalogueReady(program.details) ? <Link href={`/programs/${program.id}`} className="hover:text-accent-ink">{program.course_name}</Link> : program.course_name}</h2>
              <p className="mt-1 text-sm text-muted">
                {program.university_name}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
                {program.level ? (
                  <span className="rounded-full bg-surface px-3 py-1">
                    {program.level}
                  </span>
                ) : null}
                {program.language ? (
                  <span className="rounded-full bg-surface px-3 py-1">
                    {program.language}
                  </span>
                ) : null}
                {program.tuition_type ? (
                  <span className="rounded-full bg-surface px-3 py-1">
                    Tuition: {program.tuition_type}
                  </span>
                ) : null}
                {program.gpa_requirement !== null &&
                program.gpa_requirement !== undefined ? (
                  <span className="rounded-full bg-surface px-3 py-1">
                    GPA ≤ {program.gpa_requirement}
                  </span>
                ) : null}
                {program.gmat_required !== null &&
                program.gmat_required !== undefined ? (
                  <span className="rounded-full bg-surface px-3 py-1">
                    GMAT {program.gmat_required ? "Required" : "Not required"}
                  </span>
                ) : null}
                {program.application_mode ? (
                  <span className="rounded-full bg-surface px-3 py-1">
                    {program.application_mode}
                  </span>
                ) : null}
                {program.intake ? (
                  <span className="rounded-full bg-surface px-3 py-1">
                    {program.intake} intake
                  </span>
                ) : null}
              </div>
              {catalogueReady(program.details) && <div className="mt-5 space-y-3 text-xs leading-6 text-muted">
                <p>{[program.details.city, program.details.duration, program.details.credits && `${program.details.credits} ECTS`].filter(Boolean).join(" · ")}</p>
                <p>{program.details.intakes || "Intake not yet verified"}</p>
                <p>{admissionBands[program.details.admission_band]}</p>
                <Link className="inline-block text-accent-ink underline underline-offset-4" href={`/programs/${program.id}`}>View requirements, fees & deadlines ↗</Link>
              </div>}
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (status === "signin") router.push("/auth/error?reason=signin&next=%2Fbrowse-programs");
                    else if (!isShortlisted) handleShortlist(program);
                  }}
                  disabled={!shortlistReady || isLoading || isShortlisted}
                  className={`inline-flex items-center gap-2 rounded-full ga-primary px-4 py-2 text-xs font-semibold text-ink shadow-sm  transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 ${isShortlisted ? 'ring-2 ring-accent-ink' : ''}`}
                >
                  {isLoading ? (
                    "Processing..."
                  ) : status === "signin" ? (
                    "Sign in to shortlist"
                  ) : status === "error" ? (
                    "Try again"
                  ) : isShortlisted ? (
                    <span className="inline-flex items-center gap-2 text-accent-ink font-semibold">
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
                      <label className="text-xs font-semibold text-muted">Note</label>
                      <textarea
                        className="rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink shadow-sm outline-none transition focus:border-accent-ink"
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
                      <label className="text-xs font-semibold text-muted">Status</label>
                      <select
                        className="rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink shadow-sm outline-none transition focus:border-accent-ink"
                        value={normalizeApplicationStatus(programMeta[key]?.status)}
                        onChange={(e) => handleMetaChange(program, "status", e.target.value)}
                        disabled={metaLoading[key]}
                      >
                        <ApplicationStatusOptions value={programMeta[key]?.status} />
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <label className="text-xs font-semibold text-muted">Deadline</label>
                      <input
                        type="date"
                        className="rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink shadow-sm outline-none transition focus:border-accent-ink"
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
