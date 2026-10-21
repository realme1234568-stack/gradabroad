import LegalAcceptanceScreen from "@/components/LegalAcceptanceScreen";
import { signInDestination } from "@/lib/signInDestination";
export const metadata = { title: "Your agreement | GradAbroad" };
export default async function AcceptPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <LegalAcceptanceScreen nextPath={signInDestination(next)} />;
}
