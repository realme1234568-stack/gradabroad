"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function TrackerForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    university_name: "",
    course_name: "",
    status: "Documents in progress",
    checklist: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    // Input validation
    if (!form.university_name.trim() || !form.course_name.trim()) {
      setError("University and course name are required.");
      setLoading(false);
      return;
    }
    if (form.university_name.length > 100 || form.course_name.length > 100) {
      setError("Input too long.");
      setLoading(false);
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setError("Sign in to add tracker entries.");
      setLoading(false);
      return;
    }
    const checklistArray = form.checklist
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const { error: insertError } = await supabase
      .from("application_tracker")
      .insert({
        user_id: user.id,
        university_name: form.university_name.trim(),
        course_name: form.course_name.trim(),
        status: form.status.trim(),
        checklist: checklistArray,
      });
    if (insertError) {
      setError(insertError.message);
    } else {
      setForm({
        university_name: "",
        course_name: "",
        status: "Documents in progress",
        checklist: "",
      });
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-lg shadow-purple-200/30 dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-none">
      <h2 className="text-lg font-semibold">Add a tracker entry</h2>
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
          value={form.status}
          onChange={(event) => handleChange("status", event.target.value)}
          placeholder="Status"
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-white/10 dark:bg-black/60 dark:text-white"
        />
        <input
          value={form.checklist}
          onChange={(event) => handleChange("checklist", event.target.value)}
          placeholder="Checklist (comma separated)"
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-white/10 dark:bg-black/60 dark:text-white"
        />
      </div>
      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !form.university_name || !form.course_name}
        className="mt-4 rounded-full bg-[radial-gradient(circle_at_top,_#a855f7,_#8b5cf6,_#6366f1)] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-200/40 transition hover:scale-[1.01] disabled:opacity-60"
      >
        Add tracker entry
      </button>
    </div>
  );
}
