import { notFound } from "next/navigation";
import DevCsvImport from "@/components/DevCsvImport";

export default function DevImportPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Dev CSV Import</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Import CSV data into Supabase tables. This page is only available in
        development.
      </p>
      <div className="mt-8">
        <DevCsvImport />
      </div>
    </div>
  );
}
