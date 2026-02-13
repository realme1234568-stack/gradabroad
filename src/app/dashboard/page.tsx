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
        {/* My Shortlist */}
        <section className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-xl shadow-emerald-200/30 dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-none flex flex-col">
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
                    <button
                      className="ml-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                      onClick={() => handleRemoveShortlist(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="text-xs text-zinc-600">Deadline: {item.deadline ?? "TBD"}</div>
                </div>
              ))}
              {shortlisted.length > 4 && (
                <div className="flex justify-end mt-2">
                  <a
                    href="/dashboard/my-shortlist"
                    className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200"
                    style={{ fontSize: '12px' }}
                  >
                    See more
                  </a>
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
                  <label className="relative w-full md:w-auto">
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="w-full md:w-auto opacity-0 absolute left-0 top-0 h-full cursor-pointer"
                      onChange={(e) => handleDocUpload(e, doc)}
                    />
                    <span className="block bg-white border border-black/10 rounded px-3 py-1 cursor-pointer text-xs md:text-sm text-zinc-700 dark:text-zinc-200">
                      Choose File
                      <style jsx>{`
                        label input[type='file'] + span {
                          transition: background 0.2s, color 0.2s;
                        }
                        @media (prefers-color-scheme: dark) {
                          label input[type='file'] + span {
                            background: #23272f !important;
                            color: #fff !important;
                            border: 1px solid #fff2 !important;
                          }
                        }
                      `}</style>
                    </span>
                  </label>
                  {docs.find((d) => d.name === doc)?.file && (
                    <span className="text-xs text-emerald-600">{docs.find((d) => d.name === doc)?.file?.name}</span>
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
