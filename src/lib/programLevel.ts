import { mastersPrograms } from "@/lib/mastersPrograms";

export type ProgramLevel = "master" | "bachelor";
type SavedProgram = {
  program_level?: string | null;
  university_name: string;
  course_name: string;
};
const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

export function normalizeProgramLevel(value?: string | null): ProgramLevel | null {
  const level = normalize(value ?? "").replace(/[’']/g, "");
  if (level === "master" || level === "masters") return "master";
  if (level === "bachelor" || level === "bachelors") return "bachelor";
  return null;
}

export function getProgramLevel(program: SavedProgram): ProgramLevel | null {
  const explicit = normalizeProgramLevel(program.program_level);
  if (explicit) return explicit;
  // Match both names: an acronym alone is not enough to identify a degree.
  if (mastersPrograms.some((known) =>
    normalize(known.university_name) === normalize(program.university_name) &&
    normalize(known.course_name) === normalize(program.course_name)
  )) return "master";
  const course = normalize(program.course_name);
  if (/^(?:m\.?\s*(?:sc|a|eng)\.?|mba|master(?:['’]s|s)?)(?=\s|$|[(:-])/.test(course)) return "master";
  if (/^(?:b\.?\s*(?:sc|a|eng)\.?|bachelor(?:['’]s|s)?)(?=\s|$|[(:-])/.test(course)) return "bachelor";
  return null;
}
