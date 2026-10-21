export const admissionBands = {
  demanding: "More demanding requirements",
  additional: "Additional selection requirements",
  standard: "Standard entry requirements",
  open: "Open admission",
  unreviewed: "Admission review pending",
} as const;

export type AdmissionBand = keyof typeof admissionBands;
export type ProgramDetails = {
  version: 1;
  institution_type: "public";
  english_taught: boolean;
  city: string;
  subject: string;
  award: string;
  duration: string;
  credits: string;
  teaching_notes: string;
  english_requirement: string;
  academic_requirements: string;
  admission_band: AdmissionBand;
  admission_basis: string;
  intakes: string;
  deadlines: string;
  tuition: string;
  semester_fee: string;
  application_route: string;
  documents: string;
  source_url: string;
  official_url: string;
  admissions_url: string;
  fees_url: string;
  reviewed_on: string;
  notes: string;
};

export const emptyDetails: ProgramDetails = {
  version: 1, institution_type: "public", english_taught: false,
  city: "", subject: "", award: "", duration: "", credits: "",
  teaching_notes: "", english_requirement: "", academic_requirements: "",
  admission_band: "unreviewed", admission_basis: "", intakes: "", deadlines: "",
  tuition: "", semester_fee: "", application_route: "", documents: "",
  source_url: "", official_url: "", admissions_url: "", fees_url: "", reviewed_on: "", notes: "",
};

export function safeSourceUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 1200) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      url.hostname.includes(".") && !url.hostname.endsWith(".local");
  } catch { return false; }
}

export function realDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function isProgramDetails(value: unknown): value is ProgramDetails {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const d = value as Record<string, unknown>;
  return d.version === 1 && d.institution_type === "public" &&
    typeof d.english_taught === "boolean" &&
    Object.keys(emptyDetails).every(key => Object.hasOwn(d, key)) &&
    Object.keys(d).every(key => Object.hasOwn(emptyDetails, key)) &&
    Object.keys(emptyDetails).filter(key => !["version", "institution_type", "english_taught"].includes(key))
      .every(key => typeof d[key] === "string" && (d[key] as string).length <= 2500) &&
    typeof d.admission_band === "string" && Object.hasOwn(admissionBands, d.admission_band) &&
    ["source_url", "official_url", "admissions_url", "fees_url"].every(key => !d[key] || safeSourceUrl(d[key])) &&
    (!d.reviewed_on || realDate(d.reviewed_on));
}

export function catalogueReady(details: unknown): details is ProgramDetails {
  return isProgramDetails(details) && details.english_taught &&
    safeSourceUrl(details.official_url) && realDate(details.reviewed_on) &&
    !!details.teaching_notes.trim() &&
    Date.parse(details.reviewed_on) <= Date.now() &&
    (details.admission_band === "unreviewed" || !!details.admission_basis.trim());
}

export function reviewDue(reviewedOn: string, today = new Date()) {
  if (!realDate(reviewedOn)) return true;
  return today.getTime() - Date.parse(reviewedOn) >= 15 * 86400000;
}

export function detailsError(value: unknown): string | null {
  if (!isProgramDetails(value)) return "Check the program details, source links, and review date.";
  if (value.admission_band !== "unreviewed" && !value.admission_basis.trim())
    return "Explain the published requirements behind this admission group.";
  if (value.reviewed_on && Date.parse(value.reviewed_on) > Date.now())
    return "The review date cannot be in the future. Use the current UTC calendar date.";
  if (value.english_taught && !catalogueReady(value))
    return "To include an English-taught program, add its official source, teaching-language evidence, and review date.";
  return null;
}

export const notVerified = "Not yet verified. Check the official university information.";
