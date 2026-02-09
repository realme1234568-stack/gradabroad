import { createSupabaseServerClient } from "@/lib/supabaseServer";
import ShortlistForm from "@/components/forms/ShortlistForm";

type Shortlist = {
  id: string;
  university_name: string;
  course_name: string;
  deadline: string | null;
  status: string | null;
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Your Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Sign in to view your shortlist and tracker progress.
        </p>
      </div>
    );
  }

  const { data: shortlistedData } = await supabase
    .from("shortlists")
    .select("id, university_name, course_name, deadline, status")
    .order("created_at", { ascending: false });

  const shortlisted: Shortlist[] = shortlistedData ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Your Dashboard</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Track your shortlisted universities and application milestones.
      </p>

      <div className="mt-6">
        <ShortlistForm />
      </div>

      <section className="mt-8 rounded-3xl border border-black/10 bg-white/80 p-8 shadow-xl shadow-emerald-200/30 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-none">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">My Shortlisted Universities</h2>
          <button className="rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#22d3ee,_#0ea5e9)] px-4 py-2 text-xs font-semibold text-zinc-900 shadow-md shadow-emerald-300/40 transition hover:scale-[1.01]">
            Add new
          </button>
        </div>
        <div className="mt-6 grid gap-4">
          {shortlisted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/20 bg-white/60 p-6 text-sm text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300">
              No shortlisted universities yet. Add entries in Supabase to see
              them here.
            </div>
          ) : (
            shortlisted.map((item: Shortlist) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-4 shadow-md shadow-emerald-200/30 md:flex-row md:items-center md:justify-between dark:border-white/10 dark:from-black/60 dark:via-black/60 dark:to-black/60 dark:shadow-none"
              >
                <div>
                  <h3 className="text-base font-semibold">
                    {item.university_name}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {item.course_name}
                  </p>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  Deadline:{" "}
                  <span className="text-zinc-900 dark:text-white">
                    {item.deadline ?? "TBD"}
                  </span>
                </div>
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                  {item.status ?? "Shortlisted"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
