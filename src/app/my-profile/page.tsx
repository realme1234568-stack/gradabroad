import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";


import { useState } from "react";

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

      {/* ...existing dev dashboard code below remains unchanged... */}

      {isDev ? (
        <section className="mt-10 rounded-3xl border border-emerald-300/40 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-8 shadow-xl shadow-emerald-200/40 dark:border-emerald-400/30 dark:from-zinc-900 dark:via-zinc-950 dark:to-black dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
                Dev Dashboard
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Insider controls</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Private metrics and tools only visible to your dev account.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dev/import"
                className="rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#22d3ee,_#0ea5e9)] px-4 py-2 text-xs font-semibold text-zinc-900 shadow-md shadow-emerald-200/40 transition hover:scale-[1.01]"
              >
                Open Dev Import
              </Link>
              <Link
                href="/browse-programs"
                className="rounded-full border border-emerald-200/80 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400/40 dark:text-emerald-200 dark:hover:bg-emerald-500/10"
              >
                View Programs
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-md shadow-emerald-200/30 dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Programs Live
              </p>
              <p className="mt-3 text-2xl font-semibold">{metrics.programs}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Shared catalog entries
              </p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-md shadow-cyan-200/30 dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Shortlists
              </p>
              <p className="mt-3 text-2xl font-semibold">{metrics.shortlists}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Total rows across users
              </p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-md shadow-purple-200/30 dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Tracker Entries
              </p>
              <p className="mt-3 text-2xl font-semibold">{metrics.tracker}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Applications in flight
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200/60 bg-white/80 p-6 shadow-sm dark:border-emerald-400/30 dark:bg-white/5">
              <h3 className="text-base font-semibold">Traffic pulse</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Connect analytics to unlock live traffic, retention, and funnels.
              </p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                <div className="h-full w-1/3 rounded-full bg-emerald-400" />
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-200/60 bg-white/80 p-6 shadow-sm dark:border-cyan-400/30 dark:bg-white/5">
              <h3 className="text-base font-semibold">Feature flags</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Upcoming: toggle beta dashboards and experiment visibility.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Dev access active
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
