"use client";
import { checklistDrafts } from "@/lib/checklistDraft";
import ApplicationStatusOptions from "@/components/ApplicationStatusOptions";
import { normalizeApplicationStatus } from "@/lib/applicationStatus";
import React, { useEffect, useState } from "react";
import { FaPassport, FaCertificate, FaGlobe, FaFileAlt, FaUserGraduate } from "react-icons/fa";
import { getProgramLevel } from "@/lib/programLevel";
import { supabase } from "@/lib/supabaseClient";


type ShortlistItem = {
  id: string;
  university_name: string;
  course_name: string;
  status: string;
  program_level?: string | null; // 'bachelor' | 'master' | undefined
};

const DEFAULT_MANDATORY_DOCS: { label: string; icon: React.ReactElement }[] = [
  { label: "Passport", icon: <FaPassport className="text-emerald-400 text-lg" /> },
  { label: "APS", icon: <FaCertificate className="text-cyan-400 text-lg" /> },
  { label: "IELTS", icon: <FaGlobe className="text-fuchsia-400 text-lg" /> },
  { label: "LOR", icon: <FaUserGraduate className="text-amber-400 text-lg" /> },
  { label: "Transcript", icon: <FaFileAlt className="text-blue-400 text-lg" /> },
];
const UNI_DOCS: string[] = ["GMAT"];



