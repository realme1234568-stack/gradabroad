import { createSupabaseServerClient } from "@/lib/supabaseServer";
import ProgramList from "@/components/ProgramList";

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

import { useState } from "react";

export default function BrowseProgramsPageWrapper() {
  // This wrapper is needed to use state in a server component
  // The actual data fetching is still done server-side
  return <BrowseProgramsPageInner />;
}

function BrowseProgramsPageInner() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>("masters");

  // Data fetching must be done in a server component, so this is a placeholder for the real fetch
  // In a real Next.js app, you would fetch data in the server component and pass as props
  // For now, assume all programs are masters
  const programs: Program[] = [];

  // UI for level selection
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold mb-6">Browse Programs</h1>
      <div className="flex gap-8 mb-8">
        <button
          className={`flex-1 rounded-2xl p-8 text-2xl font-bold border-2 transition-all ${selectedLevel === "bachelors" ? "border-emerald-500 bg-emerald-50" : "border-black/10 bg-white"}`}
          onClick={() => setSelectedLevel("bachelors")}
        >
          Bachelors
        </button>
        <button
          className={`flex-1 rounded-2xl p-8 text-2xl font-bold border-2 transition-all ${selectedLevel === "masters" ? "border-emerald-500 bg-emerald-50" : "border-black/10 bg-white"}`}
          onClick={() => setSelectedLevel("masters")}
        >
          Masters
        </button>
      </div>
      {selectedLevel ? (
        selectedLevel === "masters" ? (
          <ProgramList programs={programs} />
        ) : (
          <div className="rounded-2xl border border-black/10 bg-white/60 p-8 text-center text-lg text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300">
            No bachelors programs available yet.
          </div>
        )
      ) : null}
    </div>
  );
}
