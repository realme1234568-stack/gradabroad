import { normalizeProgramLevel } from "@/lib/programLevel";
export type OwnerProgram = {
  id: string;
  university_name: string;
  course_name: string;
  level: string | null;
  language: string | null;
  is_published: boolean;
  revision: number;
};
export type ProgramDraft = {
  university_name: string;
  course_name: string;
  level: string;
  language: string;
  is_published: boolean;
};
export type OwnerOverview = {
  email: string;
  accounts: number;
  programs: number;
  published: number;
  shortlists: number;
  journeys: number;
  activity: {
    id: number;
    action: string;
    summary: string;
    recorded_at: string;
  }[];
};
export type OwnerCatalogue = {
  items: OwnerProgram[];
  total: number;
  page: number;
};
export const blankProgram: ProgramDraft = {
  university_name: "",
  course_name: "",
  level: "master",
  language: "",
  is_published: false,
};
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const count = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
export function isOwnerOverview(v: unknown): v is OwnerOverview {
  return (
    object(v) &&
    typeof v.email === "string" &&
    ["accounts", "programs", "published", "shortlists", "journeys"].every((k) =>
      count(v[k]),
    ) &&
    Array.isArray(v.activity) &&
    v.activity.every(
      (a) =>
        object(a) &&
        count(a.id) &&
        typeof a.action === "string" &&
        typeof a.summary === "string" &&
        typeof a.recorded_at === "string" &&
        Number.isFinite(Date.parse(a.recorded_at)),
    )
  );
}
export function isOwnerProgram(v: unknown): v is OwnerProgram {
  return (
    object(v) &&
    typeof v.id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      v.id,
    ) &&
    typeof v.university_name === "string" &&
    typeof v.course_name === "string" &&
    (v.level === null || typeof v.level === "string") &&
    (v.language === null || typeof v.language === "string") &&
    typeof v.is_published === "boolean" &&
    count(v.revision) &&
    v.revision > 0
  );
}
export function isOwnerCatalogue(v: unknown): v is OwnerCatalogue {
  return (
    object(v) &&
    count(v.total) &&
    count(v.page) &&
    Array.isArray(v.items) &&
    v.items.length <= 25 &&
    v.items.every(isOwnerProgram)
  );
}
export function programDraftError(draft: ProgramDraft): string | null {
  if (
    !draft.university_name.trim() ||
    draft.university_name.trim().length > 240
  )
    return "Enter a university name of up to 240 characters.";
  if (!draft.course_name.trim() || draft.course_name.trim().length > 400)
    return "Enter a course name of up to 400 characters.";
  if (!["master", "bachelor"].includes(draft.level))
    return "Select a degree level.";
  if (!draft.language.trim() || draft.language.trim().length > 120)
    return "Enter the teaching language, up to 120 characters.";
  return null;
}
export function editProgram(program: OwnerProgram): ProgramDraft {
  return {
    university_name: program.university_name,
    course_name: program.course_name,
    level: normalizeProgramLevel(program.level) ?? "",
    language: program.language ?? "",
    is_published: program.is_published,
  };
}
export function ownerError(
  error: { code?: string } | null | undefined,
  fallback: string,
) {
  if (error?.code === "42501")
    return "Owner access was denied. Sign in with the owner account and reload.";
  if (error?.code === "40001")
    return "This program changed since you opened it. Cancel and reload the catalogue before editing.";
  if (error?.code === "23505")
    return "This university and course already exist. Edit the existing entry instead.";
  if (error?.code === "22023" || error?.code === "22P02")
    return "Check the entered program fields and try again.";
  return fallback;
}

// Exported text must not become a spreadsheet formula when an owner opens it.
export function catalogueCsv(programs: OwnerProgram[]) {
  const cell = (v: string) =>
    '"' + (/^[\s]*[=+@\-\t\r]/.test(v) ? "'" + v : v).replace(/"/g, '""') + '"';
  return [
    ["university_name", "course_name", "level", "language", "is_published"],
    ...programs.map((p) => [
      p.university_name,
      p.course_name,
      p.level ?? "",
      p.language ?? "",
      String(p.is_published),
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