export default function MyTrackerPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [tracker, setTracker] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // docStatus: { [univId: string]: { [doc: string]: boolean } }
  const [docStatus, setDocStatus] = useState<Record<string, Record<string, boolean>>>({});
  const [customDocs, setCustomDocs] = useState<string[]>([]);
  const [newDoc, setNewDoc] = useState<string>("");
  // Global mandatory docs
  const [mandatoryStatus, setMandatoryStatus] = useState<Record<string, boolean>>({});
  const [customMandatoryDocs, setCustomMandatoryDocs] = useState<string[]>([]);
  const [newMandatoryDoc, setNewMandatoryDoc] = useState<string>("");
  // For syncing with shortlist
  const [shortlisted, setShortlisted] = useState<ShortlistItem[]>([]);
  const [programLevel, setProgramLevel] = useState<string>("all"); // 'all' | 'bachelor' | 'master'

  // Fetch shortlist and sync tracker
  useEffect(() => {
    const fetchShortlist = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user) throw new Error("Sign in required");
        const { data: preferences, error: preferencesError } = await supabase
          .from("tracker_preferences")
          .select("doc_status, custom_docs, mandatory_status, custom_mandatory_docs")
          .eq("user_id", auth.user.id)
          .maybeSingle();
        if (preferencesError) throw preferencesError;
        const draft = checklistDrafts.get(auth.user.id);
        setUserId(auth.user.id);
        setDirty(!!draft);
        setNewDoc(draft?.newDoc ?? "");
        setNewMandatoryDoc(draft?.newMandatoryDoc ?? "");
        setSaveMessage(draft ? "Restored your unsaved checklist changes." : null);
        setDocStatus(draft?.docStatus ?? preferences?.doc_status ?? {});
        setCustomDocs(draft?.customDocs ?? preferences?.custom_docs ?? []);
        setMandatoryStatus(draft?.mandatoryStatus ?? preferences?.mandatory_status ?? {});
        setCustomMandatoryDocs(draft?.customMandatoryDocs ?? preferences?.custom_mandatory_docs ?? []);
        const { data, error } = await supabase
          .from("shortlists")
          .select("id, university_name, course_name, status, program_level")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setShortlisted(data ?? []);
        setTracker(data ?? []);
      } catch {
        setError("Could not load your tracker. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchShortlist();
  }, [loadAttempt]);

  useEffect(() => {
    if (!userId || loading || error || !dirty) return;
    checklistDrafts.set(userId, { docStatus, customDocs, mandatoryStatus, customMandatoryDocs, newDoc, newMandatoryDoc });
  }, [userId, loading, error, dirty, docStatus, customDocs, mandatoryStatus, customMandatoryDocs, newDoc, newMandatoryDoc]);

  useEffect(() => {
    if (!dirty) return;
    const guardLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.pathname === window.location.pathname && destination.search === window.location.search && destination.origin === window.location.origin) return;
      if (!window.confirm("Your checklist has unsaved changes. Leave this page? Choose Cancel to stay and save.")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", guardLink, true);
    return () => document.removeEventListener("click", guardLink, true);
  }, [dirty]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  async function saveChecklist() {
    if (!userId || saving) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user?.id !== userId) throw new Error("Account changed");
      const { error } = await supabase.from("tracker_preferences").upsert({
        user_id: userId,
        doc_status: docStatus,
        custom_docs: customDocs,
        mandatory_status: mandatoryStatus,
        custom_mandatory_docs: customMandatoryDocs,
      }, { onConflict: "user_id" });
      if (error) throw error;
      checklistDrafts.delete(userId);
      setDirty(false);
      setSaveMessage("Checklist saved.");
    } catch {
      setSaveMessage("Could not save your checklist. Your changes are still here; please retry.");
    } finally {
      setSaving(false);
    }
  }
  const visiblePrograms = shortlisted.filter((item) =>
    programLevel === "all" || getProgramLevel(item) === programLevel
  );
  const unknownCount = shortlisted.filter((item) => getProgramLevel(item) === null).length;
  return (
    <main
      className="max-w-7xl mx-auto p-3 sm:p-8 min-h-screen relative"
      style={{
        background:
          'linear-gradient(135deg, #f0f9ff 0%, #f9f7ff 40%, #ffe6fa 100%)',
        backgroundImage:
          'repeating-linear-gradient(135deg, rgba(0,0,0,0.02) 0 2px, transparent 2px 40px), linear-gradient(135deg, #f0f9ff 0%, #f9f7ff 40%, #ffe6fa 100%)',
        filter: 'brightness(1.03) saturate(1.15)',
      }}
      data-genz-bg
    >
      <h1 className="text-3xl font-extrabold mb-8 tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">My Tracker</h1>
      {loading ? (
        <div className="flex items-center gap-2 text-lg font-semibold animate-pulse" role="status" aria-live="polite">
          <svg className="animate-spin h-6 w-6 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
          Loading your tracker...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/60 p-6 text-lg text-rose-700 dark:text-rose-200 shadow-lg flex items-center gap-2">
          <svg className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
          <div role="alert">{error}<button type="button" className="ml-3 rounded border px-3 py-2" onClick={() => setLoadAttempt(attempt => attempt + 1)}>Retry</button></div>
        </div>
      ) : shortlisted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/20 bg-white/60 p-6 text-lg text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300 shadow-lg">
          No applications to track yet.
        </div>
      ) : (
        <>
          {/* Program Level Filter */}
          <div className="mb-6 flex flex-wrap gap-2 sm:gap-4">
            <button
              className={`px-4 py-2 rounded-full font-bold border-2 transition-colors duration-150 ${programLevel === "all" ? "bg-emerald-500 text-white border-emerald-500" : "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
              onClick={() => setProgramLevel("all")}
              aria-pressed={programLevel === "all"}
            >
              All
            </button>
            <button
              className={`px-4 py-2 rounded-full font-bold border-2 transition-colors duration-150 ${programLevel === "bachelor" ? "bg-cyan-500 text-white border-cyan-500" : "bg-white border-cyan-200 text-cyan-700 hover:bg-cyan-50"}`}
              onClick={() => setProgramLevel("bachelor")}
              aria-pressed={programLevel === "bachelor"}
            >
              Bachelor’s
            </button>
            <button
              className={`px-4 py-2 rounded-full font-bold border-2 transition-colors duration-150 ${programLevel === "master" ? "bg-fuchsia-500 text-white border-fuchsia-500" : "bg-white border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-50"}`}
              onClick={() => setProgramLevel("master")}
              aria-pressed={programLevel === "master"}
            >
              Master’s
            </button>
          </div>
        {unknownCount > 0 && (
          <p className="mb-4 text-sm">{unknownCount} saved program(s) have an unknown degree level and appear under All.</p>
        )}
        <div className="mb-4 flex items-center gap-4">
          <button type="button" onClick={saveChecklist} disabled={saving || !dirty}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-50">
            {saving ? "Saving…" : "Save checklist"}
          </button>
          <p role="status">{saveMessage ?? (dirty ? "Unsaved checklist changes" : "Checklist loaded")}</p>
        </div>
        <fieldset disabled={saving} className="flex w-full flex-col lg:flex-row gap-6 items-start border-0 p-0 min-w-0"
          onChange={() => { setDirty(true); setSaveMessage(null); }}>

          {/* Mandatory Docs Checklist */}
          <div className="w-full min-w-0 lg:max-w-xs lg:shrink-0 rounded-3xl border border-emerald-200 bg-white/80 dark:bg-zinc-900/95 shadow-2xl p-7 backdrop-blur-md" role="region" aria-label="Mandatory Documents Checklist"
            style={{ boxShadow: '0 8px 32px 0 rgba(34,197,94,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.04)' }}>
            <h2 className="text-xl font-extrabold mb-5 text-emerald-500 dark:text-emerald-300 tracking-wide drop-shadow-sm">Mandatory Documents</h2>
            <ul className="space-y-4 mb-3" role="list">
              {DEFAULT_MANDATORY_DOCS.map((doc) => (
                <li key={doc.label} className="flex items-center gap-4 group transition-all duration-150 hover:bg-emerald-50/60 dark:hover:bg-zinc-800/60 rounded-xl px-2 py-1" role="listitem">
                  <span className="transition-transform group-hover:scale-110">{doc.icon}</span>
                  <input
                    type="checkbox"
                    id={`mandatory-${doc.label}`}
                    checked={!!mandatoryStatus[doc.label]}
                    onChange={() => setMandatoryStatus((prev) => ({ ...prev, [doc.label]: !prev[doc.label] }))}
                    className="w-6 h-6 accent-emerald-500 rounded-lg border-2 border-emerald-300 focus:ring-4 focus:ring-emerald-300/40 transition-all duration-200 shadow-md group-hover:ring-2 group-hover:ring-emerald-200 bg-white dark:bg-zinc-900 focus:outline-emerald-500 focus:outline-2"
                    aria-label={`Mark ${doc.label} as complete`}
                  />
                  <label htmlFor={`mandatory-${doc.label}`} className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 cursor-pointer group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200 focus-visible:text-emerald-700 dark:focus-visible:text-emerald-300 outline-none" tabIndex={0} onKeyDown={e => {if(e.key==='Enter'){setDirty(true);setSaveMessage(null);setMandatoryStatus(prev=>({...prev,[doc.label]:!prev[doc.label]}));}}}>
                    {doc.label}
                  </label>
                </li>
              ))}
              {customMandatoryDocs.map((doc) => (
                <li key={doc} className="flex items-center gap-4 group transition-all duration-150 hover:bg-emerald-50/60 dark:hover:bg-zinc-800/60 rounded-xl px-2 py-1" role="listitem">
                  <span className="transition-transform group-hover:scale-110 text-xl">📄</span>
                  <input
                    type="checkbox"
                    id={`mandatory-${doc}`}
                    checked={!!mandatoryStatus[doc]}
                    onChange={() => setMandatoryStatus((prev) => ({ ...prev, [doc]: !prev[doc] }))}
                    className="w-6 h-6 accent-emerald-500 rounded-lg border-2 border-emerald-300 focus:ring-4 focus:ring-emerald-300/40 transition-all duration-200 shadow-md group-hover:ring-2 group-hover:ring-emerald-200 bg-white dark:bg-zinc-900 focus:outline-emerald-500 focus:outline-2"
                    aria-label={`Mark ${doc} as complete`}
                  />
                  <label htmlFor={`mandatory-${doc}`} className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 cursor-pointer group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200 focus-visible:text-emerald-700 dark:focus-visible:text-emerald-300 outline-none" tabIndex={0} onKeyDown={e => {if(e.key==='Enter'){setDirty(true);setSaveMessage(null);setMandatoryStatus(prev=>({...prev,[doc]:!prev[doc]}));}}}>
                    {doc}
                  </label>
                  <button
                    type="button"
                    className="ml-2 text-red-500 hover:text-white hover:bg-red-500 text-base font-bold px-1 rounded transition-all duration-150 focus:outline-emerald-500 focus:outline-2"
                    onClick={() => {
                      if(window.confirm('Are you sure you want to remove this document?')){
                        setDirty(true); setSaveMessage(null);
                        setCustomMandatoryDocs((prev) => prev.filter((d) => d !== doc));
                        setMandatoryStatus((prev) => {
                          const updated = { ...prev };
                          delete updated[doc];
                          return updated;
                        });
                      }
                    }}
                    aria-label={`Remove ${doc}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <form
              className="flex gap-2 mt-2"
              onSubmit={e => {
                e.preventDefault();
                const doc = newMandatoryDoc.trim();
                if (!doc || DEFAULT_MANDATORY_DOCS.some(d => d.label === doc) || customMandatoryDocs.includes(doc)) return;
                setDirty(true); setSaveMessage(null);
                setCustomMandatoryDocs(prev => [...prev, doc]);
                setMandatoryStatus(prev => ({ ...prev, [doc]: false }));
                setNewMandatoryDoc("");
              }}
            >
              <input
                type="text"
                value={newMandatoryDoc}
                onChange={e => setNewMandatoryDoc(e.target.value)}
                placeholder="Add document..."
                className="flex-1 rounded-lg border border-emerald-300 px-3 py-1 text-base bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                maxLength={32}
              />
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 hover:bg-emerald-600 focus-visible:ring-4 focus-visible:ring-emerald-300/40 text-white font-bold px-4 py-1 transition-all duration-150"
              >
                Add
              </button>
            </form>
          </div>
          {/* University-wise Tracker Table */}
          <div className="w-full min-w-0 flex-1 overflow-x-auto" role="region" aria-label="University document tracker" tabIndex={0}>
            <div className="rounded-3xl shadow-2xl border border-black/10 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-black p-3 sm:p-8 animate-fade-in"
              style={{ boxShadow: '0 8px 32px 0 rgba(16,185,129,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.04)' }}>
              <table className="min-w-full border-separate border-spacing-y-2 align-top">
                <thead>
                  <tr>
                    <th className="p-3 border-b-2 text-left align-bottom text-lg font-bold text-zinc-700 dark:text-zinc-200">Docs</th>
                    {visiblePrograms.map((item) => (
                      <th key={item.id} className="p-3 border-b-2 text-center align-top">
                        <div className="flex flex-col items-center gap-2 min-h-[120px]">
                          <div className="w-full flex justify-center" style={{ minHeight: 0 }}>
                            <select
                              value={normalizeApplicationStatus(item.status)}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                const { error } = await supabase.from("shortlists").update({ status: newStatus }).eq("id", item.id).eq("user_id", userId!);
                                if (error) { setSaveMessage("Could not save application status. Please retry."); return; }
                                setTracker((prev) => prev.map((t) => t.id === item.id ? { ...t, status: newStatus } : t));
                                setShortlisted((prev) => prev.map((t) => t.id === item.id ? { ...t, status: newStatus } : t));
                              }}
                              className={
                                `rounded-full px-4 py-1 text-xs font-bold shadow-md outline-none transition mb-2 mt-1 border-2 ` +
                                (item.status === "Shortlisted" ? "bg-emerald-400 text-white border-emerald-400 dark:bg-emerald-600 dark:border-emerald-600" :
                                  item.status === "Applied" ? "bg-cyan-400 text-white border-cyan-400 dark:bg-cyan-600 dark:border-cyan-600" :
                                  normalizeApplicationStatus(item.status) === "Accepted" ? "bg-green-500 text-white border-green-500 dark:bg-green-700 dark:border-green-700" :
                                  item.status === "Rejected" ? "bg-rose-400 text-white border-rose-400 dark:bg-rose-600 dark:border-rose-600" :
                                  "bg-white border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100")
                              }
                              style={{ minWidth: 110, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)' }}
                            >
                              <ApplicationStatusOptions value={item.status} />
                            </select>
                          </div>
                          <div className="rounded-2xl bg-white/90 dark:bg-zinc-900/95 shadow-lg px-3 py-4 w-full flex flex-col items-center border border-zinc-200 dark:border-zinc-800" style={{ minHeight: 80 }}>
                            <div className="font-bold whitespace-normal text-center text-base text-zinc-900 dark:text-zinc-100" style={{ minWidth: 140 }}>{item.university_name}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-300 whitespace-normal text-center mt-1" style={{ minWidth: 140 }}>{item.course_name}</div>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...UNI_DOCS, ...customDocs].map((doc, i) => (
                    <tr key={doc} className={i % 2 === 0 ? 'bg-white/90 dark:bg-zinc-900/80' : 'bg-emerald-50/80 dark:bg-zinc-800/60'}>
                      <td className="p-3 font-semibold text-right align-middle flex items-center gap-2 text-zinc-700 dark:text-zinc-100 text-base">
                        {doc}
                        {customDocs.includes(doc) && (
                          <button
                            className="ml-1 text-xs text-red-500 hover:text-red-700 font-bold px-1"
                            onClick={() => {
                              setDirty(true); setSaveMessage(null);
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
                      {visiblePrograms.map((item) => (
                        <td key={item.id + doc} className="p-3 text-center align-middle">
                          <div className="flex justify-center items-center">
                            <button
                              className={`w-9 h-9 rounded-full border-2 border-zinc-300 dark:border-zinc-700 flex items-center justify-center transition-all duration-200 shadow-md hover:scale-110 hover:border-emerald-400 hover:ring-2 hover:ring-emerald-100 ${docStatus[item.id]?.[doc] ? 'bg-gradient-to-br from-green-300 to-emerald-400 border-green-600 dark:from-green-700 dark:to-emerald-700 dark:border-green-700 shadow-lg scale-105' : 'bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-zinc-700'}`}
                              onClick={() => {
                                setDirty(true); setSaveMessage(null);
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
                                <span className="block w-6 h-6 rounded-full bg-green-700 dark:bg-green-500 shadow-inner scale-110 transition-all duration-200" />
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
                          if (!newDoc.trim() || UNI_DOCS.includes(newDoc.trim()) || customDocs.includes(newDoc.trim())) return;
                          setDirty(true); setSaveMessage(null);
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
                    {visiblePrograms.map((item) => (
                      <td key={item.id + 'add-doc'} className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-zinc-900 dark:to-zinc-800" />
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </fieldset>
        </>
      )}
    </main>
  );
}
