"use client";
import Link from "next/link";
import { useState } from "react";
import FeedbackBox from "@/components/FeedbackBox";

export default function MyProfilePage() {
  // For demo: use local state. Replace with Supabase fetch/save for real app.
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [programInterest, setProgramInterest] = useState("");
  const [qualification, setQualification] = useState("");
  const [englishTest, setEnglishTest] = useState("");
  const [aptitudeTest, setAptitudeTest] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const isDirty =
    firstName ||
    secondName ||
    programInterest ||
    qualification ||
    englishTest ||
    aptitudeTest;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // TODO: Save to Supabase profile table
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-semibold">My Profile</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Manage your personal details and study preferences.
      </p>

      <form
        className="mt-8 space-y-6 rounded-3xl border border-black/10 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-8 shadow-xl shadow-emerald-200/30 dark:border-white/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-black dark:shadow-none"
        onSubmit={handleSave}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-base text-zinc-900 shadow-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
              placeholder="Enter first name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2">
              Second Name
            </label>
            <input
              type="text"
              value={secondName}
              onChange={e => setSecondName(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-base text-zinc-900 shadow-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
              placeholder="Enter second name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2">
              Which program are you interested in?
            </label>
            <select
              value={programInterest}
              onChange={e => setProgramInterest(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-base text-zinc-900 shadow-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
            >
              <option value="">Select</option>
              <option value="bachelors">Bachelors</option>
              <option value="masters">Masters</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2">
              Your highest qualification
            </label>
            <select
              value={qualification}
              onChange={e => setQualification(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-base text-zinc-900 shadow-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
            >
              <option value="">Select</option>
              <option value="12th">12th pass</option>
              <option value="graduate">Graduate</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2">
              Have you taken any English tests?
            </label>
            <select
              value={englishTest}
              onChange={e => setEnglishTest(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-base text-zinc-900 shadow-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
            >
              <option value="">Select</option>
              <option value="ielts">IELTS</option>
              <option value="toefl">TOEFL</option>
              <option value="duolingo">Duolingo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2">
              Have you given any aptitude test?
            </label>
            <select
              value={aptitudeTest}
              onChange={e => setAptitudeTest(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-base text-zinc-900 shadow-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
            >
              <option value="">Select</option>
              <option value="gmat">GMAT</option>
              <option value="gre">GRE</option>
            </select>
          </div>
        </div>
        <div className="pt-6 flex items-center gap-4">
          <button
            type="submit"
            className="rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#22d3ee,_#0ea5e9)] px-6 py-2 text-base font-semibold text-zinc-900 shadow-md shadow-emerald-300/40 transition hover:scale-[1.01] disabled:opacity-60"
            disabled={!isDirty || saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {saved && (
            <span className="text-emerald-600 text-sm font-medium">Saved!</span>
          )}
        </div>
      </form>

      {/* Dev dashboard removed: was referencing missing isDev variable. */}
      {/* Feedback Section */}
      <FeedbackBox />
    </div>
  );
}
