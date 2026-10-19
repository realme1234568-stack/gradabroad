import Link from "next/link";

export default function NotFound() {
  return (
    <section className="app-page mx-auto max-w-xl px-6">
      <p className="page-eyebrow">404 · A DIFFERENT DIRECTION</p>
      <h1>That page isn’t here.</h1>
      <p>
        The address may have changed. Head back to your study plans or explore
        programs in Germany.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/browse-programs"
          className="ga-primary px-5 py-3 text-sm font-medium"
        >
          Browse programs
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-line px-5 py-3 text-sm"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
