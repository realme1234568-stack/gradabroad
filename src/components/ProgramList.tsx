"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  ignoreFilters?: boolean;
};

export default function ProgramList({ programs, ignoreFilters }: Props) {
  const router = useRouter();
  // Use composite key for shortlist state
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [shortlistedKeys, setShortlistedKeys] = useState<Set<string>>(new Set());
  const [tuitionFilter, setTuitionFilter] = useState("any");
  const [languageFilter, setLanguageFilter] = useState("any");
  const [gpaMax, setGpaMax] = useState<string>("");
  const [gmatFilter, setGmatFilter] = useState("any");
  const [applyFilter, setApplyFilter] = useState("any");
  const [intakeFilter, setIntakeFilter] = useState("any");

  // Per-program meta: note, status, deadline
  const [programMeta, setProgramMeta] = useState<Record<string, ProgramMeta>>({});
  const [metaLoading, setMetaLoading] = useState<Record<string, boolean>>({});

  const getKey = (program: Program) => `${program.university_name}|||${program.course_name}`;
  const setStatus = (key: string, status: Status) => {
    setStatuses((prev) => ({ ...prev, [key]: status }));
  } 

  // Fetch user's shortlist from Supabase on mount
  useEffect(() => {
    const fetchShortlistAndMeta = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;
      const { data, error } = await supabase
        .from("shortlists")
        .select("course_name, university_name, note, status, deadline")
        .eq("user_id", user.id);
      if (!error && data) {
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
    fetchShortlistAndMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programs]);

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
    if (!isShortlisted) {
      // Add to shortlist
      const { error } = await supabase.from("shortlists").insert({
        user_id: user.id,
        university_name: program.university_name,
        course_name: program.course_name,
        deadline: null,
        status: "Shortlisted",
      });
      if (error) {
        setStatus(key, "error");
        return;
      }
      setShortlistedKeys((prev) => new Set(prev).add(key));
      setStatus(key, "shortlisted");
      setProgramMeta((prev) => ({ ...prev, [key]: { note: "", status: "Shortlisted", deadline: null } }));
    } else {
      // Remove from shortlist
      const { error } = await supabase
        .from("shortlists")
        .delete()
        .eq("user_id", user.id)
        .eq("university_name", program.university_name)
        .eq("course_name", program.course_name);
      if (error) {
        setStatus(key, "error");
        return;
      }
      setShortlistedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setStatus(key, "idle");
      setProgramMeta((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    router.refresh();
  };

  // Update note/status/deadline for a program
  const handleMetaChange = async (
    program: Program,
    field: keyof ProgramMeta,
    value: string | null
  ) => {
    setMetaLoading((prev) => ({ ...prev, [program.id]: true }));
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;
    const { error } = await supabase
      .from("shortlists")
      .update({ [field]: value })
      .eq("user_id", user.id)
      .eq("university_name", program.university_name)
      .eq("course_name", program.course_name);
    if (!error) {
      setProgramMeta((prev) => ({
        ...prev,
        [program.id]: {
          ...prev[program.id],
          [field]: value,
        },
      }));
    }
    setMetaLoading((prev) => ({ ...prev, [program.id]: false }));
  };

  const filteredPrograms = useMemo(() => {
    if (ignoreFilters) return programs;
    const normalizedGpa = gpaMax.trim() === "" ? null : Number(gpaMax);
    return programs.filter((program) => {
      const languageValue = (program.language ?? "").toLowerCase();
      const tuitionValue = (program.tuition_type ?? "").toLowerCase();
      const applyValue = (program.application_mode ?? "").toLowerCase();
      const intakeValue = (program.intake ?? "").toLowerCase();
      const matchesTuition =
        tuitionFilter === "any"
          ? true
          : tuitionFilter === "free-low"
            ? ["free", "low", "low cost", "low-cost"].some((value) =>
                tuitionValue.includes(value)
              )
            : tuitionValue.includes(tuitionFilter);
      const matchesLanguage =
        languageFilter === "any"
          ? true
          : languageValue.includes(languageFilter);
      const matchesGpa =
        normalizedGpa === null
          ? true
          : program.gpa_requirement === null ||
            program.gpa_requirement === undefined
            ? true
            : program.gpa_requirement <= normalizedGpa;
      const matchesGmat =
        gmatFilter === "any"
          ? true
          : gmatFilter === "required"
            ? program.gmat_required === true
            : program.gmat_required === false;
      const matchesApply =
        applyFilter === "any" ? true : applyValue.includes(applyFilter);
      const matchesIntake =
        intakeFilter === "any" ? true : intakeValue.includes(intakeFilter);
      return (
        matchesTuition &&
        matchesLanguage &&
        matchesGpa &&
        matchesGmat &&
        matchesApply &&
        matchesIntake
      );
    });
  }, [
    programs,
    tuitionFilter,
    languageFilter,
    gpaMax,
    gmatFilter,
    applyFilter,
    intakeFilter,
    ignoreFilters
  ]);

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-2xl border border-black/10 bg-white/70 p-4 shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
            Showing {filteredPrograms.length} of {programs.length}
          </span>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* ...existing code... */}
        </div>
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        {programs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/20 bg-white/60 p-6 text-sm text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300">
          No programs yet. Add some rows in Supabase to see them here.
        </div>
      ) : (
        filteredPrograms.map((program) => {
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
                  onClick={() => handleShortlist(program)}
                  disabled={isLoading}
                  className={`inline-flex items-center gap-2 rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#22d3ee,_#0ea5e9)] px-4 py-2 text-xs font-semibold text-zinc-900 shadow-md shadow-emerald-300/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 ${isShortlisted ? 'ring-2 ring-emerald-400' : ''}`}
                >
                  {isLoading ? (
                    "Processing..."
                  ) : status === "error" ? (
                    "Try again"
                  ) : isShortlisted ? (
                    <span className="inline-flex items-center gap-2 text-emerald-900">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 animate-pulse">
                        ✓
                      </span>
                      Remove from shortlist
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
                        value={programMeta[key]?.note || ""}
                        onChange={(e) => handleMetaChange(program, "note", e.target.value)}
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
