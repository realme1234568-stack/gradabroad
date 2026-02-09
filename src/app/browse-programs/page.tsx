import { createSupabaseServerClient } from "@/lib/supabaseServer";
import ProgramForm from "@/components/forms/ProgramForm";

type Program = {
  id: string;
  university_name: string;
  course_name: string;
  level: string | null;
  language: string | null;
  intake: string | null;
};

export default async function BrowseProgramsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Browse Programs</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Sign in to see your personalized program list.
        </p>
      </div>
    );
  }

  const { data: programsData } = await supabase
    .from("programs")
    .select("id, university_name, course_name, level, language, intake")
    .order("created_at", { ascending: false });

  const programs: Program[] = programsData ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Browse Programs</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Compare bachelor’s and master’s programs across Germany.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full bg-[radial-gradient(circle_at_top,_#fcd34d,_#fbbf24,_#f59e0b)] px-4 py-2 text-xs font-semibold text-zinc-900 shadow-md shadow-amber-200/40 transition hover:scale-[1.01]">
            Computer Science
          </button>
          <button className="rounded-full bg-[radial-gradient(circle_at_top,_#a7f3d0,_#6ee7b7,_#34d399)] px-4 py-2 text-xs font-semibold text-zinc-900 shadow-md shadow-emerald-200/40 transition hover:scale-[1.01]">
            Engineering
          </button>
          <button className="rounded-full bg-[radial-gradient(circle_at_top,_#93c5fd,_#60a5fa,_#3b82f6)] px-4 py-2 text-xs font-semibold text-zinc-900 shadow-md shadow-blue-200/40 transition hover:scale-[1.01]">
            Business
          </button>
        </div>
      </div>
      <div className="mt-8">
        <ProgramForm />
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {programs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/20 bg-white/60 p-6 text-sm text-zinc-600 dark:border-white/20 dark:bg-black/40 dark:text-zinc-300">
            No programs yet. Add some rows in Supabase to see them here.
          </div>
        ) : (
          programs.map((program: Program) => (
            <div
              key={program.id}
              className="group relative overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-6 shadow-lg shadow-emerald-200/30 dark:border-white/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-black dark:shadow-none"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl transition group-hover:scale-110" />
              <h2 className="text-lg font-semibold">{program.course_name}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {program.university_name}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-600 dark:text-zinc-300">
                {program.level ? (
                  <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
                    {program.level}
                  </span>
                ) : null}
                {program.language ? (
                  <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
                    {program.language}
                  </span>
                ) : null}
                {program.intake ? (
                  <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
                    {program.intake}
                  </span>
                ) : null}
              </div>
              <button className="mt-6 rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#22d3ee,_#0ea5e9)] px-4 py-2 text-xs font-semibold text-zinc-900 shadow-md shadow-emerald-300/40 transition hover:scale-[1.01]">
                Add to shortlist
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
