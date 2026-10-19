"use client";
import { useState } from "react";
import { useAccountData } from "@/lib/accountData";
import { emptyProfile, isProfile } from "@/lib/profile";
import FeedbackBox from "@/components/FeedbackBox";

export default function MyProfilePage() {
  const { value: profile, setValue, save, loading, saving, error, ready, dirty } = useAccountData("profile", emptyProfile, isProfile);
  const [saved, setSaved] = useState(false);
  const { firstName, lastName, programInterest, qualification, englishTest, aptitudeTest } = profile;
  function update(field: keyof typeof profile, value: string) {
    setSaved(false);
    setValue(prev => ({ ...prev, [field]: value }));
  }
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    if (await save()) setSaved(true);
  };

  return (
    <div className="app-page mx-auto w-full max-w-2xl px-6 py-12">
      <p className="page-eyebrow">YOUR DETAILS</p>
      <h1 className="text-3xl font-semibold">My Profile</h1>
      <p className="mt-2 text-sm text-muted">
        Manage your personal details and study preferences.
      </p>

      {loading && <p role="status">Loading your profile…</p>}
      {error && <p role="alert">{error}</p>}
      <form
        className="mt-8 space-y-6 rounded-xl border border-line bg-surface p-8 shadow-sm dark:shadow-none"
        onSubmit={handleSave}
      >
        <fieldset disabled={!ready || saving} className="border-0 p-0 min-w-0">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted mb-2">
              First Name
            </label>
            <input
              type="text"
              id="firstName" value={firstName}
              onChange={e => update("firstName", e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-base text-ink shadow-sm outline-none transition focus:border-accent-ink"
              placeholder="Enter first name"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted mb-2">
              Last Name
            </label>
            <input
              type="text"
              id="lastName" value={lastName}
              onChange={e => update("lastName", e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-base text-ink shadow-sm outline-none transition focus:border-accent-ink"
              placeholder="Enter last name"
            />
          </div>
          <div>
            <label htmlFor="programInterest" className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted mb-2">
              Which program are you interested in?
            </label>
            <select
              id="programInterest" value={programInterest}
              onChange={e => update("programInterest", e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-base text-ink shadow-sm outline-none transition focus:border-accent-ink"
            >
              <option value="">Select</option>
              <option value="bachelors">Bachelors</option>
              <option value="masters">Masters</option>
            </select>
          </div>
          <div>
            <label htmlFor="qualification" className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted mb-2">
              Your highest qualification
            </label>
            <select
              id="qualification" value={qualification}
              onChange={e => update("qualification", e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-base text-ink shadow-sm outline-none transition focus:border-accent-ink"
            >
              <option value="">Select</option>
              <option value="12th">12th pass</option>
              <option value="graduate">Graduate</option>
            </select>
          </div>
          <div>
            <label htmlFor="englishTest" className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted mb-2">
              Have you taken any English tests?
            </label>
            <select
              id="englishTest" value={englishTest}
              onChange={e => update("englishTest", e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-base text-ink shadow-sm outline-none transition focus:border-accent-ink"
            >
              <option value="">Select</option>
              <option value="ielts">IELTS</option>
              <option value="toefl">TOEFL</option>
              <option value="duolingo">Duolingo</option>
            </select>
          </div>
          <div>
            <label htmlFor="aptitudeTest" className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted mb-2">
              Have you given any aptitude test?
            </label>
            <select
              id="aptitudeTest" value={aptitudeTest}
              onChange={e => update("aptitudeTest", e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-base text-ink shadow-sm outline-none transition focus:border-accent-ink"
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
            className="rounded-full ga-primary px-6 py-2 text-base font-semibold text-ink shadow-sm transition hover:scale-[1.01] disabled:opacity-60"
            disabled={!dirty || saving || !ready}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {saved && !dirty && ready && (
            <span role="status" className="text-accent-ink text-sm font-medium">Saved!</span>
          )}
        </div>
        </fieldset>
      </form>

      {/* Dev dashboard removed: was referencing missing isDev variable. */}
      {/* Feedback Section */}
      <FeedbackBox />
    </div>
  );
}
