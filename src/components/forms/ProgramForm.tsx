"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ProgramForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    university_name: "",
    course_name: "",
    level: "",
    language: "",
    intake: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setError("Sign in to add programs.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("programs").insert({
      user_id: user.id,
      university_name: form.university_name,
      course_name: form.course_name,
      level: form.level || null,
      language: form.language || null,
      intake: form.intake || null,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setForm({
        university_name: "",
        course_name: "",
        level: "",
        language: "",
        intake: "",
      });
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-lg shadow-emerald-200/30 dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-none">
      <h2 className="text-lg font-semibold">Add a program</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          value={form.university_name}
          onChange={(event) => handleChange("university_name", event.target.value)}
          placeholder="University name"
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-white/10 dark:bg-black/60 dark:text-white"
        />
        <input
          value={form.course_name}
          onChange={(event) => handleChange("course_name", event.target.value)}
          placeholder="Course name"
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-white/10 dark:bg-black/60 dark:text-white"
        />
        <input
          value={form.level}
          onChange={(event) => handleChange("level", event.target.value)}
          placeholder="Level (Bachelor's/Master's)"
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-white/10 dark:bg-black/60 dark:text-white"
        />
        <input
          value={form.language}
          onChange={(event) => handleChange("language", event.target.value)}
          placeholder="Language"
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-white/10 dark:bg-black/60 dark:text-white"
        />
        <input
          value={form.intake}
          onChange={(event) => handleChange("intake", event.target.value)}
          placeholder="Intake (e.g., Winter 2025)"
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-white/10 dark:bg-black/60 dark:text-white"
        />
      </div>
      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !form.university_name || !form.course_name}
        className="mt-4 rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#22d3ee,_#0ea5e9)] px-4 py-2 text-xs font-semibold text-zinc-900 shadow-md shadow-emerald-200/40 transition hover:scale-[1.01] disabled:opacity-60"
      >
        Add program
      </button>
    </div>
  );
}
