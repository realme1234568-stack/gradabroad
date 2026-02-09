import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function MyProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const devEmails = (process.env.DEV_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const isDev = !!user?.email && devEmails.includes(user.email.toLowerCase());

  const [programsCount, shortlistsCount, trackerCount] = isDev
    ? await Promise.all([
        supabase.from("programs").select("id", { count: "exact", head: true }),
        supabase.from("shortlists").select("id", { count: "exact", head: true }),
        supabase
          .from("application_tracker")
          .select("id", { count: "exact", head: true }),
      ])
    : [null, null, null];

  const metrics = {
    programs: programsCount?.count ?? 0,
    shortlists: shortlistsCount?.count ?? 0,
    tracker: trackerCount?.count ?? 0,
  };

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

      {isDev ? (
        <section className="mt-10 rounded-3xl border border-emerald-300/40 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-8 shadow-xl shadow-emerald-200/40 dark:border-emerald-400/30 dark:from-zinc-900 dark:via-zinc-950 dark:to-black dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
                Dev Dashboard
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Insider controls</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Private metrics and tools only visible to your dev account.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dev/import"
                className="rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#22d3ee,_#0ea5e9)] px-4 py-2 text-xs font-semibold text-zinc-900 shadow-md shadow-emerald-200/40 transition hover:scale-[1.01]"
              >
                Open Dev Import
              </Link>
              <Link
                href="/browse-programs"
                className="rounded-full border border-emerald-200/80 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400/40 dark:text-emerald-200 dark:hover:bg-emerald-500/10"
              >
                View Programs
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-md shadow-emerald-200/30 dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Programs Live
              </p>
              <p className="mt-3 text-2xl font-semibold">{metrics.programs}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Shared catalog entries
              </p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-md shadow-cyan-200/30 dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Shortlists
              </p>
              <p className="mt-3 text-2xl font-semibold">{metrics.shortlists}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Total rows across users
              </p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/90 p-5 shadow-md shadow-purple-200/30 dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Tracker Entries
              </p>
              <p className="mt-3 text-2xl font-semibold">{metrics.tracker}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Applications in flight
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200/60 bg-white/80 p-6 shadow-sm dark:border-emerald-400/30 dark:bg-white/5">
              <h3 className="text-base font-semibold">Traffic pulse</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Connect analytics to unlock live traffic, retention, and funnels.
              </p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                <div className="h-full w-1/3 rounded-full bg-emerald-400" />
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-200/60 bg-white/80 p-6 shadow-sm dark:border-cyan-400/30 dark:bg-white/5">
              <h3 className="text-base font-semibold">Feature flags</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Upcoming: toggle beta dashboards and experiment visibility.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Dev access active
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
