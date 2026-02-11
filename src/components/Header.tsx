"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import AuthPanel from "@/components/AuthPanel";
import { useState, useRef, useEffect } from "react";

const navLinks = [
  { href: "/browse-programs", label: "Browse Programs" },
  { href: "/dashboard", label: "Your Dashboard" },
  { href: "/dashboard/my-tracker", label: "Application Tracker" },
];


export default function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [settingsOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="font-bold">GradAbroad</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-700 dark:text-zinc-200 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-zinc-900 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#10b981,_#059669)] px-4 py-2 text-sm font-semibold text-zinc-900 shadow-md shadow-emerald-300/40 transition hover:scale-[1.01] dark:text-black"
          >
            Get started
          </Link>
          <div className="relative" ref={settingsRef}>
            <button
              aria-label="Open settings"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-black/5 text-zinc-900 transition hover:border-black/40 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:border-white/50"
              onClick={() => setSettingsOpen((open) => !open)}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3.5" />
                <path d="M19.4 15a7.8 7.8 0 0 0 .1-6l1.9-1.1-2-3.4-2.2 1a7.7 7.7 0 0 0-5.2-2.1l-.4-2.4h-4l-.4 2.4a7.7 7.7 0 0 0-5.2 2.1l-2.2-1-2 3.4L4.5 9a7.8 7.8 0 0 0 .1 6l-1.9 1.1 2 3.4 2.2-1a7.7 7.7 0 0 0 5.2 2.1l.4 2.4h4l.4-2.4a7.7 7.7 0 0 0 5.2-2.1l2.2 1 2-3.4L19.4 15z" />
              </svg>
            </button>
            {settingsOpen && (
              <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-black/10 bg-white/95 p-4 shadow-xl dark:border-white/10 dark:bg-zinc-950/95 z-50">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  Settings
                </p>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <Link
                    href="/my-profile"
                    className="text-zinc-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-200"
                  >
                    My profile
                  </Link>
                  <Link
                    href="/settings"
                    className="text-zinc-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-200"
                  >
                    Settings
                  </Link>
                </div>
                <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                    Theme
                  </p>
                  <div className="mt-2">
                    <ThemeToggle />
                  </div>
                </div>
                <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
                  <AuthPanel />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
