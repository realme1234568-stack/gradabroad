import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { emptyDetails } from "@/lib/programDetails";
const db = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabaseClient", () => ({ supabase: { rpc: db.rpc } }));
vi.mock("@/components/ProgramList", () => ({
  default: ({ programs }: { programs: { id: string; course_name: string }[] }) => <div>{programs.map(p => <p key={p.id}>{p.course_name}</p>)}</div>,
}));
import Browse from "@/app/browse-programs/page";
const details = { ...emptyDetails, english_taught: true, official_url: "https://example.edu/course", teaching_notes: "English throughout", reviewed_on: "2026-01-01" };
const row = (level: string, course = `${level} Course`) => ({ id: "one", university_name: "Example University", course_name: course, level, language: "English", details });
beforeEach(() => {
  db.rpc.mockReset().mockImplementation(async (_name, params) => ({ data: { items: [row(params.p_level)], total: 25, page: params.p_page }, error: null }));
});
afterEach(cleanup);
test("degree, search, planning-group and pagination filters reach the database with page resets", async () => {
  render(<Browse />);
  await screen.findByText("master Course");
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => expect(db.rpc).toHaveBeenLastCalledWith("search_english_programs", expect.objectContaining({ p_page: 1 })));
  await screen.findByText("Page 2", { exact: false });
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "  Aachen  " } });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  await waitFor(() => expect(db.rpc).toHaveBeenLastCalledWith("search_english_programs", expect.objectContaining({ p_query: "Aachen", p_page: 0 })));
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "open" } });
  await waitFor(() => expect(db.rpc).toHaveBeenLastCalledWith("search_english_programs", expect.objectContaining({ p_band: "open", p_page: 0 })));
  fireEvent.click(screen.getByRole("button", { name: "Bachelors" }));
  await screen.findByText("bachelor Course");
  expect(db.rpc).toHaveBeenLastCalledWith("search_english_programs", expect.objectContaining({ p_level: "bachelor", p_page: 0 }));
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  await waitFor(() => expect(db.rpc).toHaveBeenLastCalledWith("search_english_programs", expect.objectContaining({ p_query: "", p_band: "all" })));
});
test("failed queries show an actionable retry, without stale results or an empty-account message", async () => {
  db.rpc.mockResolvedValueOnce({ data: null, error: new Error("offline") });
  render(<Browse />);
  await screen.findByRole("alert");
  expect(screen.queryByText("master Course")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByText("master Course");
});
test.each([
  { ...row("master"), language: "German" },
  { ...row("master"), details: { ...details, english_taught: false } },
  { ...row("master"), details: null },
  row("bachelor"),
])("rejects malformed or out-of-scope catalogue responses", async bad => {
  db.rpc.mockResolvedValue({ data: { items: [bad], total: 1, page: 0 }, error: null });
  render(<Browse />);
  await screen.findByRole("alert");
  expect(screen.queryByText(bad.course_name)).toBeNull();
});
