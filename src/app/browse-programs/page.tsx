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
    <div className="app-page mx-auto w-full max-w-6xl px-6 py-12">
      <p className="page-eyebrow">FIND YOUR DIRECTION</p>
      <h1 className="text-3xl font-semibold mb-6">Browse Programs</h1>
      <p className="text-muted">Find your next chapter in Germany. Explore programs and build your personal shortlist.</p>
      <div className="degree-tabs">
        <button
          className={`flex-1 rounded-xl p-8 text-2xl font-bold border-2 transition-all
            ${selectedLevel === "bachelors"
              ? "border-accent-ink bg-accent-soft text-accent-ink"
              : "border-line bg-surface text-ink bg-surface text-ink"}
          `}
          aria-pressed={selectedLevel === "bachelors"}
          onClick={loadBachelors}
        >
          Bachelors
        </button>
        <button
          className={`flex-1 rounded-xl p-8 text-2xl font-bold border-2 transition-all
            ${selectedLevel === "masters"
              ? "border-accent-ink bg-accent-soft text-accent-ink"
              : "border-line bg-surface text-ink bg-surface text-ink"}
          `}
          aria-pressed={selectedLevel === "masters"}
          onClick={() => setSelectedLevel("masters")}
        >
          Masters
        </button>
      </div>
      {selectedLevel === "masters" ? (
        <ProgramList programs={mastersPrograms} />
      ) : loadingBachelors ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-lg text-muted">
          Loading bachelors programs...
        </div>
      ) : loadError ? (
        <p role="alert">{loadError}</p>
      ) : bachelorPrograms.length > 0 ? (
        <ProgramList programs={bachelorPrograms} />
      ) : (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-lg text-muted">
          No bachelors programs available yet.
        </div>
      )}
    </div>
  );
}
