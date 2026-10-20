import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import OwnerDashboard from "@/components/OwnerDashboard";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user)
    redirect("/auth/error?reason=signin&next=%2Fadmin");
  const { data, error } = await supabase.rpc("is_app_owner");
  if (error)
    return (
      <div className="app-page mx-auto max-w-3xl px-6">
        <h1>Owner workspace unavailable</h1>
        <p role="alert">
          We could not verify your owner access. Reload to retry.
        </p>
        <a href="/admin" className="mt-6 inline-block underline">
          Reload owner workspace
        </a>
      </div>
    );
  if (data !== true) notFound();
  return <OwnerDashboard key={auth.user.id} ownerId={auth.user.id} />;
}
