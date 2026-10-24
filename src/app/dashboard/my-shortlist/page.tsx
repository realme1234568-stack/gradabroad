"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNotifications } from "@/components/NotificationProvider";
import ApplicationStatusOptions from "@/components/ApplicationStatusOptions";
import { applicationStatuses, normalizeApplicationStatus } from "@/lib/applicationStatus";
import { getProgramLevel } from "@/lib/programLevel";
import { supabase } from "@/lib/supabaseClient";
import { deadlineDays, deadlineLabel, emptyShortlistDraft, programWebsite, shortlistFields, validateShortlistDraft, type ShortlistDraft, type ShortlistItem } from "@/lib/shortlist";
import styles from "./shortlist.module.css";

type Editor = { previous?: ShortlistItem; initial: ShortlistDraft; values: ShortlistDraft };
const sameName = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

export default function MyShortlistPage() {
  const { notify } = useNotifications();
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [signedOut, setSignedOut] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("recent");
  const owner = useRef<string | null>(null);
  const accountIdentity = useRef<string | null>(null);
  const generation = useRef(0);
  const invalidate = useCallback(() => { generation.current++; }, []);
  const mutationBusy = useRef(false);
  const formHeading = useRef<HTMLHeadingElement>(null);
  const dirty = !!editor && JSON.stringify(editor.values) !== JSON.stringify(editor.initial);
  const editorId = editor?.previous?.id;
  const editorOpen = Boolean(editor);

  useEffect(() => {
    let active = true;
    const version = ++generation.current;
    async function load() {
      setLoading(true); setLoadError(null); setMessage(null); owner.current = null;
      try {
        const { data: account, error: authError } = await supabase.auth.getUser();
        if (!active || version !== generation.current) return;
        if (authError) throw authError;
        accountIdentity.current = account.user?.id ?? null;
        setSignedOut(!account.user);
        if (!account.user) { setShortlist([]); return; }
        const rows: ShortlistItem[] = [];
        for (let offset = 0; ; offset += 1000) {
          const { data, error } = await supabase.from("shortlists").select(shortlistFields)
            .eq("user_id", account.user.id).order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 999);
          if (!active || version !== generation.current) return;
          if (error || !Array.isArray(data)) throw error ?? new Error("Invalid shortlist response");
          rows.push(...data);
          if (data.length < 1000) break;
        }
        owner.current = account.user.id;
        setShortlist(rows);
      } catch {
        if (active && version === generation.current) setLoadError("Could not load your shortlist. Please retry.");
      } finally {
        if (active && version === generation.current) setLoading(false);
      }
    }
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id ?? null;
      if (!active || id === accountIdentity.current) return;
      invalidate(); accountIdentity.current = id; owner.current = null; mutationBusy.current = false;
      setShortlist([]); setEditor(null); setFormError(null); setActionError(null); setBusy(false); setConfirmRemove(null);
      setQuery(""); setLevel("all"); setStatus("all"); setSignedOut(!id); setLoading(true);
      setLoadAttempt(value => value + 1);
    });
    void load();
    return () => { active = false; invalidate(); subscription.subscription.unsubscribe(); };
  }, [loadAttempt, invalidate]);

  useEffect(() => { if (editorOpen) formHeading.current?.focus(); }, [editorId, editorOpen]);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const guardLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search) return;
      if (!window.confirm("Your program has unsaved changes. Leave without saving?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", beforeUnload); document.addEventListener("click", guardLink, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", guardLink, true); };
  }, [dirty]);

  function openEditor(item?: ShortlistItem) {
    if (busy || (dirty && !window.confirm("Discard your unsaved program changes?"))) return;
    const values: ShortlistDraft = item ? {
      university_name: item.university_name, course_name: item.course_name,
      program_level: getProgramLevel(item) ?? "", deadline: item.deadline ?? "",
      status: normalizeApplicationStatus(item.status), note: item.note ?? "", official_url: item.official_url ?? "",
    } : { ...emptyShortlistDraft };
    setEditor({ previous: item, initial: values, values }); setFormError(null); setMessage(null); setConfirmRemove(null);
  }
  function change(field: keyof ShortlistDraft, value: string) {
    setEditor(previous => previous ? { ...previous, values: { ...previous.values, [field]: value } } : null);
    setFormError(null);
  }
  function closeEditor() {
    if (!busy && (!dirty || window.confirm("Discard your unsaved program changes?"))) { setEditor(null); setFormError(null); }
  }
  async function checkActor(actor: string | null, version: number) {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw new Error("session-check-failed");
    if (!actor || data.user?.id !== actor || owner.current !== actor || generation.current !== version) throw new Error("session-changed");
    return actor;
  }
  function mutationFailed(error: unknown, fallback: string, version: number, inForm = false) {
    if (version !== generation.current) return;
    if (error instanceof Error && error.message === "session-changed") {
      generation.current++; owner.current = null; mutationBusy.current = false;
      setShortlist([]); setEditor(null); setBusy(false); setSignedOut(true);
      setActionError("Your sign-in changed. Sign in again before updating your shortlist.");
    } else if (inForm) setFormError(fallback);
    else setActionError(fallback);
  }
  async function saveProgram(event: React.FormEvent) {
    event.preventDefault();
    if (!editor || mutationBusy.current) return;
    let payload: ReturnType<typeof validateShortlistDraft>;
    try {
      payload = validateShortlistDraft(editor.values, editor.previous);
      if (shortlist.some(item => item.id !== editor.previous?.id && sameName(item.university_name) === sameName(editor.values.university_name) && sameName(item.course_name) === sameName(editor.values.course_name)))
        throw new Error("This university and program are already in your shortlist. Edit the existing entry instead.");
    } catch (error) { setFormError((error as Error).message); return; }
    const actor = owner.current, version = generation.current;
    mutationBusy.current = true; setBusy(true); setFormError(null); setActionError(null); setMessage(null);
    try {
      const userId = await checkActor(actor, version);
      const result = editor.previous
        ? await supabase.from("shortlists").update(payload).eq("id", editor.previous.id).eq("user_id", userId).select(shortlistFields).single()
        : await supabase.from("shortlists").insert({ ...payload, user_id: userId, entry_source: "manual" }).select(shortlistFields).single();
      if (result.error?.code === "23505") throw new Error("duplicate-program");
      if (result.error || !result.data?.id) throw new Error("unconfirmed-save");
      if (generation.current !== version || owner.current !== actor) return;
      const saved = result.data as ShortlistItem;
      setShortlist(previous => editor.previous ? previous.map(item => item.id === saved.id ? saved : item) : [saved, ...previous]);
      if (!editor.previous) notify(`${saved.university_name} — ${saved.course_name} added to your shortlist.`);
      else if (normalizeApplicationStatus(saved.status) !== normalizeApplicationStatus(editor.previous.status))
        notify(`${saved.university_name} — ${saved.course_name}: status changed to ${normalizeApplicationStatus(saved.status)}.`);
      setEditor(null); setMessage(editor.previous ? "Program details saved." : "Program added. It is also available in your application tracker.");
      if (!editor.previous) { setQuery(""); setLevel("all"); setStatus("all"); }
    } catch (error) {
      mutationFailed(error, error instanceof Error && error.message === "duplicate-program"
        ? "This program is already saved. Your existing entry has been kept."
        : "Could not save your program. Your changes are still here; please retry.", version, true);
    } finally { if (generation.current === version) { mutationBusy.current = false; setBusy(false); } }
  }
  async function removeProgram(item: ShortlistItem) {
    if (mutationBusy.current) return;
    const actor = owner.current, version = generation.current;
    mutationBusy.current = true; setBusy(true); setActionError(null); setMessage(null);
    try {
      const userId = await checkActor(actor, version);
      const { data, error } = await supabase.from("shortlists").delete().eq("id", item.id).eq("user_id", userId).select("id");
      if (error || !data?.some(row => row.id === item.id)) throw new Error("unconfirmed-deletion");
      if (generation.current !== version || owner.current !== actor) return;
      setShortlist(previous => previous.filter(row => row.id !== item.id)); setConfirmRemove(null);
      notify(`${item.university_name} — ${item.course_name} removed from your shortlist.`);
    } catch (error) { mutationFailed(error, "Could not remove this program. It is still shown here; please retry.", version); }
    finally { if (generation.current === version) { mutationBusy.current = false; setBusy(false); } }
  }

  const now = new Date();
  const upcoming = shortlist.filter(item => { const days = deadlineDays(item.deadline, now); return days !== null && days >= 0 && days <= 30; }).length;
  const filtersActive = query !== "" || level !== "all" || status !== "all";
  const visible = shortlist.filter(item => {
    const degree = getProgramLevel(item) ?? "other";
    return (level === "all" || degree === level) && (status === "all" || normalizeApplicationStatus(item.status) === status)
      && [item.university_name, item.course_name, item.note ?? ""].some(value => value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  }).sort((a, b) => {
    if (sort === "university") return a.university_name.localeCompare(b.university_name) || a.course_name.localeCompare(b.course_name);
    if (sort === "deadline") {
      const rank = (item: ShortlistItem) => { const days = deadlineDays(item.deadline, now); return days === null ? Number.MAX_SAFE_INTEGER : days < 0 ? 100000 - days : days; };
      return rank(a) - rank(b);
    }
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });
  const groups = [
    { level: "master", title: "Your Masters Program Shortlist" },
    { level: "bachelor", title: "Your Bachelors Program Shortlist" },
    { level: null, title: "Other saved programs — degree level unknown" },
  ].map(group => ({ ...group, items: visible.filter(item => getProgramLevel(item) === group.level) }));
  const manual = !editor?.previous || editor.previous.entry_source === "manual";
  const savedStatuses = [...new Set([...applicationStatuses, ...shortlist.map(item => normalizeApplicationStatus(item.status))])];

  return <main className={`app-page ${styles.page}`}>
    <header className={styles.header}>
      <div><p className="page-eyebrow">YOUR NEXT CHAPTER</p><h1>My Shortlist</h1><p>Your choices, deadlines and next steps, in one place. Add a program of your own when it isn’t in the catalogue.</p></div>
      <div className={styles.actions}><Link href="/dashboard/my-tracker" className={styles.linkButton}>Open tracker ↗</Link><button type="button" className="ga-primary" disabled={loading || !!loadError || signedOut || busy} onClick={() => openEditor()}>+ Add your own program</button></div>
    </header>
    {actionError && <p role="alert" className={styles.error}>{actionError}</p>}
    {message && <p role="status" className={styles.muted}>{message}</p>}
    {loading ? <p role="status">Loading your shortlist…</p> : loadError ? <div role="alert" className={styles.error}><p>{loadError}</p><button type="button" className={styles.secondary} onClick={() => setLoadAttempt(value => value + 1)}>Retry</button></div> : signedOut ? <div className={styles.empty}><h2>Sign in to your shortlist</h2><p>Save personal programs and keep them private to your account.</p><Link className={styles.linkButton} href="/auth/error?reason=signin&next=%2Fdashboard%2Fmy-shortlist">Sign in</Link></div> : <>
      <div className={styles.stats} aria-label="Shortlist summary">
        <div className={styles.stat}><span>Saved programs</span><strong>{shortlist.length}</strong></div>
        <div className={styles.stat}><span>Deadlines in 30 days</span><strong>{upcoming}</strong></div>
        <div className={styles.stat}><span>Added by you</span><strong>{shortlist.filter(item => item.entry_source === "manual").length}</strong></div>
      </div>
      {editor && <section className={styles.editor} aria-labelledby="shortlist-editor-title">
        <h2 id="shortlist-editor-title" ref={formHeading} tabIndex={-1}>{editor.previous ? "Edit saved program" : "Add your own program"}</h2>
        <p>{editor.previous ? "Update the details that matter to your plan." : "Your entry stays private to your account and appears in your tracker. It won’t be published in the catalogue."}</p>
        <form onSubmit={saveProgram}>
          <fieldset disabled={busy}><div className={styles.fields}>
            <label>University name<input required readOnly={!manual} maxLength={manual ? 200 : undefined} value={editor.values.university_name} onChange={event => change("university_name", event.target.value)} placeholder="e.g. University of Cologne" /></label>
            <label>Program name<input required readOnly={!manual} maxLength={manual ? 240 : undefined} value={editor.values.course_name} onChange={event => change("course_name", event.target.value)} placeholder="e.g. M.Sc. Business Analytics" /></label>
            <label>Degree level<select required={!editor.previous} value={editor.values.program_level} onChange={event => change("program_level", event.target.value)}><option value="">{editor.previous ? "Not specified" : "Choose a degree level"}</option><option value="bachelor">Bachelor’s</option><option value="master">Master’s</option></select></label>
            <label>Application status<select value={editor.values.status} onChange={event => change("status", event.target.value)}><ApplicationStatusOptions value={editor.values.status} /></select></label>
            <label>Application deadline<input type={editor.values.deadline && deadlineDays(editor.values.deadline) === null ? "text" : "date"} value={editor.values.deadline} onChange={event => change("deadline", event.target.value)} />{editor.values.deadline && deadlineDays(editor.values.deadline) === null && <span className={styles.muted}>Existing deadline text is kept unless you change it. Use YYYY-MM-DD to show days remaining.</span>}</label>
            <label>Program website (optional)<input type="url" maxLength={2048} placeholder="https://university.example/program" value={editor.values.official_url} onChange={event => change("official_url", event.target.value)} /></label>
            <div className={styles.wide}><label htmlFor="shortlist-notes">Your notes</label><textarea id="shortlist-notes" aria-describedby="shortlist-notes-hint" maxLength={Math.max(4000, editor.initial.note.length)} value={editor.values.note} onChange={event => change("note", event.target.value)} placeholder="Requirements to check, application costs, questions, or why this program matters to you…" /><span id="shortlist-notes-hint" className={styles.muted}>Your notes are private. Verify requirements and dates on the university’s website.</span></div>
          </div><div className={styles.actions}><button type="submit" className="ga-primary" disabled={busy || (!!editor.previous && !dirty)}>{busy ? "Saving…" : editor.previous ? "Save changes" : "Add to my shortlist"}</button><button type="button" className={styles.secondary} onClick={closeEditor}>Cancel</button></div></fieldset>
          {formError && <p role="alert" className={styles.error}>{formError}</p>}
        </form>
      </section>}
      {shortlist.length > 0 && <>
        <div className={styles.filters}>
          <label>Find a saved program<input type="search" maxLength={120} value={query} onChange={event => setQuery(event.target.value)} placeholder="University, program or note" /></label>
          <label>Degree<select value={level} onChange={event => setLevel(event.target.value)}><option value="all">All degrees</option><option value="bachelor">Bachelor’s</option><option value="master">Master’s</option><option value="other">Not specified</option></select></label>
          <label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option>{savedStatuses.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <label>Sort within each degree<select value={sort} onChange={event => setSort(event.target.value)}><option value="recent">Recently added</option><option value="deadline">Upcoming deadlines first</option><option value="university">University A–Z</option></select></label>
        </div>
        <div className={styles.filterCount}><p className={styles.muted}>{visible.length} of {shortlist.length} saved programs</p>{filtersActive && <button type="button" onClick={() => { setQuery(""); setLevel("all"); setStatus("all"); }}>Clear filters</button>}</div>
      </>}
      {shortlist.length === 0 ? <div className={styles.empty}><h2>No universities shortlisted yet.</h2><p>Explore the catalogue or add a program you’ve found elsewhere.</p><Link className={styles.linkButton} href="/browse-programs">Browse programs ↗</Link></div> : !visible.length ? <div className={styles.empty}><h2>No saved programs match these filters.</h2><p>Try a different university, degree or application status.</p><button className={styles.secondary} onClick={() => { setQuery(""); setLevel("all"); setStatus("all"); }}>Show all saved programs</button></div> : groups.filter(group => group.items.length).map(group => <section key={group.level ?? "unknown"} className={styles.group} aria-label={group.title}>
        <h2>{group.title}</h2><div className={styles.cards}>{group.items.map(item => {
          const days = deadlineDays(item.deadline, now), website = programWebsite(item.official_url);
          return <article key={item.id} className={styles.card} aria-label={`${item.course_name} at ${item.university_name}`}>
            <div className={styles.cardTop}><span className={styles.tag}>{item.entry_source === "manual" ? "Added by you · Private" : "Saved program"}</span><span className={styles.status}>{normalizeApplicationStatus(item.status)}</span></div>
            <h3>{item.university_name}</h3><p className={styles.course}>{item.course_name}</p>
            <dl className={styles.details}><div><dt>Application deadline</dt><dd className={days !== null && days < 0 ? styles.past : days !== null && days <= 30 ? styles.due : undefined}>{deadlineLabel(item.deadline, now)}</dd></div></dl>
            {item.note ? <p className={styles.note}>{item.note}</p> : <p className={`${styles.note} ${styles.muted}`}>Add a note to keep requirements and questions close by.</p>}
            {website && <a className={styles.website} href={website} target="_blank" rel="noopener noreferrer">Program website ↗</a>}
            <div className={styles.cardFooter}><button type="button" className={styles.secondary} disabled={busy} aria-label={`Edit ${item.course_name} at ${item.university_name}`} onClick={() => openEditor(item)}>Edit details</button><button type="button" className={styles.remove} disabled={busy || !!editor} onClick={() => { setConfirmRemove(item.id); setActionError(null); }}>Remove</button></div>
            {confirmRemove === item.id && <div role="group" aria-label={`Confirm removal of ${item.course_name}`} className={styles.confirm}><p>Remove this program from your shortlist and tracker? Your other programs and uploaded documents will stay.</p><div className={styles.actions}><button type="button" className={styles.secondary} disabled={busy} onClick={() => setConfirmRemove(null)}>Keep program</button><button type="button" className="ga-danger" disabled={busy} onClick={() => void removeProgram(item)}>{busy ? "Removing…" : "Confirm removal"}</button></div></div>}
          </article>;
        })}</div>
      </section>)}
      <p className={`${styles.muted} mt-8`}>Deadlines and personal entries are your planning information. Verify dates and admission requirements directly with the university before applying.</p>
    </>}
  </main>;
}
