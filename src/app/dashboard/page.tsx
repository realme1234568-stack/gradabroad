"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { supabase } from "@/lib/supabaseClient";
import ExpenseCalculator from "../../dashboard/ExpenseCalculator";

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

const DOC_TYPES = ["Degree", "IELTS", "TOEFL", "APS Certificate"];

export default function DashboardPage() {
  const [shortlisted, setShortlisted] = useState<Shortlist[]>([]);
  const [tracker, setTracker] = useState<Tracker[]>([]);
  const [docs, setDocs] = useState<{ name: string; file?: File }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch shortlist and tracker from Supabase
    const fetchData = async () => {
      setLoading(true);
      // Removed user check: always load features
      const { data: shortlistedData } = await supabase
        .from("shortlists")
        .select("id, university_name, course_name, deadline, status")
        .order("created_at", { ascending: false });
      setShortlisted(shortlistedData ?? []);
      // For demo, tracker mirrors shortlist with status
      setTracker(
        (shortlistedData ?? []).map((item: any) => ({
          id: item.id,
          university_name: item.university_name,
          course_name: item.course_name,
          status: "Shortlisted",
        }))
      );
      setLoading(false);
    };
    fetchData();
  }, []);

  // Remove from shortlist and tracker
  const handleRemoveShortlist = async (id: string) => {
    setShortlisted((prev) => prev.filter((item) => item.id !== id));
    setTracker((prev) => prev.filter((item) => item.id !== id));
    await supabase.from("shortlists").delete().eq("id", id);
  };

  // Tracker status change
  const handleTrackerStatus = (id: string, status: string) => {
    setTracker((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );
    // TODO: Update tracker status in Supabase
  };

  // Docs upload
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocs((prev) => {
        const filtered = prev.filter((d) => d.name !== name);
        return [...filtered, { name, file }];
      });
    }
  };

  const { firstName } = useUser();
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      {/* Fun greeting if logged in */}
      {firstName && (
        <div className="mb-2 animate-bounce">
          <span className="inline-block text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-fuchsia-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
            Hi {firstName}!
          </span>
          <span className="ml-2 text-lg md:text-xl font-bold text-emerald-400 animate-wiggle">👋</span>
        </div>
      )}
      <h1 className="text-3xl font-semibold">Your Dashboard</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Track your shortlisted universities, documents, and application milestones.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-4">
        {/* My Shortlist - now interactive */}
        <section
          className="relative rounded-2xl border bg-white/80 p-6 flex flex-col transition-all duration-200 cursor-pointer group border-black/10 dark:border-white/10 shadow-xl hover:scale-[1.03] focus:scale-[1.03] hover:shadow-[0_0_24px_0_rgba(34,211,238,0.18),0_1.5px_8px_0_rgba(16,185,129,0.10)] focus:shadow-[0_0_24px_0_rgba(34,211,238,0.18),0_1.5px_8px_0_rgba(16,185,129,0.10)]"
          tabIndex={0}
          role="button"
          aria-label="Open My Shortlist"
          onClick={() => window.location.href = '/dashboard/my-shortlist'}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.href = '/dashboard/my-shortlist'; }}
          style={{ outline: 'none', borderImage: 'linear-gradient(90deg, #34d399, #22d3ee, #a21caf) 1', borderWidth: '1.5px' }}
        >
          <h2 className="text-lg font-semibold mb-4">My Shortlist</h2>
          {loading ? (
            <div>Loading...</div>
          ) : shortlisted.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/20 bg-white/60 p-4 text-sm text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300">
              No shortlisted universities yet.
            </div>
          ) : (
            <>
              {shortlisted.slice(0, 4).map((item) => (
                <div key={item.id} className="flex flex-col gap-2 border-b border-black/10 py-2 last:border-b-0 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{item.university_name}</div>
                      <div className="text-xs text-zinc-500">{item.course_name}</div>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-600">Deadline: {item.deadline ?? "TBD"}</div>
                </div>
              ))}
              {shortlisted.length > 4 && (
                <div className="flex justify-end mt-2">
                  <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 border border-emerald-200" style={{ fontSize: '12px' }}>
                    +{shortlisted.length - 4} more
                  </span>
                </div>
              )}
            </>
          )}
        </section>

        {/* My Docs */}
        <section className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-xl shadow-cyan-200/30 dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-none">
          <h2 className="text-lg font-semibold mb-4">My Docs</h2>
          <div className="space-y-3">
            {DOC_TYPES.map((doc) => (
              <div key={doc} className="flex flex-col md:flex-row md:items-center gap-2 w-full">
                <span className="text-xs font-semibold md:text-base md:font-bold break-words w-full md:w-32">{doc}</span>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full">
                  <label className="relative w-full md:w-auto overflow-hidden" style={{display:'inline-block'}}>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'not-allowed',
                        zIndex: 2,
                      }}
                      disabled
                      title="Document upload is temporarily disabled."
                    />
                    <span
                      className="block bg-white border border-black/20 rounded text-center cursor-not-allowed text-xs md:text-sm text-zinc-800 dark:text-white select-none opacity-60"
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        fontSize: '12.5px',
                        fontWeight: 700,
                        padding: '4px 0',
                        width: 120,
                        background: '#fff',
                        border: '1.5px solid #888',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                        transition: 'background 0.2s, color 0.2s',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        letterSpacing: 0.1,
                      }}
                    >
                      Choose File
                      <span className="ml-2 text-xs text-red-500">(Uploads disabled)</span>
                      <style jsx>{`
                        label input[type='file'] + span {
                          transition: background 0.2s, color 0.2s;
                        }
                        @media (prefers-color-scheme: dark) {
                          label input[type='file'] + span {
                            background: #23272f !important;
                            color: #fff !important;
                            border: 1.5px solid #fff2 !important;
                          }
                        }
                      `}</style>
                    </span>
                  </label>
                  {docs.find((d) => d.name === doc)?.file && (
                    <span className="text-xs text-emerald-600 truncate max-w-[120px] md:max-w-[180px] block">{docs.find((d) => d.name === doc)?.file?.name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* My Tracker */}
                {/* My Expense Calculator Tab */}
                <a
                  href="/dashboard/expense-calculator"
                  className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-xl shadow-pink-200/30 dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-none transition hover:scale-[1.03] hover:shadow-pink-400/40"
                  style={{ display: 'block', textDecoration: 'none' }}
                >
                  <h2 className="text-lg font-semibold mb-4">My Expense Calculator</h2>
                  <div className="text-sm text-zinc-600 dark:text-zinc-300">Track and add your study abroad expenses.</div>
                </a>
        <a
          href="/dashboard/my-tracker"
          className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-xl shadow-purple-200/30 dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-none flex flex-col transition hover:scale-[1.03] hover:shadow-purple-400/40 cursor-pointer"
          style={{ textDecoration: 'none' }}
        >
          <h2 className="text-lg font-semibold mb-4">My Tracker</h2>
          {loading ? (
            <div>Loading...</div>
          ) : tracker.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/20 bg-white/60 p-4 text-sm text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300">
              No applications to track yet.
            </div>
          ) : (
            <>
              {tracker.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-black/10 py-2 last:border-b-0 dark:border-white/10">
                  <div>
                    <div className="font-semibold">{item.university_name}</div>
                    <div className="text-xs text-zinc-500">{item.course_name}</div>
                  </div>
                  <select
                    value={item.status}
                    onClick={e => e.stopPropagation()}
                    onChange={(e) => handleTrackerStatus(item.id, e.target.value)}
                    className="rounded-xl border border-black/10 bg-white/80 px-2 py-1 text-xs text-zinc-900 shadow-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Applied">Applied</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              ))}
              {tracker.length > 4 && (
                <div className="flex justify-end mt-2">
                  <span
                    className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 border border-purple-200"
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
