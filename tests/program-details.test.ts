import { expect, test } from "vitest";
import catalogue from "../data/programs-germany-english.json";
import { catalogueReady, detailsError, emptyDetails, isProgramDetails, realDate, reviewDue, safeSourceUrl } from "@/lib/programDetails";
const valid = { ...emptyDetails, english_taught: true, official_url: "https://example.edu/program", source_url: "https://example.edu/facts", teaching_notes: "English throughout", reviewed_on: "2026-01-01" };
test("metadata rejects unsafe links, invalid dates, inherited keys and unsupported admission categories", () => {
  expect(isProgramDetails(valid)).toBe(true);
  for (const url of ["javascript:alert(1)", "http://example.edu", "https://name:password@example.edu", "https://localhost"]) expect(safeSourceUrl(url)).toBe(false);
  expect(realDate("2026-02-30")).toBe(false);
  expect(isProgramDetails({ ...valid, admission_band: "constructor" })).toBe(false);
  expect(isProgramDetails({ ...valid, constructor: "extra" })).toBe(false);
  expect(isProgramDetails({ ...valid, academic_requirements: 123 })).toBe(false);
  expect(catalogueReady({ ...valid, reviewed_on: "2999-01-01" })).toBe(false);
  expect(detailsError({ ...valid, admission_band: "open", admission_basis: "" })).toBeTruthy();
});
test("manual-review label changes at fifteen days and flags missing dates", () => {
  expect(reviewDue("2026-10-01", new Date("2026-10-15"))).toBe(false);
  expect(reviewDue("2026-10-01", new Date("2026-10-16"))).toBe(true);
  expect(reviewDue("", new Date("2026-10-16"))).toBe(true);
});
test("catalogue has 100 unique entries per degree with source evidence and valid public-English metadata", () => {
  expect(catalogue).toHaveLength(200);
  expect(new Set(catalogue.map(p => p.id)).size).toBe(200);
  expect(new Set(catalogue.map(p => `${p.university_name}|${p.course_name}`)).size).toBe(200);
  for (const level of ["bachelor", "master"]) expect(catalogue.filter(p => p.level === level)).toHaveLength(100);
  for (const p of catalogue) {
    expect(detailsError(p.details), `${p.university_name} ${p.course_name}`).toBeNull();
    expect(catalogueReady(p.details)).toBe(true);
    expect(p.language).toBe("English");
    expect(p.details.source_url).toMatch(/^https:\/\/www2\.daad\.de\/.*\/detail\/\d+\/$/);
    expect(p.details.official_url).toMatch(/^https:\/\//);
    expect(p.details.city).not.toMatch(/Singapore|Ho Chi Minh/);
    expect(p.university_name).not.toMatch(/SRH|Fresenius|International School of Management|WHU/);
    expect(p.details.academic_requirements.length).toBeGreaterThan(20);
  }
});
