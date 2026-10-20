import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
  act,
} from "@testing-library/react";
import type { OwnerOverview, OwnerProgram } from "@/lib/owner";
const db = vi.hoisted(() => ({
  failLoad: false,
  failSave: false,
  conflict: false,
  rows: [] as unknown[],
  rpc: vi.fn(),
  authChanged: null as
    null | ((_event: string, session: { user: { id: string } } | null) => void),
}));
vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    rpc: db.rpc,
    auth: {
      onAuthStateChange: (fn: typeof db.authChanged) => {
        db.authChanged = fn;
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },
  },
}));
import OwnerDashboard from "@/components/OwnerDashboard";
import {
  catalogueCsv,
  isOwnerOverview,
  programDraftError,
  blankProgram,
} from "@/lib/owner";
const program: OwnerProgram = {
  id: "00000000-0000-0000-0000-000000000001",
  university_name: "Example University",
  course_name: "M.Sc. Example",
  level: "master",
  language: "English",
  is_published: true,
  revision: 1,
};
const stats: OwnerOverview = {
  email: "owner@example.test",
  accounts: 3,
  programs: 1,
  published: 1,
  shortlists: 5,
  journeys: 2,
  activity: [],
};
beforeEach(() => {
  db.failLoad = false;
  db.failSave = false;
  db.conflict = false;
  db.rows = [structuredClone(program)];
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  db.rpc.mockReset();
  db.rpc.mockImplementation(
    async (
      name: string,
      args?: {
        p_program?: Partial<OwnerProgram>;
        p_expected_revision?: number | null;
      },
    ) => {
      if (name === "owner_save_program") {
        if (db.failSave)
          return {
            data: null,
            error: { code: db.conflict ? "40001" : "offline" },
          };
        const saved = { ...program, ...args?.p_program, revision: 2 };
        db.rows = [saved];
        return { data: saved, error: null };
      }
      if (db.failLoad) return { data: null, error: { code: "offline" } };
      return {
        data:
          name === "owner_overview"
            ? stats
            : { items: db.rows, total: db.rows.length, page: 0 },
        error: null,
      };
    },
  );
});
afterEach(cleanup);
async function ready() {
  await screen.findByText("owner@example.test");
  await waitFor(() =>
    expect(
      (screen.getByRole("button", { name: "Add program" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false),
  );
}

test("owner tools load confirmed totals and an editable catalogue", async () => {
  render(<OwnerDashboard ownerId="owner" />);
  await ready();
  expect(screen.getByText("Example University")).toBeTruthy();
  expect(
    screen.getByText(
      "Full access to existing planning tools. No paid plan or account quota is currently configured.",
    ),
  ).toBeTruthy();
});
test("failed saves keep edits and never claim success or close the editor", async () => {
  render(<OwnerDashboard ownerId="owner" />);
  await ready();
  fireEvent.click(
    screen.getByRole("button", {
      name: "Edit M.Sc. Example at Example University",
    }),
  );
  fireEvent.change(screen.getByLabelText("Course name"), {
    target: { value: "M.Sc. Updated" },
  });
  db.failSave = true;
  fireEvent.click(screen.getByRole("button", { name: "Save program" }));
  const modal = screen.getByRole("dialog");
  await within(modal).findByRole("alert");
  expect((screen.getByLabelText("Course name") as HTMLInputElement).value).toBe(
    "M.Sc. Updated",
  );
  expect(screen.getByRole("status").textContent).toBe("");
  db.failSave = false;
  fireEvent.click(screen.getByRole("button", { name: "Save program" }));
  await screen.findByText("Program saved and published in the catalogue.");
  expect(db.rpc).toHaveBeenCalledWith(
    "owner_save_program",
    expect.objectContaining({
      p_expected_revision: 1,
      p_program: expect.objectContaining({
        course_name: "M.Sc. Updated",
        id: program.id,
      }),
    }),
  );
});
test("new programs start unpublished and save failures can explain revision conflicts", async () => {
  render(<OwnerDashboard ownerId="owner" />);
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Add program" }));
  expect(
    (
      screen.getByLabelText("Publish in the public catalogue", {
        exact: false,
      }) as HTMLInputElement
    ).checked,
  ).toBe(false);
  fireEvent.change(screen.getByLabelText("University name"), {
    target: { value: "New University" },
  });
  fireEvent.change(screen.getByLabelText("Course name"), {
    target: { value: "New Course" },
  });
  fireEvent.change(screen.getByLabelText("Teaching language"), {
    target: { value: "English" },
  });
  db.failSave = true;
  db.conflict = true;
  fireEvent.click(screen.getByRole("button", { name: "Save program" }));
  await screen.findByText(/This program changed since you opened it/);
});
test("load failures are shown as failures and retry loads the catalogue", async () => {
  db.failLoad = true;
  render(<OwnerDashboard ownerId="owner" />);
  await screen.findByRole("alert");
  expect(screen.queryByText("No programs match these filters.")).toBeNull();
  db.failLoad = false;
  fireEvent.click(screen.getByRole("button", { name: "Retry loading" }));
  await ready();
});
test("account changes immediately clear the owner workspace and pending edits", async () => {
  render(<OwnerDashboard ownerId="owner" />);
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Add program" }));
  act(() => db.authChanged?.("SIGNED_IN", { user: { id: "student" } }));
  expect(screen.getByRole("heading", { name: "Account changed" })).toBeTruthy();
  expect(screen.queryByText("owner@example.test")).toBeNull();
  expect(screen.queryByRole("dialog")).toBeNull();
});
test("CSV exports neutralize spreadsheet formulas and quote commas and double quotes", () => {
  const csv = catalogueCsv([
    {
      ...program,
      university_name: '=HYPERLINK("bad")',
      course_name: "Course, with comma",
    },
  ]);
  expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
  expect(csv).toContain('"Course, with comma"');
  expect(
    programDraftError({
      ...blankProgram,
      university_name: "x",
      course_name: "x",
      language: "English",
    }),
  ).toBeNull();
  expect(
    programDraftError({
      ...blankProgram,
      university_name: " ",
      course_name: "x",
      language: "English",
    }),
  ).not.toBeNull();
  expect(isOwnerOverview({ ...stats, accounts: -1 })).toBe(false);
});

test("catalogue export traverses all pages and creates a CSV download", async () => {
  const create = vi.fn(() => "blob:catalogue");
  URL.createObjectURL = create;
  URL.revokeObjectURL = vi.fn();
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  render(<OwnerDashboard ownerId="owner" />);
  await ready();
  const rows = Array.from({ length: 26 }, (_, index) => ({
    ...program,
    id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
  }));
  db.rpc.mockImplementation(async (name: string, args?: { p_page?: number }) =>
    name === "owner_overview"
      ? { data: stats, error: null }
      : {
          data: {
            items: rows.slice(
              (args?.p_page ?? 0) * 25,
              ((args?.p_page ?? 0) + 1) * 25,
            ),
            total: 26,
            page: args?.p_page ?? 0,
          },
          error: null,
        },
  );
  fireEvent.click(screen.getByRole("button", { name: "Export catalogue" }));
  await screen.findByText(
    "Catalogue exported. Includes published and unpublished entries.",
  );
  expect(db.rpc).toHaveBeenCalledWith("owner_programs", {
    p_query: "",
    p_state: "all",
    p_page: 1,
  });
  expect(create).toHaveBeenCalledOnce();
  expect(click).toHaveBeenCalledOnce();
  click.mockRestore();
});

test("invalid export data reports failure instead of producing a partial download", async () => {
  const create = vi.fn(() => "blob:catalogue");
  URL.createObjectURL = create;
  render(<OwnerDashboard ownerId="owner" />);
  await ready();
  db.rpc.mockResolvedValue({
    data: { items: [], total: 10, page: 0 },
    error: null,
  });
  fireEvent.click(screen.getByRole("button", { name: "Export catalogue" }));
  await screen.findByText("The catalogue changed during export. Please retry.");
  expect(create).not.toHaveBeenCalled();
});
