"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";


type ShortlistItem = {
  id: string;
  university_name: string;
  course_name: string;
  status: string;
};

const HARDCODED_DOCS: string[] = [
  "Passport",
  "APS",
  "IELTS",
  "GMAT",
  "LOR",
  "Transcript",
];



export default function MyTrackerPage() {
  const [tracker, setTracker] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // docStatus: { [univId: string]: { [doc: string]: boolean } }
  const [docStatus, setDocStatus] = useState<Record<string, Record<string, boolean>>>({});
  const [customDocs, setCustomDocs] = useState<string[]>([]);
  const [newDoc, setNewDoc] = useState<string>("");
  // For syncing with shortlist
  const [shortlisted, setShortlisted] = useState<ShortlistItem[]>([]);

  // Fetch shortlist and sync tracker
  useEffect(() => {
    const fetchShortlist = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("shortlists")
        .select("id, university_name, course_name, status")
        .order("created_at", { ascending: false });
      setShortlisted(data ?? []);
      setLoading(false);
    };
    fetchShortlist();
  }, []);

  // Sync tracker and docStatus with shortlisted
  useEffect(() => {
    setTracker(shortlisted);
    // Remove docStatus for removed unis, add for new unis
    setDocStatus(prev => {
      const updated: Record<string, Record<string, boolean>> = {};
      shortlisted.forEach((item) => {
        updated[item.id] = prev[item.id] || {};
        [...HARDCODED_DOCS, ...customDocs].forEach((doc) => {
          if (typeof updated[item.id][doc] !== "boolean") updated[item.id][doc] = false;
        });
      });
      return updated;
    });
  }, [shortlisted, customDocs]);

  return (
    <main
      className="max-w-7xl mx-auto p-8 min-h-screen relative"
      style={{
        background:
          'linear-gradient(135deg, #f0f9ff 0%, #f9f7ff 40%, #ffe6fa 100%)',
        backgroundImage:
          'repeating-linear-gradient(135deg, rgba(0,0,0,0.02) 0 2px, transparent 2px 40px), linear-gradient(135deg, #f0f9ff 0%, #f9f7ff 40%, #ffe6fa 100%)',
        // Only apply in light mode
        filter: 'brightness(1.03) saturate(1.15)',
      }}
      data-genz-bg
    >
      <h1 className="text-3xl font-extrabold mb-8 tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">My Tracker</h1>
      {loading ? (
        <div className="text-lg font-semibold animate-pulse">Loading...</div>
      ) : shortlisted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/20 bg-white/60 p-6 text-lg text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300 shadow-lg">
          No applications to track yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="rounded-3xl shadow-2xl border border-black/10 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-black p-8 animate-fade-in">
            <table className="min-w-full border-separate border-spacing-y-2 align-top">
              <thead>
                <tr>
                  <th className="p-3 border-b-2 text-left align-bottom text-lg font-bold text-zinc-700 dark:text-zinc-200">Docs</th>
                  {shortlisted.map((item) => (
                    <th key={item.id} className="p-3 border-b-2 text-center align-bottom">
                      <div className="flex flex-col items-center gap-2">
                        <select
                          value={item.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            await supabase.from("shortlists").update({ status: newStatus }).eq("id", item.id);
                            setTracker((prev) => prev.map((t) => t.id === item.id ? { ...t, status: newStatus } : t));
                            setShortlisted((prev) => prev.map((t) => t.id === item.id ? { ...t, status: newStatus } : t));
                          }}
                          className={
                            `rounded-xl px-3 py-1 text-xs font-bold shadow-md outline-none transition mb-1 ` +
                            (item.status === "Shortlisted" ? "bg-gradient-to-r from-emerald-200 to-emerald-400 text-emerald-900 border-emerald-300" :
                              item.status === "Applied" ? "bg-gradient-to-r from-cyan-200 to-cyan-400 text-cyan-900 border-cyan-300" :
                              item.status === "Accepted" ? "bg-gradient-to-r from-green-200 to-green-400 text-green-900 border-green-300" :
                              item.status === "Rejected" ? "bg-gradient-to-r from-rose-200 to-rose-400 text-rose-900 border-rose-300" :
                              "bg-white border-black/10 text-zinc-900")
                          }
                          style={{ minWidth: 110, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)' }}
                        >
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Applied">Applied</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        <div className="font-semibold whitespace-normal text-center text-base" style={{ minWidth: 140 }}>{item.university_name}</div>
                        <div className="text-xs text-zinc-500 whitespace-normal text-center" style={{ minWidth: 140 }}>{item.course_name}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...HARDCODED_DOCS, ...customDocs].map((doc, i) => (
                  <tr key={doc} className={i % 2 === 0 ? 'bg-white/80 dark:bg-zinc-900/60' : 'bg-emerald-50/60 dark:bg-zinc-800/40'}>
                    <td className="p-3 font-semibold text-right align-middle flex items-center gap-2 text-zinc-700 dark:text-zinc-200 text-base">
                      {doc}
                      {customDocs.includes(doc) && (
                        <button
                          className="ml-1 text-xs text-red-500 hover:text-red-700 font-bold px-1"
                          onClick={() => {
                            setCustomDocs((prev) => prev.filter((d) => d !== doc));
                            setDocStatus((prev) => {
                              const updated: Record<string, Record<string, boolean>> = {};
                              Object.keys(prev).forEach((univId) => {
                                updated[univId] = { ...prev[univId] };
                                delete updated[univId][doc];
                              });
                              return updated;
                            });
                          }}
                          aria-label={`Delete ${doc}`}
                        >
                          ✕
                        </button>
                      )}
                    </td>
                    {shortlisted.map((item) => (
                      <td key={item.id + doc} className="p-3 text-center align-middle">
                        <div className="flex justify-center items-center">
                          <button
                            className={`w-8 h-8 rounded-full border-2 border-zinc-300 flex items-center justify-center transition-colors shadow-md hover:scale-110 ${docStatus[item.id]?.[doc] ? 'bg-gradient-to-br from-green-300 to-emerald-400 border-green-600 shadow-lg' : 'bg-white hover:bg-emerald-50'}`}
                            onClick={() => {
                              setDocStatus((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  [doc]: !prev[item.id]?.[doc],
                                },
                              }));
                            }}
                            aria-label={`Toggle ${doc} for ${item.university_name}`}
                          >
                            {docStatus[item.id]?.[doc] && (
                              <span className="block w-5 h-5 rounded-full bg-green-700 shadow-inner" />
                            )}
                          </button>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Add new doc row */}
                <tr>
                  <td className="p-3 font-semibold text-right align-middle bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-zinc-900 dark:to-zinc-800">
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        if (!newDoc.trim() || HARDCODED_DOCS.includes(newDoc.trim()) || customDocs.includes(newDoc.trim())) return;
                        setCustomDocs(prev => [...prev, newDoc.trim()]);
                        setDocStatus(prev => {
                          const updated = { ...prev };
                          tracker.forEach(item => {
                            updated[item.id] = { ...updated[item.id], [newDoc.trim()]: false };
                          });
                          return updated;
                        });
                        setNewDoc("");
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={newDoc}
                        onChange={e => setNewDoc(e.target.value)}
                        placeholder="Add doc..."
                        className="border-2 border-emerald-300 rounded px-3 py-1 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition w-28"
                      />
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white rounded px-3 py-1 text-sm font-bold shadow-md transition"
                        aria-label="Add doc"
                      >
                        ✓
                      </button>
                    </form>
                  </td>
                  {shortlisted.map((item) => (
                    <td key={item.id + 'add-doc'} className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-zinc-900 dark:to-zinc-800" />
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
