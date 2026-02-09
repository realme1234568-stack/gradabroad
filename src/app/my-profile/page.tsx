export default function MyProfilePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold">My Profile</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Manage your personal details and study preferences.
      </p>

      <section className="mt-8 rounded-3xl border border-black/10 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-8 shadow-xl shadow-emerald-200/30 dark:border-white/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-black dark:shadow-none">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Full Name
            </p>
            <p className="mt-2 text-base font-semibold">Student Name</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Target Intake
            </p>
            <p className="mt-2 text-base font-semibold">Winter 2025</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Intended Level
            </p>
            <p className="mt-2 text-base font-semibold">Master’s</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Focus Area
            </p>
            <p className="mt-2 text-base font-semibold">Computer Science</p>
          </div>
        </div>
      </section>
    </div>
  );
}
