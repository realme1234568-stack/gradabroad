export const emptyProfile = { firstName: "", lastName: "", programInterest: "", qualification: "", englishTest: "", aptitudeTest: "" };
export type Profile = typeof emptyProfile;
export function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return Object.keys(emptyProfile).every(key => typeof p[key] === "string" && (p[key] as string).length <= 100) &&
    ["", "bachelors", "masters"].includes(p.programInterest as string) &&
    ["", "12th", "graduate"].includes(p.qualification as string) &&
    ["", "ielts", "toefl", "duolingo"].includes(p.englishTest as string) &&
    ["", "gmat", "gre"].includes(p.aptitudeTest as string);
}
