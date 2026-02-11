"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function MyShortlistPage() {
  const [shortlist, setShortlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShortlist = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("shortlists")
        .select("id, university_name, course_name, deadline, status")
        .order("created_at", { ascending: false });
      setShortlist(data ?? []);
      setLoading(false);
    };
    fetchShortlist();
  }, []);

  const handleRemoveShortlist = async (id) => {
    await supabase.from("shortlists").delete().eq("id", id);
    setShortlist((prev) => prev.filter((item) => item.id !== id));
  };

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
        <div className="space-y-4">
          {shortlist.map((item) => (
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
      )}
    </main>
  );
}
