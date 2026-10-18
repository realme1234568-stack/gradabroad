"use client";

import { usePathname } from "next/navigation";
import landingStyles from "@/app/home.module.css";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import AuthPanel from "@/components/AuthPanel";
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/components/NotificationProvider";
import { FaBell, FaCog } from "react-icons/fa";

const navLinks = [
  { href: "/browse-programs", label: "Browse Programs" },
  { href: "/dashboard", label: "Your Dashboard" },
  { href: "/dashboard/my-tracker", label: "Application Tracker" },
];

export default function Header() {
  const isHome = usePathname() === "/";
  const { openCenter, unread } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node))
        setMenuOpen(false);
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setSettingsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
      if (settingsOpen) {
        setSettingsOpen(false);
        settingsButtonRef.current?.focus();
      }
    }
    if (settingsOpen || menuOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [settingsOpen, menuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/70 ${isHome ? landingStyles.homeHeader : ""}`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-3 sm:px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <span className="font-bold">GradAbroad</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-700 dark:text-zinc-200 lg:flex">
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
        <div className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#10b981,_#059669)] px-4 py-2 text-sm font-semibold text-zinc-900 shadow-md shadow-emerald-300/40 transition hover:scale-[1.01] dark:text-black"
          >
            Get started
          </Link>
          <div className="relative lg:hidden" ref={menuRef}>
            <button
              ref={menuButtonRef}
              type="button"
              aria-label="Open navigation"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              className="min-h-11 rounded-lg border px-3 text-sm"
              onClick={() => {
                setMenuOpen((open) => !open);
                setSettingsOpen(false);
              }}
            >
              Menu
            </button>
            {menuOpen && (
              <nav
                id="mobile-navigation"
                aria-label="Mobile navigation"
                className="absolute right-0 mt-3 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-black/10 bg-white p-2 shadow-xl dark:border-white/20 dark:bg-zinc-950"
              >
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          <button
            id="notification-bell"
            type="button"
            onClick={openCenter}
            aria-label={
              unread ? `Notifications, ${unread} unread` : "Notifications"
            }
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 dark:border-white/20"
          >
            <FaBell aria-hidden="true" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1 text-[10px] text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
          <div className="relative" ref={settingsRef}>
            <button
              ref={settingsButtonRef}
              type="button"
              aria-expanded={settingsOpen}
              aria-controls="account-settings"
              aria-label="Open settings"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-black/5 text-zinc-900 transition hover:border-black/40 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:border-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              onClick={() => {
                setSettingsOpen((open) => !open);
                setMenuOpen(false);
              }}
            >
              <FaCog className="h-6 w-6" />
            </button>
            {settingsOpen && (
              <div
                id="account-settings"
                className="absolute right-0 mt-3 w-56 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border border-black/10 bg-white/95 p-4 shadow-xl dark:border-white/10 dark:bg-zinc-950/95 z-50"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  Settings
                </p>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <Link
                    href="/my-profile"
                    onClick={() => setSettingsOpen(false)}
                    className="text-zinc-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-200"
                  >
                    My profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setSettingsOpen(false)}
                    className="text-zinc-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-200"
                  >
                    Settings
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false);
                    openCenter();
                  }}
                  className="mt-3 block text-sm underline"
                >
                  Notifications
                </button>
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
