"use client";
import { useNotifications } from "@/components/NotificationProvider";
import ApplicationStatusOptions from "@/components/ApplicationStatusOptions";
import { normalizeApplicationStatus } from "@/lib/applicationStatus";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { supabase } from "@/lib/supabaseClient";

type Shortlist = {
  id: string;
  university_name: string;
  course_name: string;
  deadline: string | null;
  status: string | null;
};

type Tracker = {
  id: string;
  university_name: string;
  course_name: string;
  status: string;
};



export default function DashboardPage() {
  const { notify } = useNotifications();
  const [shortlisted, setShortlisted] = useState<Shortlist[]>([]);
  const [tracker, setTracker] = useState<Tracker[]>([]);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    // Fetch shortlist and tracker from Supabase
    const fetchData = async () => {
      setLoading(true);
      setLoadError(null);
      try {
      const { data: shortlistedData, error: queryError } = await supabase
        .from("shortlists")
        .select("id, university_name, course_name, deadline, status")
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      setShortlisted(shortlistedData ?? []);
      // For demo, tracker mirrors shortlist with status
      setTracker(
        (shortlistedData ?? []).map((item: Shortlist) => ({
          id: item.id,
          university_name: item.university_name,
          course_name: item.course_name,
          status: item.status || "Shortlisted",
        }))
      );
      } catch {
        setLoadError("Could not load your dashboard. Please retry.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [loadAttempt]);

  // Tracker status change
  const handleTrackerStatus = async (id: string, status: string) => {
    setStatusError(null);
    const { data, error } = await supabase.from("shortlists").update({ status }).eq("id", id).select("id");
    if (error || !data?.length) {
      setStatusError("Could not save application status. Please retry.");
      return;
    }
    const changed = tracker.find(item => item.id === id);
    if (changed && changed.status !== status) notify(`${changed.university_name} — ${changed.course_name}: status changed to ${status}.`);
    setTracker((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );
  };

  const { firstName } = useUser();
  return (
    <div className="app-page mx-auto w-full max-w-6xl px-6 py-12">
      {/* Fun greeting if logged in */}
      {firstName && (
        <div className="mb-2">
          <span className="inline-block text-2xl md:text-3xl font-extrabold bg-surface text-ink drop-shadow-sm">
            Hi {firstName}!
          </span>
          <span className="ml-2 text-lg md:text-xl font-bold text-accent-ink">👋</span>
        </div>
      )}
      <p className="page-eyebrow">YOUR GERMANY WORKSPACE</p>
      <h1 className="text-3xl font-semibold">Your Dashboard</h1>
      <p className="mt-2 text-sm text-muted">
        Track your shortlisted universities, document checklists, and application milestones.
      </p>

      {statusError && <p role="alert">{statusError}</p>}
      <div className="dashboard-grid mt-8 grid gap-6">
        {/* My Shortlist - now interactive */}
        <section
          className="relative rounded-xl border bg-surface p-6 flex flex-col transition-all duration-200 cursor-pointer group border-line shadow-sm hover:scale-[1.03] focus:scale-[1.03] hover:shadow-[0_0_24px_0_rgba(34,211,238,0.18),0_1.5px_8px_0_rgba(16,185,129,0.10)] focus:shadow-[0_0_24px_0_rgba(34,211,238,0.18),0_1.5px_8px_0_rgba(16,185,129,0.10)]"
          tabIndex={0}
          role="button"
          aria-label="Open My Shortlist"
          onClick={() => window.location.href = '/dashboard/my-shortlist'}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.href = '/dashboard/my-shortlist'; }}
        >
          <h2 className="text-lg font-semibold mb-4">My Shortlist</h2>
          {loading ? (
            <div>Loading...</div>
          ) : loadError ? (<div role="alert" className="rounded-xl border border-red-300 p-4"><p>{loadError}</p><button type="button" className="mt-2 rounded border px-3 py-2" onClick={() => setLoadAttempt(attempt => attempt + 1)}>Retry</button></div>) : shortlisted.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-muted">
              No shortlisted universities yet.
            </div>
          ) : (
            <>
              {shortlisted.slice(0, 4).map((item) => (
                <div key={item.id} className="flex flex-col gap-2 border-b border-line py-2 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{item.university_name}</div>
                      <div className="text-xs text-muted">{item.course_name}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted">Deadline: {item.deadline ?? "TBD"}</div>
                </div>
              ))}
              {shortlisted.length > 4 && (
                <div className="flex justify-end mt-2">
                  <span className="text-xs px-2 py-1 rounded bg-accent-soft text-accent-ink border border-line" style={{ fontSize: '12px' }}>
                    +{shortlisted.length - 4} more
                  </span>
                </div>
              )}
            </>
          )}
        </section>

        <section className="rounded-xl border border-line p-6">
          <h2 className="text-lg font-semibold">Document checklist</h2>
          <p className="mt-2 text-sm">Track which documents you have prepared in My Tracker. File uploads and document storage are not available.</p>
          <a href="/dashboard/my-tracker" className="mt-3 inline-block underline">Open document checklist</a>
        </section>

        {/* My Tracker */}
        {/* My Expense Calculator Tab */}
                <a
                  href="/dashboard/expense-calculator"
                  className="rounded-xl border border-line bg-surface p-6 shadow-sm dark:shadow-none transition hover:scale-[1.03] hover:"
                  style={{ display: 'block', textDecoration: 'none' }}
                >
                  <h2 className="text-lg font-semibold mb-4">My Expense Calculator</h2>
                  <div className="text-sm text-muted">Track and add your study abroad expenses.</div>
                </a>
        <a
          href="/dashboard/my-tracker"
          className="rounded-xl border border-line bg-surface p-6 shadow-sm dark:shadow-none flex flex-col transition hover:scale-[1.03] hover: cursor-pointer"
          style={{ textDecoration: 'none' }}
        >
          <h2 className="text-lg font-semibold mb-4">My Tracker</h2>
          {loading ? (
            <div>Loading...</div>
          ) : loadError ? (<p>Application data could not be loaded. Use Retry above.</p>) : tracker.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-muted">
              No applications to track yet.
            </div>
          ) : (
            <>
              {tracker.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-line py-2 last:border-b-0">
                  <div>
                    <div className="font-semibold">{item.university_name}</div>
                    <div className="text-xs text-muted">{item.course_name}</div>
                  </div>
                  <select
                    value={normalizeApplicationStatus(item.status)}
                    onClick={e => e.stopPropagation()}
                    onChange={(e) => handleTrackerStatus(item.id, e.target.value)}
                    className="rounded-xl border border-line bg-surface px-2 py-1 text-xs text-ink shadow-sm outline-none transition focus:border-accent-ink"
                  >
                    <ApplicationStatusOptions value={item.status} />
                  </select>
                </div>
              ))}
              {tracker.length > 4 && (
                <div className="flex justify-end mt-2">
                  <span
                    className="text-xs px-2 py-1 rounded bg-accent-soft text-accent-ink border border-line"
                    style={{ fontSize: '12px', pointerEvents: 'none' }}
                  >
                    See more
                  </span>
                </div>
              )}
            </>
          )}
        </a>
      </div>
    </div>
  );
}
