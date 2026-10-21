import Link from "next/link";
import { LEGAL_CONTACT, LEGAL_DATE, LEGAL_VERSION, privacy, terms } from "@/lib/legal";
import styles from "@/app/legal/legal.module.css";

export default function LegalPolicy({ kind, embedded = false }: { kind: "terms" | "privacy"; embedded?: boolean }) {
  return <article className={styles.policy}>
    {!embedded && <><p className="page-eyebrow">GradAbroad · Your trust matters</p><h1>{kind === "terms" ? "Terms & Conditions" : "Privacy Policy"}</h1></>}
    <p className={styles.version}>Last updated: {LEGAL_DATE} · Version {LEGAL_VERSION}</p>
    {(kind === "terms" ? terms : privacy).map(section => <section key={section.title}>
      <h2>{section.title}</h2>
      {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    </section>)}
    <p>Questions? <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a></p>
    {!embedded && <nav aria-label="Legal information"><Link href={kind === "terms" ? "/privacy" : "/terms"}>{kind === "terms" ? "Read the Privacy Policy" : "Read the Terms & Conditions"}</Link><Link href="/contact">Contact us</Link><Link href="/">Back to GradAbroad</Link></nav>}
  </article>;
}
