import { applicationStatuses, normalizeApplicationStatus } from "@/lib/applicationStatus";

export type ShortlistItem = {
  id: string; university_name: string; course_name: string; program_level?: string | null;
  deadline?: string | null; status?: string | null; note?: string | null;
  official_url?: string | null; entry_source?: "manual" | "catalogue" | "saved"; created_at?: string;
};
export type ShortlistDraft = {
  university_name: string; course_name: string; program_level: string;
  deadline: string; status: string; note: string; official_url: string;
};
export const shortlistFields = "id, university_name, course_name, program_level, deadline, status, note, official_url, entry_source, created_at";
export const emptyShortlistDraft: ShortlistDraft = {
  university_name: "", course_name: "", program_level: "", deadline: "", status: "Shortlisted", note: "", official_url: "",
};
export function programWebsite(value?: string | null): string | null {
  if (!value?.trim()) return null;
  try {
    if (/\s/.test(value.trim())) return null;
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password || url.href.length > 2048) return null;
    return url.href;
  } catch { return null; }
}
export function deadlineDays(value?: string | null, now = new Date()): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return Math.round((date.getTime() - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
}
export function deadlineLabel(value?: string | null, now = new Date()): string {
  if (!value) return "No deadline added";
  const days = deadlineDays(value, now);
  if (days === null) return value;
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
  return `${date}${days < 0 ? " · Deadline passed" : days === 0 ? " · Due today" : days <= 30 ? ` · ${days} ${days === 1 ? "day" : "days"} left` : ""}`;
}
export function validateShortlistDraft(draft: ShortlistDraft, previous?: ShortlistItem) {
  const manual = !previous || previous.entry_source === "manual";
  const university = draft.university_name.trim();
  const course = draft.course_name.trim();
  if (manual && (!university || university.length > 200 || !course || course.length > 240))
    throw new Error("Enter a university (up to 200 characters) and program name (up to 240 characters).");
  if (!["bachelor", "master"].includes(draft.program_level) && (!previous || draft.program_level !== ""))
    throw new Error("Choose Bachelor’s or Master’s for this program.");
  if (draft.deadline && deadlineDays(draft.deadline) === null && draft.deadline !== previous?.deadline)
    throw new Error("Choose a valid deadline in YYYY-MM-DD format.");
  if (!applicationStatuses.some(status => status === draft.status) && draft.status !== normalizeApplicationStatus(previous?.status))
    throw new Error("Choose an application status from the list.");
  if (draft.note.length > 4000 && draft.note !== previous?.note) throw new Error("Keep your notes within 4,000 characters.");
  const website = programWebsite(draft.official_url);
  if (draft.official_url.trim() && !website) throw new Error("Enter a valid http:// or https:// program website without a username or password.");
  return {
    ...(manual ? { university_name: university, course_name: course } : {}),
    program_level: draft.program_level || null, deadline: draft.deadline || null,
    note: draft.note, official_url: website,
    ...(!previous || draft.status !== normalizeApplicationStatus(previous.status) ? { status: draft.status } : {}),
  };
}
