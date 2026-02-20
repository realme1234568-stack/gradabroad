"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ShortlistItem = {
  id: string;
  university_name: string;
  course_name: string;
  deadline: string;
  status: string;
  program_level?: string; // 'bachelor' | 'master' | undefined
};

export default function MyShortlistPage() {
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShortlist = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("shortlists")
        .select("id, university_name, course_name, deadline, status, program_level")
        .order("created_at", { ascending: false });
      setShortlist(data ?? []);
      setLoading(false);
    };
    fetchShortlist();
  }, []);

  const handleRemoveShortlist = async (id: string) => {
    await supabase.from("shortlists").delete().eq("id", id);
    setShortlist((prev) => prev.filter((item) => item.id !== id));
  };

  // Helper to infer program level if missing
  function getLevel(item: ShortlistItem) {
    const level = item.program_level?.toLowerCase?.();
    if (level === "bachelor" || level === "master") return level;
    if (item.course_name?.toLowerCase().startsWith("b.sc.")) return "bachelor";
    if (item.course_name?.toLowerCase().startsWith("m.sc.")) return "master";
    return undefined;
  }

  // Sort shortlist so masters always come before bachelors
  const sortedShortlist = [...shortlist].sort((a, b) => {
    const aLevel = getLevel(a);
    const bLevel = getLevel(b);
    if (aLevel === bLevel) return 0;
    if (aLevel === "master" || !aLevel) return -1;
    if (bLevel === "master" || !bLevel) return 1;
    return 0;
  });
  const masters = sortedShortlist.filter(item => getLevel(item) === "master");
  const bachelors = sortedShortlist.filter(item => getLevel(item) === "bachelor");

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Shortlist</h1>
      {loading ? (
        <div>Loading...</div>
      ) : shortlist.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/20 bg-white/60 p-4 text-sm text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300">
          No universities shortlisted yet.
        </div>
      ) : (
        <>
          {masters.length > 0 && (
            <>
              <h2 className="text-lg font-semibold mb-2">Your Masters Program Shortlist</h2>
              <div className="space-y-4 mb-8">
                {masters.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-black/10 py-2 last:border-b-0 dark:border-white/10">
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
                ))}
              </div>
            </>
          )}
          {bachelors.length > 0 && (
            <>
              {masters.length > 0 && (
                <hr className="my-8 border-t-2 border-emerald-200" />
              )}
              <h2 className="text-lg font-semibold mb-2">Your Bachelors Program Shortlist</h2>
              <div className="space-y-4">
                {bachelors.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-black/10 py-2 last:border-b-0 dark:border-white/10">
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
                ))}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
