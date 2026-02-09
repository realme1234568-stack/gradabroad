"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded-full bg-white/10" />
        <div className="h-8 w-20 rounded-full bg-white/10" />
      </div>
    );
  }

  const activeTheme = theme === "system" ? systemTheme : theme;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
          activeTheme === "light"
            ? "bg-[radial-gradient(circle_at_top,_#fcd34d,_#fbbf24,_#f59e0b)] text-zinc-900 shadow-md shadow-amber-200/40"
            : "bg-[radial-gradient(circle_at_top,_#fef3c7,_#fde68a,_#fbbf24)] text-zinc-900 shadow-sm shadow-amber-100/40"
        }`}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
          activeTheme === "dark"
            ? "bg-[radial-gradient(circle_at_top,_#34d399,_#22d3ee,_#0ea5e9)] text-zinc-900 shadow-md shadow-emerald-200/40"
            : "bg-[radial-gradient(circle_at_top,_#dbeafe,_#bfdbfe,_#93c5fd)] text-zinc-900 shadow-sm shadow-blue-100/40"
        }`}
      >
        Dark
      </button>
    </div>
  );
}
