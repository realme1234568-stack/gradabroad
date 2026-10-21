import Link from "next/link";
import { LEGAL_CONTACT } from "@/lib/legal";
export const metadata = { title: "Contact Us | GradAbroad" };
export default function ContactPage() {
  return <div className="app-page mx-auto max-w-3xl px-6">
    <p className="page-eyebrow">Here to help</p><h1>Contact us</h1>
    <p>For support, feedback, account help, privacy requests or a security concern, contact GradAbroad using our official email.</p>
    <section className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <h2 className="text-xl">GradAbroad support</h2>
      <a className="mt-4 inline-block break-all text-lg text-accent-ink underline underline-offset-4" href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>
      <p className="mt-4 text-sm leading-7 text-muted">Based in New Delhi, India. For an account or deletion request, write from your sign-in email so we can verify your request. Never send your password, sign-in link, payment-card details or private identity documents in an initial support message.</p>
    </section>
    <nav className="mt-8 flex gap-6 text-sm underline" aria-label="Legal information"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms & Conditions</Link></nav>
  </div>;
}
