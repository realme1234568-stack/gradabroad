"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

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
    <div className="theme-options" aria-label="Color theme">
      <button
        type="button"
        aria-pressed={activeTheme === "light"}
        onClick={() => setTheme("light")}
      >
        Light
      </button>
      <button
        type="button"
        aria-pressed={activeTheme === "dark"}
        onClick={() => setTheme("dark")}
      >
        Dark
      </button>
    </div>
  );
}
