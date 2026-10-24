"use client";

import { usePathname } from "next/navigation";
import landingStyles from "@/app/home.module.css";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import ThemeToggle from "@/components/ThemeToggle";
import AuthPanel from "@/components/AuthPanel";
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/components/NotificationProvider";
import { FaBell, FaCog } from "react-icons/fa";
import { useOwnerAccess } from "@/lib/useOwnerAccess";

const navLinks = [
  { href: "/browse-programs", label: "Browse Programs" },
  { href: "/dashboard", label: "Your Dashboard" },
  { href: "/dashboard/my-tracker", label: "Application Tracker" },
];

export default function Header() {
  const isHome = usePathname() === "/";
  const owner = useOwnerAccess();
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
      className={`site-header sticky top-0 z-50 border-b border-line backdrop-blur ${isHome ? landingStyles.homeHeader : ""}`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-3 sm:px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <BrandMark size={32} />
          <span className="font-bold">GradAbroad</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex rounded-full ga-primary px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:scale-[1.01]"
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
                className="absolute right-0 mt-3 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface p-2 shadow-sm"
              >
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-3 text-sm hover:bg-surface"
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
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line"
          >
            <FaBell aria-hidden="true" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-[12px] leading-5 text-white ring-2 ring-background">
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
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink transition hover:border-line focus:outline-none focus:ring-2 focus:ring-accent-ink"
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
                className="absolute right-0 mt-3 w-56 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-xl border border-line bg-surface p-4 shadow-sm z-50"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Settings
                </p>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <Link href="/contact" onClick={() => setSettingsOpen(false)}>Contact Us</Link>
                  <Link href="/privacy" onClick={() => setSettingsOpen(false)}>Privacy Policy</Link>
                  <Link href="/terms" onClick={() => setSettingsOpen(false)}>Terms & Conditions</Link>
                  {owner && <Link href="/admin" onClick={() => setSettingsOpen(false)} className="text-accent-ink">Owner dashboard ↗</Link>}
                  <Link
                    href="/my-profile"
                    onClick={() => setSettingsOpen(false)}
                    className="text-ink hover:text-accent-ink"
                  >
                    My profile
                  </Link>
                  <Link
                    href="/dashboard/your-documents"
                    onClick={() => setSettingsOpen(false)}
                    className="text-ink hover:text-accent-ink"
                  >
                    Your Documents
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setSettingsOpen(false)}
                    className="text-ink hover:text-accent-ink"
                  >
                    Settings
                  </Link>
                </div>
                <div className="mt-4 border-t border-line pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Theme
                  </p>
                  <div className="mt-2">
                    <ThemeToggle />
                  </div>
                </div>
                <div className="mt-4 border-t border-line pt-4">
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
