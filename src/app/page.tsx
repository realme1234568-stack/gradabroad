import Image from "next/image";
import Link from "next/link";

const benefits = [
  "Tuition-free or low-cost public universities",
  "English-taught programs with global recognition",
  "Strong industry ties and post-study work options",
  "High quality of life and student-friendly cities",
];

const steps = [
  {
    title: "Browse programs",
    description:
      "Explore bachelor’s and master’s programs across Germany and compare requirements.",
  },
  {
    title: "Shortlist universities",
    description:
      "Save your top choices and organize intake, deadlines, and document checklists.",
  },
  {
    title: "Track applications",
    description:
      "Monitor status from document collection to final decision in one dashboard.",
  },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-white text-zinc-900 transition-colors duration-200 dark:bg-black dark:text-white">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/30 blur-3xl dark:bg-emerald-400/20" />
      <div className="pointer-events-none absolute -right-32 top-20 h-64 w-64 rounded-full bg-cyan-400/30 blur-3xl dark:bg-cyan-400/20" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-400/10" />
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-16 pt-14 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">
            Study Abroad Planner
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Plan your Germany study journey from shortlisting to admission.
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-300 md:text-lg">
            Gradabroad helps ambitious students organize programs, documents, and
            application progress for bachelor’s and master’s studies in Germany.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/browse-programs"
              className="rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#22d3ee,_#0ea5e9)] px-5 py-2 text-sm font-semibold text-zinc-900 shadow-lg shadow-emerald-400/30 transition hover:scale-[1.01]"
            >
              Browse Programs
            </Link>
            <Link
              href="/application-tracker"
              className="rounded-full bg-[radial-gradient(circle_at_top,_#fbbf24,_#f59e0b,_#d97706)] px-5 py-2 text-sm font-semibold text-zinc-900 shadow-md shadow-amber-300/40 transition hover:scale-[1.01]"
            >
              View Application Tracker
            </Link>
          </div>
          <div className="grid gap-3 text-sm text-zinc-600 dark:text-zinc-300">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-8 shadow-xl shadow-emerald-200/30 dark:border-white/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-black dark:shadow-none">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="space-y-6">
            <div className="rounded-2xl border border-black/10 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">
                Featured
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Ambitious students outside a German campus
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Illustration placeholder — swap with your final hero artwork later.
              </p>
            </div>
            <Image
              src="/hero-illustration.svg"
              alt="Students outside a university with books"
              width={420}
              height={300}
              className="w-full rounded-2xl border border-black/10 bg-white/80 shadow-lg shadow-cyan-200/30 dark:border-white/10 dark:bg-black/50 dark:shadow-none"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-black/10 bg-white/80 p-10 shadow-xl shadow-cyan-200/30 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-none">
          <h2 className="text-2xl font-semibold">How Gradabroad helps</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-black/10 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-6 shadow-md shadow-emerald-200/30 dark:border-white/10 dark:from-black/60 dark:via-black/60 dark:to-black/60 dark:shadow-none"
              >
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
