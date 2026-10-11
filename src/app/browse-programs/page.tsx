"use client";
import { useState } from "react";
import { mastersPrograms } from "@/lib/mastersPrograms";
import ProgramList from "@/components/ProgramList";
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

export default function BrowseProgramsPage() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>("masters");
  const [bachelorPrograms, setBachelorPrograms] = useState<Program[]>([]);
  const [loadingBachelors, setLoadingBachelors] = useState(false);


  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadBachelors() {
    setSelectedLevel("bachelors");
    if (loadingBachelors) return;
    setLoadingBachelors(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase.from("programs").select("*").eq("level", "bachelor");
      if (error) throw error;
      setBachelorPrograms(data ?? []);
    } catch {
      setLoadError("Could not load programs. Select Bachelors to try again.");
    } finally {
      setLoadingBachelors(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold mb-6">Browse Programs</h1>
      <div className="flex gap-8 mb-8">
        <button
          className={`flex-1 rounded-2xl p-8 text-2xl font-bold border-2 transition-all 
            ${selectedLevel === "bachelors" 
              ? "border-emerald-500 bg-emerald-50 text-emerald-900" 
              : "border-black/10 bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white"}
          `}
          onClick={loadBachelors}
        >
          Bachelors
        </button>
        <button
          className={`flex-1 rounded-2xl p-8 text-2xl font-bold border-2 transition-all 
            ${selectedLevel === "masters" 
              ? "border-emerald-500 bg-emerald-50 text-emerald-900" 
              : "border-black/10 bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white"}
          `}
          onClick={() => setSelectedLevel("masters")}
        >
          Masters
        </button>
      </div>
      {selectedLevel === "masters" ? (
        <ProgramList programs={mastersPrograms} />
      ) : loadingBachelors ? (
        <div className="rounded-2xl border border-black/10 bg-white/60 p-8 text-center text-lg text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300">
          Loading bachelors programs...
        </div>
      ) : loadError ? (
        <p role="alert">{loadError}</p>
      ) : bachelorPrograms.length > 0 ? (
        <ProgramList programs={bachelorPrograms} />
      ) : (
        <div className="rounded-2xl border border-black/10 bg-white/60 p-8 text-center text-lg text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300">
          No bachelors programs available yet.
        </div>
      )}
    </div>
  );
}
