"use client";
import { admissionBands, emptyDetails, type ProgramDetails } from "@/lib/programDetails";

export default function ProgramDetailsFields({ value, onChange }: {
  value?: ProgramDetails | null;
  onChange: (value: ProgramDetails) => void;
}) {
  const d = value ?? emptyDetails;
  const field = (key: keyof ProgramDetails, label: string, multiline = false) => (
    <label key={key}>
      {label}
      {multiline ? <textarea rows={3} maxLength={2500} value={String(d[key])}
        onChange={e => onChange({ ...d, [key]: e.target.value })} /> :
        <input type={key.endsWith("_url") ? "url" : key === "reviewed_on" ? "date" : "text"}
          maxLength={key.endsWith("_url") ? 1200 : 2500} value={String(d[key])}
          onChange={e => onChange({ ...d, [key]: e.target.value })} />}
    </label>
  );
  return <details className="mt-6 rounded-xl border border-line p-4" open={!!value}>
    <summary className="cursor-pointer font-semibold">Program information & sources</summary>
    <p className="my-4 text-sm text-muted">Only public, verified English-taught programs appear in discovery. Leave information blank when it has not been checked; do not infer requirements from the university’s reputation.</p>
    <label className="my-3 flex items-center gap-3">
      <input type="checkbox" checked={d.english_taught}
        onChange={e => onChange({ ...d, english_taught: e.target.checked })} />
      Verified: public university and English-taught throughout the degree
    </label>
    {field("source_url", "Reviewed factual source URL (HTTPS)")}
    {field("official_url", "Official program URL (HTTPS)")}
    {field("reviewed_on", "Date information was checked (UTC)")}
    {field("city", "City / campus")}
    {field("subject", "Subject area")}
    {field("award", "Degree awarded")}
    {field("duration", "Duration / study mode")}
    {field("credits", "ECTS credits")}
    {field("teaching_notes", "Teaching-language evidence and any German requirements", true)}
    {field("english_requirement", "Accepted English tests, minimum scores and exemptions", true)}
    {field("academic_requirements", "Academic entry requirements, grades and prerequisite credits", true)}
    <label>Admission planning group
      <select value={d.admission_band} onChange={e => onChange({ ...d, admission_band: e.target.value as ProgramDetails["admission_band"] })}>
        {Object.entries(admissionBands).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
      </select>
    </label>
    {field("admission_basis", "Published evidence for this group (not an admission prediction)", true)}
    {field("intakes", "Available intakes")}
    {field("deadlines", "Application windows: intake/year, applicant group, dates and exceptions", true)}
    {field("tuition", "Tuition: amount, period, applicant group and exemptions", true)}
    {field("semester_fee", "Semester contribution: amount, period and included services", true)}
    {field("application_route", "Application route: university portal / uni-assist / VPD", true)}
    {field("documents", "Required documents and any applicant-specific conditions", true)}
    {field("admissions_url", "Official admissions / requirements URL (HTTPS)")}
    {field("fees_url", "Official fees URL (HTTPS)")}
    {field("notes", "Additional qualifications, limitations or review notes", true)}
  </details>;
}
