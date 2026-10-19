"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type AccountDataKind = "profile" | "expenses-inr" | "expenses-eur" | "budget-inr" | "budget-eur";

// Each feature has its own row, so saving expenses cannot overwrite a profile.
export function useAccountData<T>(kind: AccountDataKind, defaults: T, validate: (value: unknown) => value is T) {
  const [value, setValue] = useState<T>(defaults);
  const [baseline, setBaseline] = useState<T>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const userId = useRef<string | null>(null);
  const generation = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      const current = ++generation.current;
      setLoading(true);
      setReady(false);
      setError(null);
      setValue(defaults);
      setBaseline(defaults);
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user) throw new Error("Please sign in to load and save your data.");
        const owner = auth.user.id;
        const { data, error: loadError } = await supabase.from("account_data")
          .select("data").eq("user_id", owner).eq("kind", kind).maybeSingle();
        if (loadError) throw new Error("Could not load your saved data. Refresh to retry.");
        const loaded: unknown = data ? data.data : defaults;
        if (!validate(loaded)) throw new Error("Your saved data could not be read. Please contact support.");
        if (!active || current !== generation.current) return;
        userId.current = owner;
        setValue(loaded);
        setBaseline(loaded);
        setReady(true);
      } catch (err) {
        if (active && current === generation.current) setError(err instanceof Error ? err.message : "Could not load your saved data.");
      } finally {
        if (active && current === generation.current) setLoading(false);
      }
    }
    void load();
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user.id === userId.current) return;
      // Invalidate in-flight saves immediately; do not call Auth inside its callback.
      userId.current = null;
      generation.current++;
      setReady(false);
      setLoading(true);
      clearTimeout(timer);
      timer = setTimeout(() => void load(), 0);
    });
    const invalidate = () => { generation.current++; };
    return () => {
      active = false;
      invalidate();
      clearTimeout(timer);
      subscription.subscription.unsubscribe();
    };
  }, [kind, defaults, validate]);

  async function save(next: T = value) {
    if (!ready || busy.current || !userId.current) return false;
    if (!validate(next)) { setError("Please check the entered values."); return false; }
    const owner = userId.current;
    const current = generation.current;
    busy.current = true;
    setSaving(true);
    setError(null);
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || auth.user?.id !== owner || current !== generation.current) throw new Error("Your account changed. Reload before saving.");
      const { data, error: saveError } = await supabase.from("account_data").upsert({
        user_id: owner, kind, data: next,
      }, { onConflict: "user_id,kind" }).select("kind").single();
      if (saveError || !data) throw new Error("Could not save. Your changes have not been saved; please retry.");
      if (current !== generation.current) return false;
      setValue(next);
      setBaseline(next);
      return true;
    } catch (err) {
      if (current === generation.current) setError(err instanceof Error ? err.message : "Could not save. Please retry.");
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return { ownerId: userId.current, value, setValue, save, loading, saving, error, ready, dirty: JSON.stringify(value) !== JSON.stringify(baseline) };
}
