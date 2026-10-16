// Only known application routes may be used as post-login destinations.
export function signInDestination(value: unknown): string {
  if (typeof value !== "string") return "/";
  return ["/dashboard", "/dashboard/my-tracker", "/dashboard/my-shortlist", "/dashboard/expense-calculator", "/application-tracker", "/browse-programs", "/my-profile", "/settings"].includes(value) ? value : "/";
}
