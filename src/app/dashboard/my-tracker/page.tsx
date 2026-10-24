"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNotifications } from "@/components/NotificationProvider";
import { checklistDrafts } from "@/lib/checklistDraft";
import { supabase } from "@/lib/supabaseClient";
import { shortlistFields, type ShortlistItem } from "@/lib/shortlist";
import TrackerWorkspace from "./TrackerWorkspace";

export default function MyTrackerPage() {
  const { notify } = useNotifications();
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [programs, setPrograms] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [docStatus, setDocStatus] = useState<Record<string, Record<string, boolean>>>({});
  const [customDocs, setCustomDocs] = useState<string[]>([]);
  const [newDoc, setNewDoc] = useState("");
  const [mandatoryStatus, setMandatoryStatus] = useState<Record<string, boolean>>({});
  const [customMandatoryDocs, setCustomMandatoryDocs] = useState<string[]>([]);
  const [newMandatoryDoc, setNewMandatoryDoc] = useState("");
  const generation = useRef(0), identity = useRef<string | null>(null), mutation = useRef(false);
  const invalidate = useCallback(() => { generation.current++; }, []);
  useEffect(() => {
    let active = true;
    const version = ++generation.current;
    async function load() {
      setLoading(true); setError(null);
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user) throw new Error('Sign in required');
        if (!active || version !== generation.current) return;
        identity.current = auth.user.id;
        const { data: preferences, error: preferencesError } = await supabase.from('tracker_preferences')
          .select('doc_status, custom_docs, mandatory_status, custom_mandatory_docs').eq('user_id', auth.user.id).maybeSingle();
        if (preferencesError) throw preferencesError;
        const rows: ShortlistItem[] = [];
        for (let offset = 0; ; offset += 1000) {
          const { data, error } = await supabase.from('shortlists').select(shortlistFields).eq('user_id', auth.user.id)
            .order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 999);
          if (!active || version !== generation.current) return;
          if (error || !Array.isArray(data)) throw error ?? new Error('Invalid response');
          rows.push(...data); if (data.length < 1000) break;
        }
        if (!active || version !== generation.current) return;
        const draft = checklistDrafts.get(auth.user.id);
        setUserId(auth.user.id); setPrograms(rows); setDirty(!!draft);
        setNewDoc(draft?.newDoc ?? ''); setNewMandatoryDoc(draft?.newMandatoryDoc ?? '');
        setSaveMessage(draft ? 'Restored your unsaved checklist changes.' : null);
        setDocStatus(draft?.docStatus ?? preferences?.doc_status ?? {});
        setCustomDocs(draft?.customDocs ?? preferences?.custom_docs ?? []);
        setMandatoryStatus(draft?.mandatoryStatus ?? preferences?.mandatory_status ?? {});
        setCustomMandatoryDocs(draft?.customMandatoryDocs ?? preferences?.custom_mandatory_docs ?? []);
      } catch { if (active && version === generation.current) setError('Could not load your tracker. Please try again later.'); }
      finally { if (active && version === generation.current) setLoading(false); }
    }
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id ?? null;
      if (!active || id === identity.current) return;
      invalidate(); identity.current = id; mutation.current = false;
      setUserId(null); setPrograms([]); setDocStatus({}); setCustomDocs([]); setMandatoryStatus({}); setCustomMandatoryDocs([]);
      setDirty(false); setSaving(false); setStatusBusy(null); setStatusMessage(null); setSaveMessage(null); setNewDoc(''); setNewMandatoryDoc('');
      setLoading(true); setLoadAttempt(value => value + 1);
    });
    void load();
    return () => { active = false; invalidate(); subscription.subscription.unsubscribe(); };
  }, [loadAttempt, invalidate]);
  useEffect(() => {
    if (userId && !loading && !error && dirty) checklistDrafts.set(userId, { docStatus, customDocs, mandatoryStatus, customMandatoryDocs, newDoc, newMandatoryDoc });
  }, [userId, loading, error, dirty, docStatus, customDocs, mandatoryStatus, customMandatoryDocs, newDoc, newMandatoryDoc]);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const guardLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const target = new URL(link.href, location.href);
      if (target.origin === location.origin && target.pathname === location.pathname && target.search === location.search) return;
      if (!window.confirm('Your checklist has unsaved changes. Leave this page? Choose Cancel to stay and save.')) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener('beforeunload', beforeUnload); document.addEventListener('click', guardLink, true);
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', guardLink, true); };
  }, [dirty]);
  function changed() { setDirty(true); setSaveMessage(null); }
  async function verifyAccount(version: number) {
    const { data, error } = await supabase.auth.getUser();
    if (error || !userId || data.user?.id !== userId || identity.current !== userId || generation.current !== version) throw new Error('Account check failed');
  }
  async function saveChecklist() {
    if (!userId || mutation.current) return;
    const version = generation.current;
    mutation.current = true; setSaving(true); setSaveMessage(null);
    try {
      await verifyAccount(version);
      const { error } = await supabase.from('tracker_preferences').upsert({ user_id: userId, doc_status: docStatus, custom_docs: customDocs,
        mandatory_status: mandatoryStatus, custom_mandatory_docs: customMandatoryDocs }, { onConflict: 'user_id' });
      if (error) throw error;
      if (version !== generation.current) return;
      checklistDrafts.delete(userId); setDirty(false); setSaveMessage('Checklist saved.');
    } catch { if (version === generation.current) setSaveMessage('Could not save your checklist. Your changes are still here; please retry.'); }
    finally { if (version === generation.current) { mutation.current = false; setSaving(false); } }
  }
  async function updateStatus(item: ShortlistItem, status: string) {
    if (mutation.current) return;
    const version = generation.current;
    mutation.current = true; setStatusBusy(item.id); setStatusMessage(null);
    try {
      await verifyAccount(version);
      const { data, error } = await supabase.from('shortlists').update({ status }).eq('id', item.id).eq('user_id', userId!).select('id');
      if (error || !data?.some(row => row.id === item.id)) throw new Error('Unconfirmed update');
      if (version !== generation.current) return;
      setPrograms(previous => previous.map(row => row.id === item.id ? { ...row, status } : row));
      notify(`${item.university_name} — ${item.course_name}: status changed to ${status}.`);
      setStatusMessage('Application status saved.');
    } catch { if (version === generation.current) setStatusMessage('Could not save application status. Please retry.'); }
    finally { if (version === generation.current) { mutation.current = false; setStatusBusy(null); } }
  }
  return <TrackerWorkspace key={userId ?? 'loading'} {...{ programs, loading, error, saving, statusBusy, statusMessage, saveMessage, dirty, docStatus, customDocs, newDoc, mandatoryStatus, customMandatoryDocs, newMandatoryDoc }}
    onRetry={() => setLoadAttempt(value => value + 1)} onSave={() => void saveChecklist()} onStatus={(item, status) => void updateStatus(item, status)}
    onNewDoc={setNewDoc} onNewMandatoryDoc={setNewMandatoryDoc}
    onToggleCore={doc => { changed(); setMandatoryStatus(previous => ({ ...previous, [doc]: previous[doc] !== true })); }}
    onToggleDoc={(id, doc) => { changed(); setDocStatus(previous => ({ ...previous, [id]: { ...previous[id], [doc]: previous[id]?.[doc] !== true } })); }}
    onAddCore={doc => { changed(); setCustomMandatoryDocs(previous => [...previous, doc]); setNewMandatoryDoc(''); }}
    onAddDoc={doc => { changed(); setCustomDocs(previous => [...previous, doc]); setNewDoc(''); }}
    onRemoveCore={doc => { changed(); setCustomMandatoryDocs(previous => previous.filter(value => value !== doc)); setMandatoryStatus(previous => { const next = { ...previous }; delete next[doc]; return next; }); }}
    onRemoveDoc={doc => { changed(); setCustomDocs(previous => previous.filter(value => value !== doc)); setDocStatus(previous => Object.fromEntries(Object.entries(previous).map(([id, values]) => { const next = { ...values }; delete next[doc]; return [id, next]; }))); }} />;
}
