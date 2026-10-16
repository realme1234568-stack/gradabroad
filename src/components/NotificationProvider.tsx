"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Notification = { id: string; message: string; created_at: string; read_at: string | null };
type Notifications = { notify: (message: string) => void; openCenter: () => void; unread: number };
const Context = createContext<Notifications>({ notify: () => {}, openCenter: () => {}, unread: 0 });
export const useNotifications = () => useContext(Context);

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [queue, setQueue] = useState<{ id: number; message: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef(0);
  const owner = useRef<string | null>(null);
  const generation = useRef(0);
  const loadSequence = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const load = useCallback(async () => {
    const userId = owner.current;
    const current = generation.current;
    const requestId = ++loadSequence.current;
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase.from("notifications")
        .select("id, message, created_at, read_at").eq("user_id", userId)
        .order("created_at", { ascending: false }).limit(100);
      if (queryError) throw queryError;
      if (current === generation.current && requestId === loadSequence.current) setItems(data ?? []);
    } catch {
      if (current === generation.current && requestId === loadSequence.current) setError("Could not load notifications. Please retry.");
    } finally {
      if (current === generation.current && requestId === loadSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const reset = (id: string | null) => {
      if (!active || id === owner.current) return;
      generation.current++;
      owner.current = id;
      setItems([]); setQueue([]); setError(null); setOpen(false); setLoading(false); setSaving(false);
      if (id) void load();
    };
    // Initial auth event also covers account changes without calling Auth from its callback.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => reset(session?.user.id ?? null));
    const initialGeneration = generation.current;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (active && generation.current === initialGeneration) {
        if (error) setError("Could not check your session. Refresh to retry.");
        else reset(data.user?.id ?? null);
      }
    }).catch(() => { if (active) setError("Could not check your session. Refresh to retry."); });
    const invalidate = () => { generation.current++; };
    return () => { active = false; invalidate(); data.subscription.unsubscribe(); };
  }, [load]);

  const toast = queue[0];
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setQueue(previous => previous.slice(1));
      void load();
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast, load]);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else if (dialog.current?.open) dialog.current.close();
  }, [open]);

  const close = () => {
    setOpen(false);
    if (returnFocus.current?.isConnected) returnFocus.current.focus();
    else document.getElementById("notification-bell")?.focus();
  };
  const openCenter = () => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
    void load();
  };
  async function markRead() {
    const userId = owner.current;
    const current = generation.current;
    const unreadIds = items.filter(item => !item.read_at).map(item => item.id);
    if (!userId || saving || !unreadIds.length) return;
    setSaving(true); setError(null);
    try {
      const { error: updateError } = await supabase.from("notifications")
        .update({ read_at: new Date().toISOString() }).eq("user_id", userId).in("id", unreadIds);
      if (updateError) throw updateError;
      if (current === generation.current) await load();
    } catch {
      if (current === generation.current) setError("Could not mark notifications as read. Please retry.");
    } finally { if (current === generation.current) setSaving(false); }
  }
  const renderedOwner = owner.current;
  return <Context.Provider value={{
    notify: message => { if (renderedOwner && owner.current === renderedOwner) setQueue(previous => [...previous, { id: ++sequence.current, message }]); },
    openCenter,
    unread: items.filter(item => !item.read_at).length,
  }}>
    {children}
    {toast && <div role="status" aria-live="polite" className="fixed bottom-5 right-4 z-[100] max-w-[calc(100vw-2rem)] w-80 rounded-2xl border border-emerald-300 bg-white p-4 text-zinc-900 shadow-xl dark:bg-zinc-900 dark:text-white">
      <p className="font-semibold">New notification</p><p className="mt-1 text-sm">{toast.message}</p>
    </div>}
    <dialog ref={dialog} aria-labelledby="notification-title" onCancel={event => { event.preventDefault(); close(); }}
      onClick={event => { if (event.target === dialog.current) close(); }}
      className="fixed inset-0 m-auto max-h-[80dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-zinc-300 bg-white p-5 text-zinc-900 shadow-xl backdrop:bg-black/40 dark:bg-zinc-950 dark:text-white">
      <div className="flex items-center justify-between gap-4"><h2 id="notification-title" className="text-xl font-semibold">Notifications</h2><button type="button" onClick={close} className="rounded border px-3 py-2">Close</button></div>
      {!owner.current ? <p className="mt-4">Sign in to view your notifications.</p> : <>
        <p className="mt-2 text-sm">Your latest 100 shortlist and application updates.</p>
        {loading && <p role="status">Loading notifications…</p>}
        {error && <div role="alert" className="mt-3"><p>{error}</p><button type="button" onClick={() => void load()} className="mt-2 rounded border px-3 py-2">Retry</button></div>}
        {!loading && !error && !items.length && <p className="mt-4">No notifications yet.</p>}
        {!!items.length && <button type="button" disabled={saving || loading || !items.some(item => !item.read_at)} onClick={markRead} className="my-3 rounded border px-3 py-2 disabled:opacity-50">{saving ? "Saving…" : "Mark all as read"}</button>}
        <ul className="divide-y divide-zinc-200">{items.map(item => <li key={item.id} className="py-3">
          <p className={item.read_at ? "text-sm" : "text-sm font-semibold"}>{!item.read_at && <span aria-label="Unread">● </span>}{item.message}</p>
          <time className="text-xs text-zinc-500" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
        </li>)}</ul>
      </>}
    </dialog>
  </Context.Provider>;
}
