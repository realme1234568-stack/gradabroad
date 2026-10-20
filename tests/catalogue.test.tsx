import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
const db = vi.hoisted(() => ({
  fail: false,
  rows: [
    {
      id: "one",
      university_name: "Example Master University",
      course_name: "Master Course",
      level: "master",
      language: "English",
      is_published: true,
    },
    {
      id: "two",
      university_name: "Example Bachelor University",
      course_name: "Bachelor Course",
      level: "bachelor",
      language: "English",
      is_published: true,
    },
    {
      id: "three",
      university_name: "Hidden University",
      course_name: "Hidden Course",
      level: "master",
      language: "English",
      is_published: false,
    },
  ],
}));
vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    from: () => {
      let levels: string[] = [];
      let published = false;
      const chain = {
        select: () => chain,
        in: (_key: string, values: string[]) => {
          levels = values;
          return chain;
        },
        eq: (_key: string, value: boolean) => {
          published = value;
          return chain;
        },
        order: () => chain,
        range: async () => {
          const rows = db.rows.filter(
            (p) => levels.includes(p.level) && p.is_published === published,
          );
          return {
            data: rows,
            count: rows.length,
            error: db.fail ? new Error("offline") : null,
          };
        },
      };
      return chain;
    },
  },
}));
vi.mock("@/components/ProgramList", () => ({
  default: ({
    programs,
  }: {
    programs: { id: string; course_name: string }[];
  }) => (
    <div>
      {programs.map((p) => (
        <p key={p.id}>{p.course_name}</p>
      ))}
    </div>
  ),
}));
import Browse from "@/app/browse-programs/page";
beforeEach(() => {
  db.fail = false;
});
afterEach(cleanup);
test("both degree lists use published database entries rather than the old hard-coded Master list", async () => {
  render(<Browse />);
  await screen.findByText("Master Course");
  expect(screen.queryByText("Hidden Course")).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Bachelors", exact: true }),
  );
  await screen.findByText("Bachelor Course");
  expect(screen.queryByText("Master Course")).toBeNull();
});
test("catalogue failure offers retry and does not show a stale hard-coded fallback", async () => {
  db.fail = true;
  render(<Browse />);
  await screen.findByRole("alert");
  expect(screen.queryByText("Master Course")).toBeNull();
  db.fail = false;
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByText("Master Course");
});
