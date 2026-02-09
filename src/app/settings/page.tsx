import ThemeToggle from "@/components/ThemeToggle";

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Control your preferences and notifications.
      </p>

      <section className="mt-8 rounded-3xl border border-black/10 bg-gradient-to-br from-white via-purple-50 to-emerald-50 p-8 shadow-xl shadow-purple-200/30 dark:border-white/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-black dark:shadow-none">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Theme
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Switch between light and dark mode.
            </p>
            <div className="mt-4">
              <ThemeToggle />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Notifications
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Email reminders for deadlines and document updates.
            </p>
            <button className="mt-4 rounded-full bg-[radial-gradient(circle_at_top,_#a855f7,_#8b5cf6,_#6366f1)] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-300/40 transition hover:scale-[1.01]">
              Manage notifications
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
