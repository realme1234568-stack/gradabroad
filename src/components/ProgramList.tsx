"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Program = {
  id: string;
  university_name: string;
  course_name: string;
  level: string | null;
  language: string | null;
};

type Status = "idle" | "loading" | "shortlisted" | "error";

type Props = {
  programs: Program[];
};

export default function ProgramList({ programs }: Props) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  const setStatus = (id: string, status: Status) => {
    setStatuses((prev) => ({ ...prev, [id]: status }));
  };

  const handleShortlist = async (program: Program) => {
    setStatus(program.id, "loading");
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setStatus(program.id, "error");
      return;
    }

    const { error } = await supabase.from("shortlists").insert({
      user_id: user.id,
      university_name: program.university_name,
      course_name: program.course_name,
      deadline: null,
      status: "Shortlisted",
    });

    if (error) {
      setStatus(program.id, "error");
      return;
    }

    setStatus(program.id, "shortlisted");
    router.refresh();
  };

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {programs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/20 bg-white/60 p-6 text-sm text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300">
          No programs yet. Add some rows in Supabase to see them here.
        </div>
      ) : (
        programs.map((program) => {
          const status = statuses[program.id] ?? "idle";
          const isLoading = status === "loading";
          const isShortlisted = status === "shortlisted";

          return (
            <div
              key={program.id}
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
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => handleShortlist(program)}
                  disabled={isLoading || isShortlisted}
                  className="inline-flex items-center gap-2 rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#22d3ee,_#0ea5e9)] px-4 py-2 text-xs font-semibold text-zinc-900 shadow-md shadow-emerald-300/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isShortlisted ? (
                    <span className="inline-flex items-center gap-2 text-emerald-900">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 animate-pulse">
                        ✓
                      </span>
                      Shortlisted
                    </span>
                  ) : isLoading ? (
                    "Shortlisting..."
                  ) : status === "error" ? (
                    "Try again"
                  ) : (
                    "Add to shortlist"
                  )}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
