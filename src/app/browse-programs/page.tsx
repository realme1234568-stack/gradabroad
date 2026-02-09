import { createSupabaseServerClient } from "@/lib/supabaseServer";
import ProgramList from "@/components/ProgramList";

type Program = {
  id: string;
  university_name: string;
  course_name: string;
  level: string | null;
  language: string | null;
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
    .select("id, university_name, course_name, level, language")
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
      <ProgramList programs={programs} />
    </div>
  );
}
