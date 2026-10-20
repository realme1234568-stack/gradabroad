"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Cosmetic navigation only. The server page and every privileged RPC independently
// enforce the private database role; editing client state can grant no capability.
export function useOwnerAccess() {
  const [owner, setOwner] = useState(false);
  useEffect(() => {
    let active = true;
    let generation = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      const current = ++generation;
      try {
        const { data: auth, error } = await supabase.auth.getUser();
        if (error || !auth.user) {
          if (active && current === generation) setOwner(false);
          return;
        }
        const { data, error: roleError } = await supabase.rpc("is_app_owner");
        if (active && current === generation)
          setOwner(!roleError && data === true);
      } catch {
        if (active && current === generation) setOwner(false);
      }
    }
    void load();
    const { data } = supabase.auth.onAuthStateChange(() => {
      generation++;
      setOwner(false);
      clearTimeout(timer);
      timer = setTimeout(() => void load(), 0);
    });
    const focus = () => void load();
    window.addEventListener("focus", focus);
    return () => {
      active = false;
      generation++;
      clearTimeout(timer);
      data.subscription.unsubscribe();
      window.removeEventListener("focus", focus);
    };
  }, []);
  return owner;
}
