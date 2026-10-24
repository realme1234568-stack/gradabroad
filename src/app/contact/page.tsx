import { publicMetadata } from "@/lib/seo";
import Link from "next/link";
import { LEGAL_CONTACT } from "@/lib/legal";
export const metadata = publicMetadata("Contact GradAbroad", "Contact GradAbroad for support, privacy questions and account help.", "/contact");
const requests = [
  { title: "Support & feedback", action: "Email support", subject: "GradAbroad support request", description: "Tell us which page you were using, what you expected and what happened. Include your browser and device if the issue is technical." },
  { title: "Privacy & your data", action: "Make a privacy or data request", subject: "GradAbroad privacy or data access request", description: "Ask for a copy of your account information, a correction or help exercising your privacy rights. Describe the request without attaching private documents." },
  { title: "Delete your account", action: "Request account deletion", subject: "GradAbroad account deletion request", description: "Request account closure and deletion of associated planning data and uploaded files. Send from your sign-in email. We will verify the request before acting; opening this email does not delete anything." },
  { title: "Report a security concern", action: "Report a security issue", subject: "GradAbroad security report", description: "Describe the affected page and safe steps to reproduce the issue. Do not access another person’s account or files, and do not email passwords, session tokens or identity documents." },
];
export default function ContactPage() {
  return <div className="app-page mx-auto max-w-3xl px-6">
    <p className="page-eyebrow">Here to help</p><h1>Contact us</h1>
    <p>For support, feedback, account help, privacy requests or a security concern, contact GradAbroad using our official email.</p>
    <section className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <h2 className="text-xl">GradAbroad support</h2>
      <a className="mt-4 inline-block break-all text-lg text-accent-ink underline underline-offset-4" href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>
      <p className="mt-4 text-sm leading-7 text-muted">Based in New Delhi, India. For an account or deletion request, write from your sign-in email so we can verify your request. Never send your password, sign-in link, payment-card details or private identity documents in an initial support message.</p>
    </section>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {requests.map(request => <section key={request.subject} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
        <h2 className="text-lg">{request.title}</h2>
        <p className="mt-3 flex-1 text-sm leading-7 text-muted">{request.description}</p>
        <a className="mt-5 inline-block self-start text-sm text-accent-ink underline underline-offset-4" href={`mailto:${LEGAL_CONTACT}?subject=${encodeURIComponent(request.subject)}`}>{request.action} ↗</a>
      </section>)}
    </div>
    <section className="mt-6 rounded-2xl border border-line p-6">
      <h2 className="text-lg">Before requesting deletion</h2>
      <p className="mt-3 text-sm leading-7 text-muted">Download any files you want to keep first. You can delete individual files in Your Documents without closing your account. For account closure, we will explain any identity checks, applicable retention exceptions and when the request has been completed. Please do not attach identity documents to your initial request.</p>
      <Link className="mt-4 inline-block text-sm text-accent-ink underline underline-offset-4" href="/dashboard/your-documents">Open Your Documents ↗</Link>
    </section>
    <nav className="mt-8 flex gap-6 text-sm underline" aria-label="Legal information"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms & Conditions</Link></nav>
  </div>;
}
