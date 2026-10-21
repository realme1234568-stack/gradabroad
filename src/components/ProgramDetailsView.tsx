import Link from "next/link";
import ProgramResearchNote from "@/components/ProgramResearchNote";
import { admissionBands, notVerified, reviewDue, safeSourceUrl, type ProgramDetails } from "@/lib/programDetails";
import s from "@/app/programs/programs.module.css";

type Program = { id: string; university_name: string; course_name: string; level: string | null; details: ProgramDetails };
export default function ProgramDetailsView({ program }: { program: Program }) {
  const d = program.details;
  const source = (url: string, label: string) => safeSourceUrl(url) ? <a href={url} target="_blank" rel="noopener noreferrer">{label} ↗</a> : null;
  const section = (id: string, eyebrow: string, title: string, rows: [string, string][], url: string) => (
    <section className={s.panel} id={id} aria-labelledby={`${id}-title`}>
      <p className="page-eyebrow">{eyebrow}</p><h2 id={`${id}-title`}>{title}</h2>
      <dl className={s.facts}>{rows.map(([label, text]) => <div key={label}><dt>{label}</dt><dd>{text.trim() || notVerified}</dd></div>)}</dl>
      <div className={s.source}>{source(url || d.official_url, "University instructions")} {source(d.source_url, "Reviewed provider facts")}</div>
    </section>
  );
  return <div className={`app-page ${s.page}`}>
    <Link href="/browse-programs" className={s.back}>← All programs</Link>
    <header className={s.hero}>
      <p className="page-eyebrow">A CLOSER LOOK AT YOUR NEXT CHAPTER</p>
      <p className={s.university}>{program.university_name}{d.city && ` · ${d.city}`}</p>
      <h1>{program.course_name}</h1>
      <div className={s.chips}><span>English-taught</span><span>Public university</span><span>{program.level === "master" ? "Master’s" : "Bachelor’s"}</span>{d.award && <span>{d.award}</span>}</div>
      <p className={s.review}>Source reviewed {d.reviewed_on} · {reviewDue(d.reviewed_on) ? "Due for manual review" : "Manual review every 10–15 days"}</p>
    </header>
    <div className={s.layout}>
      <div className={s.sections}>
        {section("overview", "THE ESSENTIALS", "Your program at a glance.", [["Subject",d.subject],["Campus",d.city],["Duration & study mode",d.duration],["ECTS credits",d.credits],["Available intakes",d.intakes]],d.official_url)}
        {section("requirements", "BEFORE YOU APPLY", "What you need to bring.", [["Teaching language",d.teaching_notes],["English certificates & exemptions",d.english_requirement],["Academic requirements",d.academic_requirements],["Admission planning group",admissionBands[d.admission_band]],["Why this group?",d.admission_basis]],d.admissions_url)}
        <p className={s.context}>Planning groups describe the published entry and selection requirements. They are not acceptance rates, university rankings, or a prediction of admission. Open admission still requires a recognised qualification and all stated conditions.</p>
        {section("dates", "MAKE ROOM IN YOUR CALENDAR", "Intakes & application windows.", [["Intakes",d.intakes],["Deadlines & applicant groups",d.deadlines]],d.admissions_url)}
        {section("costs", "PLAN WITH PERSPECTIVE", "Tuition & semester costs.", [["Tuition fees",d.tuition],["Semester contribution",d.semester_fee]],d.fees_url)}
        {section("application", "YOUR NEXT STEP", "How to apply.", [["Application route",d.application_route],["Documents & conditions",d.documents],["Additional notes",d.notes]],d.admissions_url)}
      </div>
      <aside className={s.sidebar}>
        <div className={s.panel}>
          <p className="page-eyebrow">MAKE IT YOUR PLAN</p><h2>Go to the source.</h2>
          <p>Use the university’s current instructions for your qualification, nationality and intended intake.</p>
          <div className={s.links}>{source(d.source_url,"Reviewed programme facts")}{source(d.official_url,"Official program page")}{source(d.admissions_url,"Admissions & application")}{source(d.fees_url,"Official fee information")}</div>
          <Link className="ga-primary" href="/browse-programs">Browse & shortlist programs</Link>
        </div>
        <nav aria-label="Program sections" className={s.toc}>{[["overview","Overview"],["requirements","Requirements"],["dates","Intakes & deadlines"],["costs","Fees"],["application","Application"]].map(([id,label])=><a href={`#${id}`} key={id}>{label} ↓</a>)}</nav>
      </aside>
    </div>
    <ProgramResearchNote />
  </div>;
}
