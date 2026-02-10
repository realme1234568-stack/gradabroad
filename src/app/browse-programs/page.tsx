"use client";
import { useState, useEffect } from "react";
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

  // Hardcoded master's programs
  const mastersPrograms: Program[] = [
    {
      id: "1",
      university_name: "Leuphana University of Lüneburg",
      course_name: "M.Sc. Management & Entrepreneurship",
      level: "masters",
      language: "English",
    },
    {
      id: "2",
      university_name: "Otto von Guericke University Magdeburg",
      course_name: "M.Sc. International Management, Marketing & Entrepreneurship (IMME)",
      level: "masters",
      language: "English",
    },
    {
      id: "3",
      university_name: "Chemnitz University of Technology",
      course_name: "M.Sc. Management & Economics",
      level: "masters",
      language: "English",
    },
    {
      id: "4",
      university_name: "University of Duisburg-Essen",
      course_name: "M.Sc. Economics (Applied / Business)",
      level: "masters",
      language: "English",
    },
    {
      id: "5",
      university_name: "University of Siegen",
      course_name: "M.Sc. Economics / Economic Policy",
      level: "masters",
      language: "English",
    },
    {
      id: "6",
      university_name: "University of Cologne",
      course_name: "M.Sc. Economics",
      level: "masters",
      language: "English",
    },
    {
      id: "7",
      university_name: "University of Passau",
      course_name: "M.Sc. International Economics & Business",
      level: "masters",
      language: "English",
    },
    {
      id: "8",
      university_name: "TU Berlin",
      course_name: "IMES",
      level: "masters",
      language: "English",
    },
    {
      id: "9",
      university_name: "Technical University of Munich",
      course_name: "M.Sc. Management and digital technology",
      level: "masters",
      language: "English",
    },
  ];

  // UI for level selection
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
          onClick={() => setSelectedLevel("bachelors")}
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
      {selectedLevel ? (
        selectedLevel === "masters" ? (
          <ProgramList programs={mastersPrograms} ignoreFilters />
        ) : (
          <div className="rounded-2xl border border-black/10 bg-white/60 p-8 text-center text-lg text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300">
            No bachelors programs available yet.
          </div>
        )
      ) : null}
    </div>
  );
}
