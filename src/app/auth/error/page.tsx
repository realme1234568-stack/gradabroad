import { signInDestination } from "@/lib/signInDestination";
import Link from "next/link";
import AuthPanel from "@/components/AuthPanel";

const messages: Record<string, string> = {
  signin: "Sign in below to continue to your account and save programs.",
  session: "Please sign in to continue. Your previous session may have expired.",
  cancelled: "Sign-in was cancelled or permission was denied. You can try again below.",
  "invalid-link": "This sign-in link is missing, expired, already used, or was opened in a different browser. Please start sign-in again here.",
  "rate-limited": "There have been too many sign-in attempts. Please wait a few minutes before trying again.",
  unavailable: "We could not reach the sign-in service. Check your connection and try again.",
  failed: "We could not complete sign-in. Please try again below.",
};

export default async function AuthErrorPage({ searchParams }: {
  searchParams: Promise<{ reason?: string | string[]; next?: string | string[] }>;
}) {
  const { reason, next } = await searchParams;
  const message = typeof reason === "string" && Object.hasOwn(messages, reason)
    ? messages[reason] : messages.failed;
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold">{reason === "signin" ? "Sign in to continue" : "Sign-in needs attention"}</h1>
      <p role="alert" className="my-6 text-sm">{message}</p>
      <AuthPanel nextPath={signInDestination(next)} />
      <Link href="/" className="mt-6 inline-block underline">Back to home</Link>
    </main>
  );
}
