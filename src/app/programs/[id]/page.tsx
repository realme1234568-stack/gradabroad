import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { catalogueReady } from "@/lib/programDetails";
import ProgramDetailsView from "@/components/ProgramDetailsView";

export const dynamic = "force-dynamic";
export default async function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const db = await createSupabaseServerClient();
  const { data, error } = await db.from("programs").select("id,university_name,course_name,level,language,details")
    .eq("id",id).eq("is_published",true).eq("language","English").maybeSingle();
  if (error) return <div className="app-page mx-auto max-w-3xl px-6"><h1>Program temporarily unavailable</h1><p role="alert">We could not load this program. Please try again.</p><a href={`/programs/${id}`} className="mt-6 inline-block underline">Reload program</a></div>;
  if (!data || !["bachelor", "master"].includes(data.level ?? "") || !catalogueReady(data.details)) notFound();
  return <ProgramDetailsView program={{ ...data, details: data.details }} />;
}
