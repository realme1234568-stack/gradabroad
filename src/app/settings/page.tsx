"use client";
import { useNotifications } from "@/components/NotificationProvider";
import ThemeToggle from "@/components/ThemeToggle";

export default function SettingsPage() {
  const { openCenter } = useNotifications();
  return (
    <div className="app-page mx-auto w-full max-w-4xl px-6 py-12">
      <p className="page-eyebrow">MAKE IT YOURS</p>
      <h1 className="text-3xl font-semibold">Settings</h1>
      <p className="mt-2 text-sm text-muted">
        Control your preferences and notifications.
      </p>

      <section className="mt-8 rounded-xl border border-line bg-surface p-8 shadow-sm dark:shadow-none">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Theme
            </p>
            <p className="mt-2 text-sm text-muted">
              Switch between light and dark mode.
            </p>
            <div className="mt-4">
              <ThemeToggle />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Notifications
            </p>
            <p className="mt-2 text-sm text-muted">
              View shortlist additions, removals, and application status updates.
            </p>
            <button type="button" onClick={openCenter} className="mt-4 rounded-full ga-primary px-4 py-2 text-xs font-semibold text-ink shadow-sm transition hover:scale-[1.01]">
              View notifications
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
