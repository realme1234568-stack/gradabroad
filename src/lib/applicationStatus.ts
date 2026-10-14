export const applicationStatuses = ["Shortlisted", "Applied", "Interview", "Accepted", "Rejected"] as const;

// Keep existing Admit records compatible without rewriting user data on load.
export function normalizeApplicationStatus(status: string | null | undefined): string {
  if (status === "Admit") return "Accepted";
  return status || "Shortlisted";
}
